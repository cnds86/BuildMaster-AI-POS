
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { stockAdjustmentSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const adjustments = await prisma.stockAdjustment.findMany({
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(adjustments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = stockAdjustmentSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const doc = await tx.stockAdjustment.create({
        data: {
          referenceNo: validated.referenceNo,
          date: new Date(validated.date),
          status: validated.status,
          warehouseId: validated.warehouseId,
          reason: validated.reason,
          items: validated.items as any
        }
      });

      if (validated.status === 'Approved') {
        for (const item of validated.items) {
          // Adjustments can be positive or negative
          // item.quantity comes in as signed (+5 or -3)
          
          const inv = await tx.inventory.findFirst({
            where: { warehouseId: validated.warehouseId, productId: item.productId }
          });

          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: { increment: item.quantity } } // increment with negative works as decrement
            });
          } else {
            // Only create if adding stock
            if (item.quantity > 0) {
              await tx.inventory.create({
                data: {
                  warehouseId: validated.warehouseId,
                  productId: item.productId,
                  quantity: item.quantity
                }
              });
            } else {
               // Trying to reduce stock that doesn't exist? 
               // Ignore or throw? We'll ignore for safety in this demo.
            }
          }
        }
      }
      return doc;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Adjustment Error:', error);
    return NextResponse.json({ error: 'Failed to process adjustment' }, { status: 500 });
  }
}
