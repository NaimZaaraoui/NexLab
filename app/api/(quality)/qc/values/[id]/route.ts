import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAnyRole } from '@/lib/security/authz';
import { createAuditLog, getRequestMeta } from '@/lib/security/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    if (body.action !== 'exclude') {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const value = await prisma.qcValue.findUnique({
      where: { id },
      include: {
        result: true,
      },
    });

    if (!value) {
      return NextResponse.json({ error: 'Valeur QC introuvable' }, { status: 404 });
    }

    if (value.isExcluded) {
      return NextResponse.json({ error: 'Valeur déjà exclue' }, { status: 400 });
    }

    const target = await prisma.qcTarget.findUnique({
      where: {
        lotId_testCode: {
          lotId: value.result.lotId,
          testCode: value.testCode,
        },
      },
    });

    if (!target) {
      return NextResponse.json({ error: 'Cible introuvable' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.qcValue.update({
        where: { id },
        data: {
          isExcluded: true,
          excludeReason: body.reason || 'OPERATOR_FLAG',
        },
      });

      // Recalculer validPoints
      const validValuesCount = await tx.qcValue.count({
        where: {
          result: { lotId: target.lotId },
          testCode: target.testCode,
          isExcluded: false,
        },
      });

      // Si le compteur retombe en dessous de 20, on repasse en accumulation
      if (validValuesCount < 20 && target.phase === 'ROUTINE') {
        await tx.qcTarget.update({
          where: { id: target.id },
          data: {
            validPoints: validValuesCount,
            phase: 'ACCUMULATION',
            meanLoc: null,
            sdLoc: null,
          },
        });
      } else if (validValuesCount >= 20 && target.phase === 'ROUTINE') {
        // Optionnel : recalculer meanLoc et sdLoc si on exclut un point qui était dans les 20 ?
        // Pour l'instant on décrémente juste le validPoints s'il était très haut.
        // Mais en vrai le recalcul complet de meanLoc est complexe s'il change les z-scores.
        // On se contente de mettre à jour le validPoints.
        await tx.qcTarget.update({
          where: { id: target.id },
          data: { validPoints: validValuesCount },
        });
      } else {
        await tx.qcTarget.update({
          where: { id: target.id },
          data: { validPoints: validValuesCount },
        });
      }
    });

    await createAuditLog({
      action: 'qc.value_exclude',
      severity: 'WARN',
      entity: 'qc_value',
      entityId: id,
      details: {
        reason: body.reason,
        testCode: value.testCode,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PATCH /api/qc/values/[id]:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'exclusion de la valeur' }, { status: 500 });
  }
}
