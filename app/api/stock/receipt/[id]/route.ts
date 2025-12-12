
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { stockReceiptSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = stockReceiptSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.stockReceipt.findUnique({ where: { id } });
      if (!existing) throw new Error("Document not found");

      const doc = await tx.stockReceipt.update({
        where: { id },
        data: {
          referenceNo: validated.referenceNo,
          date: new Date(validated.date),
          status: validated.status,
          warehouseId: validated.warehouseId,
          vendorName: validated.vendorName,
          vendorInvoiceNo: validated.vendorInvoiceNo,
          totalCost: validated.totalCost || 0,
          items: validated.items as any
        }
      });

      // Add to inventory if Completed
      if (existing.status !== 'Completed' && validated.status === 'Completed') {
        for (const item of validated.items) {
          const inv = await tx.inventory.findFirst({
            where: { warehouseId: validated.warehouseId, productId: item.productId }
          });

          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: { increment: item.quantity } }
            });
          } else {
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
      return doc;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update Receipt Error:', error);
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.stockReceipt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
  }
}
