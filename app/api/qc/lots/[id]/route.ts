import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;

    const lot = await prisma.qcLot.findUnique({
      where: { id },
      include: {
        material: true,
        targets: {
          orderBy: [{ testName: 'asc' }, { testCode: 'asc' }],
        },
        results: {
          where: {
            status: {
              not: 'cancelled',
            },
          },
          orderBy: { performedAt: 'desc' },
          take: 60,
          include: {
            values: {
              orderBy: [{ testName: 'asc' }, { testCode: 'asc' }],
            },
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: 'Lot QC introuvable' }, { status: 404 });
    }

    return NextResponse.json(lot);
  } catch (error) {
    console.error('Erreur GET /api/qc/lots/[id]:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement du lot QC' }, { status: 500 });
  }
}

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

    const existing = await prisma.qcLot.findUnique({
      where: { id },
      include: {
        material: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lot QC introuvable' }, { status: 404 });
    }

    if (String(body?.action || '') === 'toggle-active') {
      const updated = await prisma.qcLot.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });

      await createAuditLog({
        action: updated.isActive ? 'qc.lot_reactivate' : 'qc.lot_deactivate',
        severity: 'WARN',
        entity: 'qc_lot',
        entityId: updated.id,
        details: { lotNumber: updated.lotNumber, material: existing.material.name, isActive: updated.isActive },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json(updated);
    }

    const lotNumber = String(body?.lotNumber || '').trim();
    const expiryDate = body?.expiryDate ? new Date(body.expiryDate) : null;
    const openedAt = body?.openedAt ? new Date(body.openedAt) : null;

    if (!lotNumber || !expiryDate || Number.isNaN(expiryDate.getTime())) {
      return NextResponse.json({ error: 'Données du lot invalides' }, { status: 400 });
    }

    const updated = await prisma.qcLot.update({
      where: { id },
      data: {
        lotNumber,
        expiryDate,
        openedAt,
      },
    });

    await createAuditLog({
      action: 'qc.lot_update',
      severity: 'WARN',
      entity: 'qc_lot',
      entityId: updated.id,
      details: { lotNumber: updated.lotNumber, material: existing.material.name },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PATCH /api/qc/lots/[id]:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du lot QC' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const meta = getRequestMeta({ headers: request.headers });

    const existing = await prisma.qcLot.findUnique({
      where: { id },
      include: {
        material: { select: { name: true } },
        _count: { select: { results: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lot QC introuvable' }, { status: 404 });
    }

    if (existing._count.results > 0) {
      return NextResponse.json(
        { error: 'Suppression impossible: ce lot possède déjà des résultats QC. Désactivez-le plutôt.' },
        { status: 409 }
      );
    }

    await prisma.qcLot.delete({ where: { id } });

    await createAuditLog({
      action: 'qc.lot_delete',
      severity: 'WARN',
      entity: 'qc_lot',
      entityId: id,
      details: { lotNumber: existing.lotNumber, material: existing.material.name },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/qc/lots/[id]:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du lot QC' }, { status: 500 });
  }
}
