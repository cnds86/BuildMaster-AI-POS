
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { stockAdjustmentSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = stockAdjustmentSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.stockAdjustment.findUnique({ where: { id } });
      if (!existing) throw new Error("Document not found");

      const doc = await tx.stockAdjustment.update({
        where: { id },
        data: {
          referenceNo: validated.referenceNo,
          date: new Date(validated.date),
          status: validated.status,
          warehouseId: validated.warehouseId,
          reason: validated.reason,
          items: validated.items as any
        }
      });

      // Apply adjustment if Approved
      if (existing.status !== 'Approved' && validated.status === 'Approved') {
        for (const item of validated.items) {
          const inv = await tx.inventory.findFirst({
            where: { warehouseId: validated.warehouseId, productId: item.productId }
          });

          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: { increment: item.quantity } } // Handles negative quantity automatically
            });
          } else {
            // Only create if positive
            if (item.quantity > 0) {
              await tx.inventory.create({
                data: {
                  warehouseId: validated.warehouseId,
                  productId: item.productId,
                  quantity: item.quantity
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
    console.error('Update Adjustment Error:', error);
    return NextResponse.json({ error: 'Failed to update adjustment' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.stockAdjustment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete adjustment' }, { status: 500 });
  }
}
