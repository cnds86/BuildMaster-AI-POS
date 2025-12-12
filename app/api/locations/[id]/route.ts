
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { locationSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = locationSchema.parse(body);
    
    const fullCode = `${validated.zone}-${validated.rack}-${validated.shelf}-${validated.bin}`;

    const location = await prisma.storageLocation.update({
      where: { id },
      data: {
        ...validated,
        fullCode
      }
    });

    return NextResponse.json(location);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.storageLocation.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
