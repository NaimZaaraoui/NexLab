import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });
    const materialId = String(body?.materialId || '').trim();
    const lotNumber = String(body?.lotNumber || '').trim();
    const expiryDateRaw = String(body?.expiryDate || '').trim();
    const openedAtRaw = body?.openedAt ? String(body.openedAt).trim() : null;

    if (!materialId || !lotNumber || !expiryDateRaw) {
      return NextResponse.json({ error: 'Matériel, lot et date d’expiration requis' }, { status: 400 });
    }

    const expiryDate = new Date(expiryDateRaw);
    if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return NextResponse.json({ error: 'La date d’expiration doit être future' }, { status: 400 });
    }

    const lot = await prisma.qcLot.create({
      data: {
        materialId,
        lotNumber,
        expiryDate,
        openedAt: openedAtRaw ? new Date(openedAtRaw) : null,
      },
    });

    await createAuditLog({
      action: 'qc.lot_create',
      severity: 'WARN',
      entity: 'qc_lot',
      entityId: lot.id,
      details: { materialId, lotNumber },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(lot, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/qc/lots:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du lot QC' }, { status: 500 });
  }
}
