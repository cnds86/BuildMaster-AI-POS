
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const log = await prisma.auditLog.create({
      data: {
        action: body.action,
        userId: body.userId,
        userName: body.userName,
        details: body.details,
        timestamp: new Date(body.timestamp),
        severity: body.severity,
        resourceId: body.resourceId
      }
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save audit log' }, { status: 500 });
  }
}
