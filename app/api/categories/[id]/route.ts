
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { categorySchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = categorySchema.parse(body);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: validated.name,
        parentId: validated.parentId || null,
        description: validated.description
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Optional: Check for children or products before delete
    await prisma.category.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
