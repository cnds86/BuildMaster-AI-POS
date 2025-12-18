
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(promotions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const promotion = await prisma.promotion.create({
      data: {
        title: body.title,
        imageUrl: body.imageUrl,
        isActive: body.isActive,
        order: body.order || 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      }
    });

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
  }
}
