import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { TemperatureMonthlyReport } from '@/components/print/TemperatureMonthlyReport';
import type { TemperatureReading } from '@/components/temperature/types';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ month?: string }>;
};

function getMonthRange(month?: string) {
  const now = new Date();
  const base = month && /^\d{4}-\d{2}$/.test(month) ? new Date(`${month}-01T00:00:00`) : now;
  const start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function TemperaturePrintPage({ params, searchParams }: PageProps) {
  await auth();
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const monthStr = resolvedSearchParams?.month || new Date().toISOString().slice(0, 7);

  const { start, end } = getMonthRange(monthStr);
  const instrument = await prisma.instrument.findUnique({
    where: { id },
  });

  if (!instrument) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        Instrument introuvable.
      </div>
    );
  }

  const readings = await prisma.temperatureReading.findMany({
    where: {
      instrumentId: id,
      recordedAt: { gte: start, lte: end },
      isInvalid: false,
    },
    orderBy: { recordedAt: 'asc' },
  });

  const settingsItems = await prisma.setting.findMany();
  const settings = settingsItems.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  const formattedReadings: TemperatureReading[] = readings.map(r => ({
    id: r.id,
    value: r.value,
    period: r.period as TemperatureReading['period'],
    recordedAt: r.recordedAt.toISOString(),
    measuredAt: r.recordedAt.toISOString(),
    isOutOfRange: r.isOutOfRange,
    correctiveAction: r.correctiveAction,
    recordedBy: r.recordedBy,
  }));

  const formattedInstrument = {
    id: instrument.id,
    name: instrument.name,
    type: instrument.type,
    unit: instrument.unit,
    targetMin: instrument.targetMin,
    targetMax: instrument.targetMax,
    location: instrument.location,
  };

  return (
    <div className="bg-[var(--color-surface)] min-h-screen">
       <div className="max-w-[210mm] mx-auto py-8 px-4 print:p-0">
         <TemperatureMonthlyReport 
           instrument={formattedInstrument}
           readings={formattedReadings}
           month={monthStr}
           settings={settings}
         />
       </div>
    </div>
  );
}
