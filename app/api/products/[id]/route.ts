
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { productSchema } from '../../../../lib/validations';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = productSchema.parse(body);

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: validated.name,
        sku: validated.sku,
        barcode: validated.barcode,
        categoryId: validated.categoryId,
        price: validated.price,
        unit: validated.unit,
        minStock: validated.minStock,
        // For variants, we use deleteMany + create for simplicity in this demo to handle sync
        // In a production app, upsert logic per variant ID is better to preserve variant-specific history
        variants: {
          deleteMany: {},
          create: validated.variants
        }
      },
      include: { variants: true }
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Use transaction to cleanup related data if necessary
    await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.inventory.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
