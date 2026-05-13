import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    if (String(body?.action || '') !== 'toggle-active') {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const existing = await prisma.qcLot.findUnique({
      where: { id },
      select: { id: true, lotNumber: true, isActive: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lot QC introuvable' }, { status: 404 });
    }

    const updated = await prisma.qcLot.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await createAuditLog({
      action: updated.isActive ? 'qc.lot_reactivate' : 'qc.lot_deactivate',
      severity: 'WARN',
      entity: 'qc_lot',
      entityId: updated.id,
      details: { lotNumber: updated.lotNumber, isActive: updated.isActive },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PATCH /api/qc/lots/[id]/status:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du lot QC' }, { status: 500 });
  }
}
