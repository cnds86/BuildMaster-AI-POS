
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  let user = null;

  try {
    user = await prisma.user.findFirst({
      where: {
        username,
        password // In production, use bcrypt comparison
      }
    });
  } catch (error) {
    console.error("Database authentication failed (using fallback):", error);
    // Proceed to fallback logic below
  }

  // FALLBACK: Allow demo login if database fails or user not found
  if (!user) {
    // Robust check for demo users
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanUser === 'admin' && cleanPass === '123') {
       user = {
         id: 'u1-demo',
         username: 'admin',
         password: '123',
         name: 'Owner Admin (Demo)',
         role: 'Admin',
         email: 'admin@buildmaster.com',
         avatarUrl: 'https://ui-avatars.com/api/?name=Owner+Admin&background=0ea5e9&color=fff',
         department: 'Management',
         branchId: 'b1',
       } as any;
    } else if (cleanUser === 'manager' && cleanPass === '123') {
       user = {
         id: 'u2-demo',
         username: 'manager',
         password: '123',
         name: 'Manager Somchai (Demo)',
         role: 'Manager',
         email: 'manager@buildmaster.com',
         avatarUrl: 'https://ui-avatars.com/api/?name=Manager+Somchai&background=8b5cf6&color=fff',
         department: 'Sales',
         branchId: 'b1',
       } as any;
    } else if (cleanUser === 'staff' && cleanPass === '123') {
       user = {
         id: 'u3-demo',
         username: 'staff',
         password: '123',
         name: 'Staff Somsri (Demo)',
         role: 'Staff',
         email: 'staff@buildmaster.com',
         avatarUrl: 'https://ui-avatars.com/api/?name=Staff+Somsri&background=10b981&color=fff',
         department: 'Warehouse',
         branchId: 'b1',
       } as any;
    } else if (cleanUser === 'cashier' && cleanPass === '123') {
       user = {
         id: 'u4-demo',
         username: 'cashier',
         password: '123',
         name: 'Cashier Noi (Demo)',
         role: 'Cashier',
         email: 'cashier@buildmaster.com',
         avatarUrl: 'https://ui-avatars.com/api/?name=Cashier+Noi&background=f97316&color=fff',
         department: 'Sales',
         branchId: 'b1',
       } as any;
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return NextResponse.json({ user: userWithoutPassword });
}
