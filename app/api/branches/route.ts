
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { branchSchema } from '../../../lib/validations';

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      include: { posMachines: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(branches);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = branchSchema.parse(body);

    const branch = await prisma.branch.create({
      data: validated
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
