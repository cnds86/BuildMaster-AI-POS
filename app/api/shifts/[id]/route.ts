
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { shiftEndSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = shiftEndSchema.parse(body);

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        endTime: new Date(),
        endCash: validated.endCash,
        notes: validated.notes, // Append or overwrite? Using overwrite for simplicity
        status: 'Closed'
      }
    });

    return NextResponse.json(shift);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to end shift' }, { status: 500 });
  }
}
