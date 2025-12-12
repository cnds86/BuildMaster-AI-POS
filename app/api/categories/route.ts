
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { categorySchema } from '../../../lib/validations';

export async function GET() {
  try {
    // Fetch all categories to build tree on frontend
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = categorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        parentId: validated.parentId || null,
        description: validated.description
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
