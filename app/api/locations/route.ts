
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { locationSchema } from '../../../lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = locationSchema.parse(body);

    const fullCode = `${validated.zone}-${validated.rack}-${validated.shelf}-${validated.bin}`;

    const location = await prisma.storageLocation.create({
      data: {
        ...validated,
        fullCode
      }
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
