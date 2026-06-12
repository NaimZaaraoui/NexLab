import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  // In demo mode the database is pre-seeded — skip the check entirely
  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ initialized: true });
  }

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ initialized: userCount > 0 });
  } catch {
    return NextResponse.json({ initialized: false });
  }
}