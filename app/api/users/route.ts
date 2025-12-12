

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { userSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = userSchema.parse(body);

    const user = await prisma.user.create({
      data: {
        username: validated.username,
        password: validated.password!, // Required for create
        name: validated.name,
        role: validated.role,
        email: validated.email,
        avatarUrl: validated.avatarUrl,
        department: validated.department,
        branchId: validated.branchId
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
