import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, startOfYear, startOfMonth, startOfDay } from 'date-fns';
import { requireAuthUser } from '@/lib/authz';
import { checkStatisticsRateLimit } from '@/lib/rate-limit';

function buildRange(range: string, from?: string | null, to?: string | null) {
  const endDate = new Date();
  let startDate = startOfDay(new Date());

  if (from && to) return { startDate: new Date(from), endDate: new Date(to) };

  if (range === '7d') startDate = subDays(startOfDay(new Date()), 7);
  else if (range === '30d') startDate = subDays(startOfDay(new Date()), 30);
  else if (range === 'month') startDate = startOfMonth(new Date());
  else if (range === 'ytd') startDate = startOfYear(new Date());
  else if (range === 'all') startDate = new Date(0);

  return { startDate, endDate };
}

export async function GET(request: Request) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
    if (!(await checkStatisticsRateLimit(`stats-patients:${ip}`))) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const { startDate, endDate } = buildRange(range, searchParams.get('from'), searchParams.get('to'));

    const [analyses, totalPatients, newPatients] = await Promise.all([
      prisma.analysis.findMany({
        where: { creationDate: { gte: startDate, lte: endDate } },
        select: {
          id: true,
          patientId: true,
          patientGender: true,
          patientAge: true,
          creationDate: true,
        },
      }),
      prisma.patient.count(),
      prisma.patient.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    ]);

    // Unique patients in period
    const patientIdsInPeriod = new Set(analyses.filter(a => a.patientId).map(a => a.patientId!));
    const uniquePatientsInPeriod = patientIdsInPeriod.size;

    // Recurring patients (had analyses before this period)
    const prevAnalysesPatients = await prisma.analysis.findMany({
      where: {
        patientId: { in: Array.from(patientIdsInPeriod) },
        creationDate: { lt: startDate },
      },
      select: { patientId: true },
      distinct: ['patientId'],
    });
    const recurringCount = prevAnalysesPatients.length;
    const newVisitors = uniquePatientsInPeriod - recurringCount;

    // Gender distribution
    const genderMap: Record<string, number> = {};
    analyses.forEach(a => {
      const g = a.patientGender || 'Inconnu';
      genderMap[g] = (genderMap[g] || 0) + 1;
    });
    const genderDistribution = Object.entries(genderMap).map(([gender, count]) => ({ gender, count }));

    // Age pyramid — using patientAge field, grouped by bracket
    const ageBrackets: Record<string, { bracket: string; M: number; F: number; order: number }> = {
      '0-17': { bracket: '0–17 ans', M: 0, F: 0, order: 0 },
      '18-39': { bracket: '18–39 ans', M: 0, F: 0, order: 1 },
      '40-59': { bracket: '40–59 ans', M: 0, F: 0, order: 2 },
      '60+': { bracket: '60+ ans', M: 0, F: 0, order: 3 },
      'Inconnu': { bracket: 'Âge inconnu', M: 0, F: 0, order: 4 },
    };

    analyses.forEach(a => {
      const age = a.patientAge;
      let key = 'Inconnu';
      if (age !== null && age !== undefined) {
        if (age < 18) key = '0-17';
        else if (age < 40) key = '18-39';
        else if (age < 60) key = '40-59';
        else key = '60+';
      }
      const gender = a.patientGender === 'F' ? 'F' : 'M';
      ageBrackets[key][gender]++;
    });

    const agePyramid = Object.values(ageBrackets)
      .sort((a, b) => a.order - b.order)
      .map(({ bracket, M, F }) => ({ bracket, M, F }));

    // Top patients by analysis count in period
    const patientCountMap: Record<string, number> = {};
    analyses.forEach(a => {
      if (!a.patientId) return;
      patientCountMap[a.patientId] = (patientCountMap[a.patientId] || 0) + 1;
    });
    const topPatientIds = Object.entries(patientCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    const topPatientDetails = await prisma.patient.findMany({
      where: { id: { in: topPatientIds } },
      select: { id: true, firstName: true, lastName: true, gender: true },
    });

    const topPatients = topPatientIds.map(id => {
      const detail = topPatientDetails.find(p => p.id === id);
      return {
        id,
        name: detail ? `${detail.lastName} ${detail.firstName}` : 'Inconnu',
        gender: detail?.gender || '?',
        count: patientCountMap[id],
      };
    });

    // Analyses per patient frequency histogram
    const freqMap: Record<number, number> = {};
    Object.values(patientCountMap).forEach(count => {
      freqMap[count] = (freqMap[count] || 0) + 1;
    });
    const frequencyHistogram = Object.entries(freqMap)
      .map(([visits, patients]) => ({ visits: Number(visits), patients }))
      .sort((a, b) => a.visits - b.visits)
      .slice(0, 10);

    return NextResponse.json({
      kpis: {
        totalPatients,
        newPatients,
        uniquePatientsInPeriod,
        recurringCount,
        newVisitors,
      },
      genderDistribution,
      agePyramid,
      topPatients,
      frequencyHistogram,
    });
  } catch (error) {
    console.error('[API Statistics/Patients]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
