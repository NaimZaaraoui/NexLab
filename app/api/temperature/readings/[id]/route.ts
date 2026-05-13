import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });
  const user = guard.session.user;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const action = String(body?.action || 'update');

    const existing = await prisma.temperatureReading.findUnique({
      where: { id },
      include: { instrument: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Relevé introuvable.' }, { status: 404 });
    }

    if (existing.isInvalid) {
      return NextResponse.json({ error: 'Ce relevé est déjà annulé.' }, { status: 400 });
    }

    if (action === 'invalidate') {
      const reason = String(body?.reason || '').trim();
      if (!reason) {
        return NextResponse.json({ error: 'Motif requis pour annuler un relevé.' }, { status: 400 });
      }

      const updated = await prisma.temperatureReading.update({
        where: { id },
        data: {
          isInvalid: true,
          invalidReason: reason,
          invalidatedAt: new Date(),
          invalidatedBy: user?.name || user?.email || 'Utilisateur',
          invalidatedById: user?.id || null,
        },
      });

      await createAuditLog({
        action: 'temperature.reading_invalidate',
        severity: 'WARN',
        entity: 'temperature_reading',
        entityId: id,
        details: {
          instrumentId: existing.instrumentId,
          reason,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json(updated);
    }

    const value = body?.value;
    const correctiveAction = body?.correctiveAction;
    const measuredAt = body?.measuredAt ? new Date(body.measuredAt) : null;

    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return NextResponse.json({ error: 'Valeur invalide.' }, { status: 400 });
    }

    const numericValue = Number(value);
    const isOutOfRange =
      numericValue < existing.instrument.targetMin || numericValue > existing.instrument.targetMax;

    if (isOutOfRange && !String(correctiveAction || '').trim()) {
      return NextResponse.json(
        { error: 'Une action corrective est requise pour une valeur hors plage.' },
        { status: 400 }
      );
    }

    const updated = await prisma.temperatureReading.update({
      where: { id },
      data: {
        value: numericValue,
        measuredAt: measuredAt ?? existing.measuredAt,
        isOutOfRange,
        correctiveAction: String(correctiveAction || '').trim() || null,
      },
    });

    await createAuditLog({
      action: 'temperature.reading_update',
      severity: 'INFO',
      entity: 'temperature_reading',
      entityId: id,
      details: {
        instrumentId: existing.instrumentId,
        value: updated.value,
        isOutOfRange: updated.isOutOfRange,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating temperature reading:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du relevé.' },
      { status: 500 }
    );
  }
}
