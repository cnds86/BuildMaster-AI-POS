
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { stockReservationSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = stockReservationSchema.parse(body);

    const doc = await prisma.stockReservation.update({
      where: { id },
      data: {
        referenceNo: validated.referenceNo,
        date: new Date(validated.date),
        expiryDate: new Date(validated.expiryDate),
        status: validated.status,
        warehouseId: validated.warehouseId,
        customerName: validated.customerName,
        items: validated.items as any
      }
    });

    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.stockReservation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 });
  }
}
