
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { productSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        inventory: true,
        category: true
      },
      orderBy: { name: 'asc' }
    });
    
    // Transform to match your frontend Product type
    const formattedProducts = products.map(p => ({
      ...p,
      stock: p.inventory.reduce((acc, inv) => acc + inv.quantity, 0), // Aggregate stock
      warehouseInventory: p.inventory,
      category: p.categoryId // Use ID so forms work correctly
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        sku: validatedData.sku,
        barcode: validatedData.barcode,
        categoryId: validatedData.categoryId,
        price: validatedData.price,
        unit: validatedData.unit,
        minStock: validatedData.minStock,
        variants: {
          create: validatedData.variants
        },
        inventory: {
          create: { warehouseId: 'wh1', quantity: validatedData.stock } // Default WH
        }
      },
      include: { variants: true }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
