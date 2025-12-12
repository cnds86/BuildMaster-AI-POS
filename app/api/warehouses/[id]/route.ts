
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { warehouseSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = warehouseSchema.parse(body);

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: validated
    });

    return NextResponse.json(warehouse);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.warehouse.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete warehouse' }, { status: 500 });
  }
}
