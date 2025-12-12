import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { customerLevelSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = customerLevelSchema.parse(body);

    const level = await prisma.customerLevel.update({
      where: { id },
      data: validated
    });

    return NextResponse.json(level);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer level' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Check if any customers are using this level
    const usage = await prisma.customer.count({ where: { levelId: id } });
    if (usage > 0) {
        return NextResponse.json({ error: 'Cannot delete level assigned to customers' }, { status: 400 });
    }

    await prisma.customerLevel.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer level' }, { status: 500 });
  }
}