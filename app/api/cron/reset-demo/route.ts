import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEMO_PASSWORD = 'DemoLab2026!';
const DEMO_SEED_DATE = new Date('2026-01-01T00:00:00.000Z');

async function resetDemo() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  await prisma.$transaction(async (tx) => {
    // Remove anything created after the original seed
    await tx.analysis.deleteMany({
      where: { creationDate: { gt: DEMO_SEED_DATE } },
    });
    await tx.patient.deleteMany({
      where: { createdAt: { gt: DEMO_SEED_DATE } },
    });

    // Wipe transient data unconditionally
    await tx.notification.deleteMany({});
    await tx.auditLog.deleteMany({});
    await tx.auditLogArchive.deleteMany({});
    await tx.stockMovement.deleteMany({});

    // Reset user passwords (visitors may have changed them)
    await tx.user.updateMany({
      where: { email: { in: ['admin.demo@nexlab.dz', 'tech.demo@nexlab.dz'] } },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    // Reset lab settings to demo values
    const settings: Array<{ key: string; value: string }> = [
      { key: 'lab_name', value: 'NexLab — Démonstration' },
      { key: 'lab_subtitle', value: 'Centre de Santé de Services de Base' },
      { key: 'lab_parent', value: 'Données fictives — Demo uniquement' },
      { key: 'lab_phone', value: '+213 000 000 000' },
      { key: 'lab_email', value: 'demo@nexlab.dz' },
      { key: 'lab_address', value: '12 Rue de la Science, Alger' },
      { key: 'lab_director', value: 'Dr. Démo Directeur' },
    ];

    for (const s of settings) {
      await tx.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value },
      });
    }
  });
}

export async function GET(request: NextRequest) {
  if (process.env.DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Not a demo instance' }, { status: 403 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    await resetDemo();
    console.log('[cron] Demo database reset at', new Date().toISOString());
    return NextResponse.json({ ok: true, resetAt: new Date().toISOString() });
  } catch (error) {
    console.error('[cron] Demo reset failed:', error);
    return NextResponse.json(
      { error: 'Reset failed', details: String(error) },
      { status: 500 }
    );
  }
}
