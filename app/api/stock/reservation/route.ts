
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { stockReservationSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const reservations = await prisma.stockReservation.findMany({
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = stockReservationSchema.parse(body);

    const doc = await prisma.stockReservation.create({
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

    // Reservations don't move physical stock in this simple model, 
    // but in a real app they might deduct from 'Available' and move to 'Reserved' column.
    
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Reservation Error:', error);
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}
