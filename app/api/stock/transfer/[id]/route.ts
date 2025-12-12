import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { stockTransferSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = stockTransferSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Get current status to check if we are transitioning to Approved
      const existing = await tx.stockTransfer.findUnique({ where: { id } });
      if (!existing) throw new Error("Document not found");

      // Update Document
      const transfer = await tx.stockTransfer.update({
        where: { id },
        data: {
          referenceNo: validated.referenceNo,
          date: new Date(validated.date),
          status: validated.status,
          sourceWarehouseId: validated.sourceWarehouseId,
          targetWarehouseId: validated.targetWarehouseId,
          items: validated.items as any
        }
      });

      // If status changed to Approved, execute movement
      if (existing.status !== 'Approved' && validated.status === 'Approved') {
         for (const item of validated.items) {
          // 1. Decrement Source
          const sourceInv = await tx.inventory.findFirst({
            where: { warehouseId: validated.sourceWarehouseId, productId: item.productId }
          });

          if (sourceInv) {
            await tx.inventory.update({
              where: { id: sourceInv.id },
              data: { quantity: { decrement: item.quantity } }
            });
          } else {
             throw new Error(`Insufficient stock in source for product ${item.productId}`);
          }

          // 2. Increment Target
          const targetInv = await tx.inventory.findFirst({
             where: { warehouseId: validated.targetWarehouseId, productId: item.productId }
          });

          if (targetInv) {
            await tx.inventory.update({
              where: { id: targetInv.id },
              data: { quantity: { increment: item.quantity } }
            });
          } else {
            await tx.inventory.create({
              data: {
                warehouseId: validated.targetWarehouseId,
                productId: item.productId,
                quantity: item.quantity
              }
            });
          }
        }
      }

      return transfer;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update Transfer Error:', error);
    return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Allow deleting Approved items as per user request (act as Cancel)
    
    await prisma.stockTransfer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 });
  }
}