import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { resultId } = await params;
    const body = await request.json();
    const reason = String(body?.reason || '').trim();
    const meta = getRequestMeta({ headers: request.headers });

    if (!reason) {
      return NextResponse.json({ error: 'Motif d’annulation requis' }, { status: 400 });
    }

    const existing = await prisma.qcResult.findUnique({
      where: { id: resultId },
      include: {
        lot: {
          include: {
            material: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Résultat QC introuvable' }, { status: 404 });
    }

    if (existing.status === 'cancelled') {
      return NextResponse.json({ error: 'Ce résultat QC est déjà annulé' }, { status: 400 });
    }

    const comment = existing.comment ? `${existing.comment}\n[ANNULATION] ${reason}` : `[ANNULATION] ${reason}`;

    const updated = await prisma.qcResult.update({
      where: { id: resultId },
      data: {
        status: 'cancelled',
        comment,
      },
    });

    await createAuditLog({
      action: 'qc.result_cancel',
      severity: 'WARN',
      entity: 'qc_result',
      entityId: updated.id,
      details: {
        lotId: existing.lotId,
        lotNumber: existing.lot.lotNumber,
        material: existing.lot.material.name,
        reason,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PATCH /api/qc/results/[resultId]/invalidate:', error);
    return NextResponse.json({ error: 'Erreur lors de l’annulation du résultat QC' }, { status: 500 });
  }
}
