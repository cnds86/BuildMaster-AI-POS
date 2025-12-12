
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { branchSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = branchSchema.parse(body);

    const branch = await prisma.branch.update({
      where: { id },
      data: validated
    });

    return NextResponse.json(branch);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.branch.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}
