
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { stockReceiptSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const receipts = await prisma.stockReceipt.findMany({
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(receipts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = stockReceiptSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const doc = await tx.stockReceipt.create({
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

      if (validated.status === 'Completed') {
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Receipt Error:', error);
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 });
  }
}
