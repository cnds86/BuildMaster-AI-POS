
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { saleSchema } from '../../../lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {};
    
    if (customerId) whereClause.customerId = customerId;
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        items: true,
        customer: {
          select: { name: true, code: true }
        }
      },
      orderBy: { date: 'desc' },
      take: limit
    });

    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, total, paymentMethod, customerId, source = 'pos' } = saleSchema.parse(body);

    // Use a transaction to ensure Sale creation and Inventory Updates happen atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          total,
          paymentMethod,
          syncStatus: 'synced', // In a real offline-first app, this might be 'pending' if offline
          customerId: customerId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              sellPrice: item.sellPrice,
              sellUnit: 'unit' // Simplified, assumes validated by frontend
            }))
          }
        },
        include: { items: true }
      });

      // 2. Deduct Inventory
      const DEFAULT_WAREHOUSE_ID = 'wh1'; // In production, this comes from settings/context

      for (const item of items) {
        let deductQty = item.quantity;
        
        // Handle conversion logic if variant
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (variant && variant.conversionFactor > 0) {
             if (variant.conversionFactor >= 1) {
                deductQty = item.quantity * variant.conversionFactor;
             }
          }
        }

        // Try specific variant inventory first
        const variantInv = await tx.inventory.findUnique({
          where: {
            warehouseId_productId_variantId: {
              warehouseId: DEFAULT_WAREHOUSE_ID,
              productId: item.productId,
              variantId: item.variantId || "" 
            }
          }
        });

        if (variantInv) {
          // Check for back-office constraint
          if (source === 'back-office' && variantInv.quantity < item.quantity) {
             throw new Error(`Insufficient stock for product variant (Requested: ${item.quantity}, Available: ${variantInv.quantity}). Back-office sales cannot result in negative stock.`);
          }

          await tx.inventory.update({
            where: { id: variantInv.id },
            data: { quantity: { decrement: item.quantity } } // Deduct directly from specific variant stock
          });
        } else {
          // Fallback to base product inventory
          const prodInventory = await tx.inventory.findFirst({
            where: {
              warehouseId: DEFAULT_WAREHOUSE_ID,
              productId: item.productId,
              variantId: null // Ensure we get the base record
            }
          });

          if (prodInventory) {
             // Check for back-office constraint
             if (source === 'back-office' && prodInventory.quantity < deductQty) {
                throw new Error(`Insufficient stock for product (Requested: ${deductQty}, Available: ${prodInventory.quantity}). Back-office sales cannot result in negative stock.`);
             }

             await tx.inventory.update({
               where: { id: prodInventory.id },
               data: { quantity: { decrement: deductQty } }
             });
          } else {
             // Inventory record doesn't exist at all
             if (source === 'back-office') {
                throw new Error(`No inventory record found for product ID ${item.productId}. Back-office sales cannot result in negative stock.`);
             }
             
             // If POS, we might strictly technically need a record to decrement, 
             // but often POS will create negative record if missing. 
             // For this demo, assuming base record exists from seed or creation.
          }
        }
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Sale Processing Error:', error);
    const message = error.message || 'Transaction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
