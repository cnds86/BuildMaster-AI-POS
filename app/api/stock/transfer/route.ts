
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      orderBy: { date: 'desc' }
    });
    // Parse items JSON if needed, though usually Prisma handles JSON types automatically as objects
    return NextResponse.json(transfers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Expected: { sourceId, targetId, items: [{ productId, quantity }], reference, date }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Document
      const transfer = await tx.stockTransfer.create({
        data: {
          referenceNo: body.referenceNo,
          date: new Date(body.date),
          status: body.status, // If 'Approved', we execute move immediately
          sourceWarehouseId: body.sourceWarehouseId,
          targetWarehouseId: body.targetWarehouseId,
          items: body.items // Storing JSON for history
        }
      });

      // 2. Execute Movement if Approved
      if (body.status === 'Approved') {
        for (const item of body.items) {
          // Decrement Source
          const sourceInv = await tx.inventory.findFirst({
            where: { warehouseId: body.sourceWarehouseId, productId: item.productId }
          });

          if (sourceInv) {
            await tx.inventory.update({
              where: { id: sourceInv.id },
              data: { quantity: { decrement: item.quantity } }
            });
          } else {
             throw new Error(`Insufficient stock in source for product ${item.productId}`);
          }

          // Increment Target (Upsert)
          const targetInv = await tx.inventory.findFirst({
             where: { warehouseId: body.targetWarehouseId, productId: item.productId }
          });

          if (targetInv) {
            await tx.inventory.update({
              where: { id: targetInv.id },
              data: { quantity: { increment: item.quantity } }
            });
          } else {
            await tx.inventory.create({
              data: {
                warehouseId: body.targetWarehouseId,
                productId: item.productId,
                quantity: item.quantity
              }
            });
          }
        }
      }

      return transfer;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Transfer Error:', error);
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 });
  }
}
