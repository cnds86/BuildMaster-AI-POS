

import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { customerSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = customerSchema.parse(body);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: validated.name,
        code: validated.code,
        phone: validated.phone,
        email: validated.email,
        address: validated.address,
        taxId: validated.taxId,
        loyaltyPoints: validated.loyaltyPoints,
        levelId: validated.levelId || null // Allow clearing level
      },
      include: { level: true }
    });

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Optional: Check if customer has sales before deleting?
    // For now, we allow delete (cascade or set null depending on schema)
    // Assuming schema sets Sale.customerId to null on delete or restricts it.
    
    await prisma.customer.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}