import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

async function createInstallerPrisma() {
  const connectionString = process.env.DATABASE_URL || 'file:./dev.db';
  const adapter = new PrismaBetterSqlite3({ url: connectionString });
  return new PrismaClient({ adapter });
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prisma = await createInstallerPrisma();
    const userCount = await prisma.user.count();
    await prisma.$disconnect();
    return NextResponse.json({ initialized: userCount > 0 });
  } catch {
    return NextResponse.json({ initialized: false });
  }
}