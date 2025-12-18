
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { userSchema } from '../../../lib/validations';
import { hashPassword } from '../../../lib/auth';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        avatarUrl: true,
        department: true,
        branchId: true,
        // Exclude password
      }
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

    // Hash Password
    const hashedPassword = await hashPassword(validated.password!);

    const user = await prisma.user.create({
      data: {
        username: validated.username,
        password: hashedPassword, 
        name: validated.name,
        role: validated.role,
        email: validated.email,
        avatarUrl: validated.avatarUrl,
        department: validated.department,
        branchId: validated.branchId
      }
    });

    // Remove password from response
    const { password: _, ...safeUser } = user;

    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data or User already exists' }, { status: 400 });
  }
}
