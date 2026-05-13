import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { notifyUsers, getUserIdsByRoles } from '@/lib/notifications';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function POST(request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });
  const user = guard.session.user;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { value, period, correctiveAction, measuredAt } = body as {
      value?: number;
      period?: string;
      correctiveAction?: string;
      measuredAt?: string;
    };

    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return NextResponse.json({ error: 'Valeur invalide.' }, { status: 400 });
    }
    if (period !== 'matin' && period !== 'soir') {
      return NextResponse.json({ error: 'Période invalide.' }, { status: 400 });
    }

    const instrument = await prisma.instrument.findUnique({ where: { id } });
    if (!instrument) {
      return NextResponse.json({ error: 'Instrument introuvable.' }, { status: 404 });
    }

    const measuredDate = measuredAt ? new Date(measuredAt) : new Date();
    const recordedDate = toStartOfDay(measuredDate);

    const existing = await prisma.temperatureReading.findFirst({
      where: {
        instrumentId: id,
        period,
        recordedDate,
        isInvalid: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Une mesure a déjà été enregistrée pour cette période aujourd’hui.' },
        { status: 400 }
      );
    }

    const numericValue = Number(value);
    const isOutOfRange = numericValue < instrument.targetMin || numericValue > instrument.targetMax;

    if (isOutOfRange && !correctiveAction?.trim()) {
      return NextResponse.json(
        { error: 'Une action corrective est requise pour une valeur hors plage.' },
        { status: 400 }
      );
    }

    const reading = await prisma.temperatureReading.create({
      data: {
        instrumentId: id,
        value: numericValue,
        period,
        recordedDate,
        measuredAt: measuredDate,
        isOutOfRange,
        correctiveAction: correctiveAction?.trim() || null,
        recordedBy: user?.name || user?.email || 'Utilisateur',
        recordedById: user?.id || null,
      },
    });

    await createAuditLog({
      action: 'temperature.reading_create',
      severity: isOutOfRange ? 'WARN' : 'INFO',
      entity: 'temperature_reading',
      entityId: reading.id,
      details: {
        instrumentId: id,
        value: reading.value,
        period: reading.period,
        isOutOfRange: reading.isOutOfRange,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    if (isOutOfRange) {
      const adminIds = await getUserIdsByRoles(['ADMIN', 'TECHNICIEN'], user?.id);
      await notifyUsers({
        userIds: adminIds,
        type: 'temperature_alert',
        title: 'Température hors plage',
        message: `${instrument.name} · ${reading.value}${instrument.unit} (${reading.period})`,
      });
    }

    return NextResponse.json({
      reading,
      instrument,
    });
  } catch (error) {
    console.error('Error creating temperature reading:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l’enregistrement du relevé.' },
      { status: 500 }
    );
  }
}
