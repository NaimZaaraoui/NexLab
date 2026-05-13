import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';

function getTodayStart() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function GET() {
  const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE', 'MEDECIN']);
  if (!guard.ok) return guard.error;

  try {
    const instruments = await prisma.instrument.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    if (instruments.length === 0) {
      return NextResponse.json({
        totalInstruments: 0,
        missingCount: 0,
        alertCount: 0,
        instruments: [],
      });
    }

    const start = getTodayStart();
    const readings = await prisma.temperatureReading.findMany({
      where: {
        instrumentId: { in: instruments.map((i) => i.id) },
        recordedDate: start,
        isInvalid: false,
      },
    });

    const readingMap = new Map<string, typeof readings>();
    readings.forEach((reading) => {
      const list = readingMap.get(reading.instrumentId) || [];
      list.push(reading);
      readingMap.set(reading.instrumentId, list);
    });

    let missingCount = 0;
    let alertCount = 0;

    const summary = instruments.map((instrument) => {
      const todays = readingMap.get(instrument.id) || [];
      const morningDone = todays.some((r) => r.period === 'matin');
      const eveningDone = todays.some((r) => r.period === 'soir');
      const hasAlert = todays.some((r) => r.isOutOfRange);

      if (!morningDone || !eveningDone) missingCount += 1;
      if (hasAlert) alertCount += 1;

      return {
        id: instrument.id,
        name: instrument.name,
        morningDone,
        eveningDone,
        hasAlert,
      };
    });

    return NextResponse.json({
      totalInstruments: instruments.length,
      missingCount,
      alertCount,
      instruments: summary,
    });
  } catch (error) {
    console.error('Error loading temperature summary:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du résumé température.' },
      { status: 500 }
    );
  }
}
