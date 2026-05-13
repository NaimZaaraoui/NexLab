import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

type TargetPayload = {
  testId?: string | null;
  testCode?: string;
  testName?: string;
  controlMode?: string;
  mean?: number;
  sd?: number;
  minAcceptable?: number | null;
  maxAcceptable?: number | null;
  unit?: string | null;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });
    const targets = Array.isArray(body?.targets) ? (body.targets as TargetPayload[]) : [];

    if (targets.length === 0) {
      return NextResponse.json({ error: 'Aucune cible fournie' }, { status: 400 });
    }

    await prisma.$transaction(
      targets.map((target) => {
        const testCode = String(target.testCode || '').trim();
        const testName = String(target.testName || '').trim();
        const controlMode = String(target.controlMode || 'STATISTICAL').trim().toUpperCase();
        const mean = Number(target.mean);
        const sd = Number(target.sd);
        const minAcceptable =
          target.minAcceptable === null || target.minAcceptable === undefined ? null : Number(target.minAcceptable);
        const maxAcceptable =
          target.maxAcceptable === null || target.maxAcceptable === undefined ? null : Number(target.maxAcceptable);

        const statisticalMode = controlMode === 'STATISTICAL';
        const acceptanceMode = controlMode === 'ACCEPTANCE_RANGE';

        if (!statisticalMode && !acceptanceMode) {
          throw new Error(`Mode QC invalide pour ${testCode || testName || 'paramètre inconnu'}`);
        }

        if (!testCode || !testName || !Number.isFinite(mean)) {
          throw new Error(`Cible invalide pour ${testCode || testName || 'paramètre inconnu'}`);
        }

        if (statisticalMode && (!Number.isFinite(sd) || sd <= 0)) {
          throw new Error(`SD invalide pour ${testCode || testName || 'paramètre inconnu'}`);
        }

        if (
          acceptanceMode &&
          (!Number.isFinite(minAcceptable) ||
            !Number.isFinite(maxAcceptable) ||
            (minAcceptable !== null && maxAcceptable !== null && minAcceptable >= maxAcceptable))
        ) {
          throw new Error(`Plage d'acceptation invalide pour ${testCode || testName || 'paramètre inconnu'}`);
        }

        const normalizedSd = statisticalMode ? sd : null;
        const normalizedMinAcceptable =
          acceptanceMode ? minAcceptable : mean - (Number(normalizedSd) * 2);
        const normalizedMaxAcceptable =
          acceptanceMode ? maxAcceptable : mean + (Number(normalizedSd) * 2);

        return prisma.qcTarget.upsert({
          where: {
            lotId_testCode: {
              lotId: id,
              testCode,
            },
          },
          update: {
            testId: target.testId ? String(target.testId) : null,
            testName,
            controlMode,
            mean,
            sd: normalizedSd,
            minAcceptable: normalizedMinAcceptable,
            maxAcceptable: normalizedMaxAcceptable,
            unit: target.unit ? String(target.unit) : null,
          },
          create: {
            lotId: id,
            testId: target.testId ? String(target.testId) : null,
            testCode,
            testName,
            controlMode,
            mean,
            sd: normalizedSd,
            minAcceptable: normalizedMinAcceptable,
            maxAcceptable: normalizedMaxAcceptable,
            unit: target.unit ? String(target.unit) : null,
          },
        });
      })
    );

    const updatedLot = await prisma.qcLot.findUnique({
      where: { id },
      include: {
        targets: {
          orderBy: [{ testName: 'asc' }, { testCode: 'asc' }],
        },
      },
    });

    await createAuditLog({
      action: 'qc.targets_upsert',
      severity: 'WARN',
      entity: 'qc_lot',
      entityId: id,
      details: { 
        targetsCount: targets.length,
        targets: targets.map(t => ({
          code: t.testCode,
          name: t.testName,
          mean: t.mean,
          sd: t.sd,
          mode: t.controlMode,
          range: t.minAcceptable && t.maxAcceptable ? `${t.minAcceptable}-${t.maxAcceptable}` : null
        }))
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updatedLot);
  } catch (error) {
    console.error('Erreur POST /api/qc/lots/[id]/targets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la configuration des cibles QC' },
      { status: 500 }
    );
  }
}
