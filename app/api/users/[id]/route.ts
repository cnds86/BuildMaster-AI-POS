

import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { userSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // For updates, password is optional in schema, handle carefully
    const validated = userSchema.parse(body);
    
    const updateData: any = {
      username: validated.username,
      name: validated.name,
      role: validated.role,
      email: validated.email,
      avatarUrl: validated.avatarUrl,
      department: validated.department,
      branchId: validated.branchId
    };

    if (validated.password) {
      updateData.password = validated.password;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
