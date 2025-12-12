
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { stockCountSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const counts = await prisma.stockCount.findMany({
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(counts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stock counts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = stockCountSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Document
      const doc = await tx.stockCount.create({
        data: {
          referenceNo: validated.referenceNo,
          date: new Date(validated.date),
          status: validated.status,
          warehouseId: validated.warehouseId,
          counterName: validated.counterName,
          reason: validated.reason,
          items: validated.items as any 
        }
      });

      // 2. Update Inventory if Completed
      if (validated.status === 'Completed') {
        for (const item of validated.items) {
          if (item.countedQuantity !== undefined) {
            // Find or Create inventory record
            // For simple products (no variants in this specific item context for now, or assumed main)
            const inv = await tx.inventory.findFirst({
              where: { 
                warehouseId: validated.warehouseId, 
                productId: item.productId 
              }
            });

            if (inv) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: { quantity: item.countedQuantity } // Set absolute value
              });
            } else {
              await tx.inventory.create({
                data: {
                  warehouseId: validated.warehouseId,
                  productId: item.productId,
                  quantity: item.countedQuantity
                }
              });
            }
          }
        }
      }
      return doc;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Stock Count Error:', error);
    return NextResponse.json({ error: 'Failed to process stock count' }, { status: 500 });
  }
}
