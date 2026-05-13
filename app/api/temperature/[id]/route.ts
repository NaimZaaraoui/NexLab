import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

function getMonthRange(month?: string | null) {
  const now = new Date();
  const base = month && /^\d{4}-\d{2}$/.test(month) ? new Date(`${month}-01T00:00:00`) : now;
  const start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE', 'MEDECIN']);
  if (!guard.ok) return guard.error;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const format = (searchParams.get('format') || '').toLowerCase();
    const { start, end } = getMonthRange(month);

    const instrument = await prisma.instrument.findUnique({
      where: { id },
    });

    if (!instrument) {
      return NextResponse.json({ error: 'Instrument introuvable.' }, { status: 404 });
    }

    const includeInvalid = searchParams.get('includeInvalid') === 'true';

    const readings = await prisma.temperatureReading.findMany({
      where: {
        instrumentId: id,
        recordedAt: {
          gte: start,
          lte: end,
        },
        ...(includeInvalid ? {} : { isInvalid: false }),
      },
      orderBy: { recordedAt: 'asc' },
    });

    if (format === 'csv') {
      const header = [
        'recordedAt',
        'measuredAt',
        'period',
        'value',
        'unit',
        'isOutOfRange',
        'correctiveAction',
        'recordedBy',
      ];

      const escapeCsv = (value: string | number | boolean | null | undefined) => {
        const v = value ?? '';
        return `"${String(v).replaceAll('"', '""')}"`;
      };

      const lines = readings.map((reading) =>
        [
          reading.recordedAt.toISOString(),
          reading.measuredAt.toISOString(),
          reading.period,
          reading.value,
          instrument.unit,
          reading.isOutOfRange,
          reading.correctiveAction,
          reading.recordedBy,
        ]
          .map(escapeCsv)
          .join(',')
      );

      const csv = [header.join(','), ...lines].join('\n');
      const fileName = `temperature_${instrument.name.replace(/\s+/g, '_')}_${start.toISOString().slice(0, 7)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    return NextResponse.json({
      instrument,
      readings,
      month: start.toISOString().slice(0, 7),
    });
  } catch (error) {
    console.error('Error loading instrument details:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement de l’instrument.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });

  try {
    const { id } = await context.params;
    const body = await request.json();
    const action = body?.action as string | undefined;

    const instrument = await prisma.instrument.findUnique({ where: { id } });
    if (!instrument) {
      return NextResponse.json({ error: 'Instrument introuvable.' }, { status: 404 });
    }

    if (action === 'toggle-active') {
      const updated = await prisma.instrument.update({
        where: { id },
        data: { isActive: !instrument.isActive },
      });

      await createAuditLog({
        action: 'temperature.instrument_toggle',
        severity: 'WARN',
        entity: 'instrument',
        entityId: id,
        details: { isActive: updated.isActive },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json(updated);
    }

    const { name, type, targetMin, targetMax, unit, location } = body as {
      name?: string;
      type?: string;
      targetMin?: number;
      targetMax?: number;
      unit?: string;
      location?: string;
    };

    if (targetMin !== undefined && targetMax !== undefined && Number(targetMin) >= Number(targetMax)) {
      return NextResponse.json(
        { error: 'La température minimale doit être inférieure à la température maximale.' },
        { status: 400 }
      );
    }

    const updated = await prisma.instrument.update({
      where: { id },
      data: {
        name: name ?? instrument.name,
        type: type ?? instrument.type,
        targetMin: targetMin !== undefined ? Number(targetMin) : instrument.targetMin,
        targetMax: targetMax !== undefined ? Number(targetMax) : instrument.targetMax,
        unit: unit ?? instrument.unit,
        location: location ?? instrument.location,
      },
    });

    await createAuditLog({
      action: 'temperature.instrument_update',
      severity: 'INFO',
      entity: 'instrument',
      entityId: id,
      details: {
        name: updated.name,
        type: updated.type,
        targetMin: updated.targetMin,
        targetMax: updated.targetMax,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating instrument:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l’instrument.' },
      { status: 500 }
    );
  }
}
