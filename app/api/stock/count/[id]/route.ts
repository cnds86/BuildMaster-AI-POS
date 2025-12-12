
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { stockCountSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = stockCountSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Check previous status
      const existing = await tx.stockCount.findUnique({ where: { id } });
      if (!existing) throw new Error("Document not found");

      // Update Document
      const doc = await tx.stockCount.update({
        where: { id },
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

      // Execute Inventory Update if status changes to Completed
      if (existing.status !== 'Completed' && validated.status === 'Completed') {
        for (const item of validated.items) {
          if (item.countedQuantity !== undefined) {
            // Find existing inventory record
            const inv = await tx.inventory.findFirst({
              where: { 
                warehouseId: validated.warehouseId, 
                productId: item.productId 
              }
            });

            if (inv) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: { quantity: item.countedQuantity } // Overwrite with counted value
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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update Count Error:', error);
    return NextResponse.json({ error: 'Failed to update stock count' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Prevent deleting completed counts? (Optional rule)
    await prisma.stockCount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete stock count' }, { status: 500 });
  }
}
