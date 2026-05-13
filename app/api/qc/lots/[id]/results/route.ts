import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { evaluateAcceptanceRange, evaluateRunStatus, evaluateWestgard, type QcValueFlag } from '@/lib/qc';
import { getUserIdsByRoles, notifyUsers } from '@/lib/notifications';

type QcEntryValue = {
  testCode?: string;
  measured?: number;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });
    const values = Array.isArray(body?.values) ? (body.values as QcEntryValue[]) : [];
    const comment = body?.comment ? String(body.comment).trim() : null;
    const instrumentName = body?.instrumentName ? String(body.instrumentName).trim() : null;

    if (values.length === 0) {
      return NextResponse.json({ error: 'Aucune valeur QC fournie' }, { status: 400 });
    }

    const lot = await prisma.qcLot.findUnique({
      where: { id },
      include: {
        material: true,
        targets: {
          orderBy: [{ testName: 'asc' }, { testCode: 'asc' }],
        },
      },
    });

    if (!lot || !lot.isActive || !lot.material.isActive) {
      return NextResponse.json({ error: 'Lot QC inactif ou introuvable' }, { status: 400 });
    }

    if (new Date(lot.expiryDate) <= new Date()) {
      return NextResponse.json({ error: 'Lot QC expiré, saisie impossible' }, { status: 400 });
    }

    const targetMap = new Map(lot.targets.map((target) => [target.testCode, target]));
    const preparedValues: Array<{
      testId: string | null;
      testCode: string;
      testName: string;
      controlMode: string;
      measured: number;
      mean: number;
      sd: number | null;
      minAcceptable: number | null;
      maxAcceptable: number | null;
      zScore: number | null;
      inAcceptanceRange: boolean | null;
      flag: QcValueFlag;
      rule: string | null;
      unit: string | null;
    }> = [];
    const flags: QcValueFlag[] = [];

    for (const value of values) {
      const testCode = String(value.testCode || '').trim();
      const measured = Number(value.measured);
      if (!testCode || !Number.isFinite(measured)) continue;

      const target = targetMap.get(testCode);
      if (!target) continue;

      let zScore: number | null = null;
      let sd: number | null = null;
      const minAcceptable: number | null = target.minAcceptable;
      const maxAcceptable: number | null = target.maxAcceptable;
      let inAcceptanceRange: boolean | null = null;
      let evaluation: { flag: QcValueFlag; rule?: string } | { flag: QcValueFlag; inAcceptanceRange: boolean };

      if (target.controlMode === 'STATISTICAL' && target.sd && target.sd > 0) {
        const previous = await prisma.qcValue.findMany({
          where: {
            testCode,
            controlMode: 'STATISTICAL',
            result: {
              lotId: id,
            },
          },
          orderBy: {
            result: {
              performedAt: 'desc',
            },
          },
          take: 9,
          select: {
            zScore: true,
          },
        });

        sd = target.sd;
        zScore = Number(((measured - target.mean) / target.sd).toFixed(3));
        evaluation = evaluateWestgard(
          zScore,
          previous
            .map((entry) => entry.zScore)
            .filter((entry): entry is number => Number.isFinite(entry))
        );
      } else {
        if (minAcceptable === null || maxAcceptable === null) continue;
        const acceptanceEvaluation = evaluateAcceptanceRange(measured, minAcceptable, maxAcceptable);
        inAcceptanceRange = acceptanceEvaluation.inAcceptanceRange;
        evaluation = acceptanceEvaluation;
      }

      preparedValues.push({
        testId: target.testId,
        testCode: target.testCode,
        testName: target.testName,
        controlMode: target.controlMode,
        measured,
        mean: target.mean,
        sd,
        minAcceptable,
        maxAcceptable,
        zScore,
        inAcceptanceRange,
        flag: evaluation.flag,
        rule: 'rule' in evaluation ? evaluation.rule || null : null,
        unit: target.unit,
      });
      flags.push(evaluation.flag);
    }

    if (preparedValues.length === 0) {
      return NextResponse.json({ error: 'Aucune valeur ne correspond aux cibles configurées du lot' }, { status: 400 });
    }

    const status = evaluateRunStatus(flags);

    const result = await prisma.qcResult.create({
      data: {
        lotId: id,
        performedBy: guard.userId,
        performedByName: guard.session.user.name || null,
        instrumentName,
        comment,
        status,
        values: {
          create: preparedValues,
        },
      },
      include: {
        values: {
          orderBy: [{ testName: 'asc' }, { testCode: 'asc' }],
        },
      },
    });

    await createAuditLog({
      action: 'qc.result_create',
      severity: status === 'fail' ? 'CRITICAL' : status === 'warn' ? 'WARN' : 'INFO',
      entity: 'qc_result',
      entityId: result.id,
      details: {
        lotId: id,
        status,
        valuesCount: preparedValues.length,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    if (status === 'fail' || status === 'warn') {
      const adminIds = await getUserIdsByRoles(['ADMIN', 'TECHNICIEN'], guard.userId);
      await notifyUsers({
        userIds: adminIds,
        type: 'qc_alert',
        title: status === 'fail' ? 'QC en échec' : 'QC en avertissement',
        message: `${lot.material.name} · Lot ${lot.lotNumber} · ${preparedValues.length} paramètre(s)`,
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/qc/lots/[id]/results:', error);
    return NextResponse.json({ error: 'Erreur lors de la saisie du résultat QC' }, { status: 500 });
  }
}
