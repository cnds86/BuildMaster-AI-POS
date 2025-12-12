
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { warehouseSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { locations: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(warehouses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = warehouseSchema.parse(body);

    const warehouse = await prisma.warehouse.create({
      data: validated
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
