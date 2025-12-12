

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { customerSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: { level: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = customerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        code: validated.code,
        phone: validated.phone,
        email: validated.email,
        address: validated.address,
        taxId: validated.taxId,
        loyaltyPoints: validated.loyaltyPoints,
        levelId: validated.levelId || undefined
      },
      include: { level: true }
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}