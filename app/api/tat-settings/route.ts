import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthUser } from '@/lib/security/authz';
import { normalizeTatThresholds } from '@/lib/analysis/tat';

export async function GET() {
  const guard = await requireAuthUser();
  if (!guard.ok) return guard.error;

  const rows = await prisma.setting.findMany({
    where: { key: { in: ['tat_warn', 'tat_alert'] } },
    select: { key: true, value: true },
  });

  const thresholds = normalizeTatThresholds(
    rows.find((row) => row.key === 'tat_warn')?.value,
    rows.find((row) => row.key === 'tat_alert')?.value,
  );

  return NextResponse.json({
    tatWarn: thresholds.warnMinutes,
    tatAlert: thresholds.alertMinutes,
  });
}
