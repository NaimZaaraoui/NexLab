import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAnyRole } from '@/lib/security/authz';
import { createAuditLog, getRequestMeta } from '@/lib/security/audit';
import { evaluateAcceptanceRange, evaluateRunStatus, evaluateWestgard, type QcValueFlag } from '@/lib/clinical/qc';
import { processAccumulationForTarget } from '@/lib/clinical/qc-accumulation';
import { getUserIdsByRoles, notifyUsers } from '@/lib/communications/notifications';

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
      isExcluded: boolean;
      excludeReason: string | null;
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

      let isExcluded = false;
      let excludeReason: string | null = null;

      if (target.controlMode === 'STATISTICAL' && target.sd && target.sd > 0) {
        sd = target.sd;
        // zScore is always calculated against Fab target for internal reference
        zScore = Number(((measured - target.mean) / target.sd).toFixed(3));

        if (target.phase === 'ACCUMULATION') {
          evaluation = { flag: 'accumulation' };
          
          if (Math.abs(zScore) > 3) {
            isExcluded = true;
            excludeReason = 'GROSS_ERROR';
          }
        } else {
          // ROUTINE: use meanLoc and sdLoc if available
          const effectiveMean = target.meanLoc ?? target.mean;
          const effectiveSd = target.sdLoc ?? target.sd;
          const effectiveZScore = Number(((measured - effectiveMean) / effectiveSd).toFixed(3));

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

          evaluation = evaluateWestgard(
            effectiveZScore,
            previous
              .map((entry) => entry.zScore)
              .filter((entry): entry is number => Number.isFinite(entry))
          );
          // Keep zScore relative to target.mean for standard display, or replace? 
          // Usually Westgard runs on local Z-score.
          zScore = effectiveZScore;
        }
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
        isExcluded,
        excludeReason,
      });
      if (!isExcluded && evaluation.flag !== 'accumulation') {
        flags.push(evaluation.flag);
      }
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

    const phaseTransitions = [];
    for (const pv of preparedValues) {
      if (pv.controlMode === 'STATISTICAL' && targetMap.get(pv.testCode)?.id) {
        const targetId = targetMap.get(pv.testCode)!.id;
        try {
          const accRes = await processAccumulationForTarget(targetId, pv.measured);
          if (accRes.transitioned) {
            phaseTransitions.push(accRes);
          }
        } catch (e) {
          console.error(`Erreur accumulation pour ${pv.testCode}:`, e);
        }
      }
    }

    return NextResponse.json({ ...result, phaseTransitions }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/qc/lots/[id]/results:', error);
    return NextResponse.json({ error: 'Erreur lors de la saisie du résultat QC' }, { status: 500 });
  }
}
