
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // We only support 'void' action for now
    if (body.status !== 'voided') {
       return NextResponse.json({ error: 'Only voiding is supported via update' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the Sale
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!sale) throw new Error("Sale not found");
      if (sale.status === 'voided') throw new Error("Sale is already voided");

      // 2. Update Status
      const updatedSale = await tx.sale.update({
        where: { id },
        data: { status: 'voided' }
      });

      // 3. Restore Inventory
      const DEFAULT_WAREHOUSE_ID = 'wh1'; // Should come from sale metadata or session if stored

      for (const item of sale.items) {
        let restoreQty = item.quantity;
        
        // Handle conversion for variants if necessary (simplified: assume qty stored is sales qty)
        // If your DB stores sales qty in units, we need conversion factor.
        // Assuming we stored 'item.quantity' as sold units. We need to lookup variant to know how much base stock to return.
        
        if (item.variantId) {
           const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
           if (variant && variant.conversionFactor > 0) {
              // Assuming inventory is always tracked in Base Unit
              restoreQty = item.quantity * variant.conversionFactor;
           }
        }

        const inv = await tx.inventory.findFirst({
          where: { 
            warehouseId: DEFAULT_WAREHOUSE_ID, 
            productId: item.productId 
          }
        });

        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: { increment: restoreQty } }
          });
        }
      }

      return updatedSale;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Void Sale Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to void sale' }, { status: 500 });
  }
}
