
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { userSchema } from '../../../../lib/validations';
import { hashPassword } from '../../../../lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
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

    // Only hash and update if a new password is provided
    if (validated.password) {
      updateData.password = await hashPassword(validated.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
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
