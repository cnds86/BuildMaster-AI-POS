
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { settingsSchema } from '../../../lib/validations';

// Settings usually just have 1 row, ID 1 or 'default'
const SETTINGS_ID = 'default-settings';

export async function GET() {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: SETTINGS_ID }
    });

    if (!settings) {
      // Return default defaults if not found
      return NextResponse.json({
        companyName: 'MAHAXAY',
        language: 'en',
        tax: { enabled: true, rate: 7, calculationMode: 'excluded', displayOnReceipt: true }
        // ... incomplete mock
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = settingsSchema.parse(body);

    const settings = await prisma.systemSetting.upsert({
      where: { id: SETTINGS_ID },
      update: validated,
      create: {
        id: SETTINGS_ID,
        ...validated
      }
    });

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
  }
}
