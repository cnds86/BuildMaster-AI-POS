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
    const { items, total, paymentMethod, customerId } = saleSchema.parse(body);

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
             // Example: Selling 1 Box (factor 12) -> deduct 12 pieces from base stock
             // Note: This logic depends on whether you track Variant Stock or Base Stock. 
             // We assume Base Stock tracking for simplicity here.
             // If factor < 1 (Bundle), it's handled differently, but generally we normalize to base.
             if (variant.conversionFactor >= 1) {
                deductQty = item.quantity * variant.conversionFactor;
             } else {
                // Bundle case (1 Main = 0.5 Variant? Rare). Usually 1 Box = 12 Pieces.
                // If we sell 1 piece (factor 1/12), we deduct 1 piece.
                // If we sell 1 Box (factor 12), we deduct 12 pieces.
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
             await tx.inventory.update({
               where: { id: prodInventory.id },
               data: { quantity: { decrement: deductQty } }
             });
          }
        }
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Sale Processing Error:', error);
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
  }
}