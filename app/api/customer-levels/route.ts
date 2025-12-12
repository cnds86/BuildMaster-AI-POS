import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { customerLevelSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const levels = await prisma.customerLevel.findMany({
      orderBy: { discountPercentage: 'asc' }
    });
    return NextResponse.json(levels);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customer levels' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = customerLevelSchema.parse(body);

    const level = await prisma.customerLevel.create({
      data: validated
    });

    return NextResponse.json(level, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}