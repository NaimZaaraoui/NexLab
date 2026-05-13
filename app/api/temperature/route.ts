import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: Request) {
  const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE', 'MEDECIN']);
  if (!guard.ok) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const instruments = await prisma.instrument.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });

    if (instruments.length === 0) {
      return NextResponse.json([]);
    }

    const { start } = getTodayRange();
    const instrumentIds = instruments.map((item) => item.id);

    const [todayReadings, lastReadings] = await Promise.all([
      prisma.temperatureReading.findMany({
        where: {
          instrumentId: { in: instrumentIds },
          recordedDate: start,
          isInvalid: false,
        },
        orderBy: { recordedAt: 'desc' },
      }),
      prisma.temperatureReading.findMany({
        where: { instrumentId: { in: instrumentIds }, isInvalid: false },
        orderBy: { recordedAt: 'desc' },
      }),
    ]);

    const todayByInstrument = new Map<string, typeof todayReadings>();
    todayReadings.forEach((reading) => {
      const list = todayByInstrument.get(reading.instrumentId) || [];
      list.push(reading);
      todayByInstrument.set(reading.instrumentId, list);
    });

    const lastByInstrument = new Map<string, typeof lastReadings[number]>();
    for (const reading of lastReadings) {
      if (!lastByInstrument.has(reading.instrumentId)) {
        lastByInstrument.set(reading.instrumentId, reading);
      }
    }

    const statusPriority: Record<string, number> = {
      alert: 0,
      missing: 1,
      empty: 2,
      ok: 3,
    };

    const payload = instruments
      .map((instrument) => {
        const todays = todayByInstrument.get(instrument.id) || [];
        const lastReading = lastByInstrument.get(instrument.id) || null;
        const morningDone = todays.some((r) => r.period === 'matin');
        const eveningDone = todays.some((r) => r.period === 'soir');
        const hasAlert = todays.some((r) => r.isOutOfRange);

        let todayStatus: 'ok' | 'alert' | 'missing' | 'empty' = 'empty';
        if (todays.length === 0) {
          todayStatus = 'empty';
        } else if (hasAlert) {
          todayStatus = 'alert';
        } else if (!morningDone || !eveningDone) {
          todayStatus = 'missing';
        } else {
          todayStatus = 'ok';
        }

        return {
          ...instrument,
          todayReadings: todays,
          lastReading,
          morningDone,
          eveningDone,
          todayStatus,
        };
      })
      .sort((a, b) => (statusPriority[a.todayStatus] ?? 9) - (statusPriority[b.todayStatus] ?? 9));

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error loading temperature instruments:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des instruments.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });

  try {
    const body = await request.json();
    const { name, type, targetMin, targetMax, unit, location } = body as {
      name?: string;
      type?: string;
      targetMin?: number;
      targetMax?: number;
      unit?: string;
      location?: string;
    };

    if (!name || !type || targetMin === undefined || targetMax === undefined) {
      return NextResponse.json(
        { error: 'Nom, type et plage cible sont requis.' },
        { status: 400 }
      );
    }

    if (Number(targetMin) >= Number(targetMax)) {
      return NextResponse.json(
        { error: 'La température minimale doit être inférieure à la température maximale.' },
        { status: 400 }
      );
    }

    const instrument = await prisma.instrument.create({
      data: {
        name,
        type,
        targetMin: Number(targetMin),
        targetMax: Number(targetMax),
        unit: unit || '°C',
        location: location || null,
      },
    });

    await createAuditLog({
      action: 'temperature.instrument_create',
      severity: 'INFO',
      entity: 'instrument',
      entityId: instrument.id,
      details: {
        name: instrument.name,
        type: instrument.type,
        targetMin: instrument.targetMin,
        targetMax: instrument.targetMax,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(instrument, { status: 201 });
  } catch (error) {
    console.error('Error creating instrument:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l’instrument.' },
      { status: 500 }
    );
  }
}
