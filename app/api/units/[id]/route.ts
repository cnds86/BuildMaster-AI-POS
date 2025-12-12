
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { unitSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = unitSchema.parse(body);

    const unit = await prisma.unit.update({
      where: { id },
      data: validated
    });

    return NextResponse.json(unit);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update unit' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.unit.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete unit' }, { status: 500 });
  }
}
