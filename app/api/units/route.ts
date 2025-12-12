
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { unitSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = unitSchema.parse(body);

    const unit = await prisma.unit.create({
      data: {
        name: validated.name,
        symbol: validated.symbol,
        category: validated.category,
        baseFactor: validated.baseFactor,
        isBase: validated.isBase
      }
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
