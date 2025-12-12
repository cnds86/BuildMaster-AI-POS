
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { shiftStartSchema } from '../../../lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const where: any = {};
    if (userId) where.userId = userId;

    const shifts = await prisma.shift.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: 50
    });
    return NextResponse.json(shifts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = shiftStartSchema.parse(body);

    // Check for existing open shift
    const existing = await prisma.shift.findFirst({
      where: {
        userId: validated.userId,
        status: 'Open'
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'User already has an open shift' }, { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        userId: validated.userId,
        branchId: validated.branchId,
        startCash: validated.startCash,
        notes: validated.notes,
        status: 'Open'
      }
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to start shift' }, { status: 500 });
  }
}
