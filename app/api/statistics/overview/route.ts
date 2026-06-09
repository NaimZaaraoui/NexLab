import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { differenceInMinutes, startOfDay, subDays, startOfYear, startOfMonth, subMonths } from 'date-fns';
import { requireAuthUser } from '@/lib/authz';
import { checkStatisticsRateLimit } from '@/lib/rate-limit';

function buildDateRange(range: string): { startDate: Date; endDate: Date; prevStart: Date; prevEnd: Date } {
  const endDate = new Date();
  let startDate = startOfDay(new Date());
  let prevStart: Date;
  let prevEnd: Date;

  if (range === '7d') {
    startDate = subDays(startOfDay(new Date()), 7);
    prevStart = subDays(startDate, 7);
    prevEnd = new Date(startDate);
  } else if (range === '30d') {
    startDate = subDays(startOfDay(new Date()), 30);
    prevStart = subDays(startDate, 30);
    prevEnd = new Date(startDate);
  } else if (range === 'month') {
    startDate = startOfMonth(new Date());
    prevStart = startOfMonth(subMonths(new Date(), 1));
    prevEnd = new Date(startDate);
  } else if (range === 'ytd') {
    startDate = startOfYear(new Date());
    prevStart = startOfYear(subDays(startDate, 1));
    prevEnd = new Date(startDate);
  } else {
    startDate = new Date(0);
    prevStart = new Date(0);
    prevEnd = new Date(0);
  }

  return { startDate, endDate, prevStart, prevEnd };
}

export async function GET(request: Request) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
    if (!(await checkStatisticsRateLimit(`stats-overview:${ip}`))) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const customFrom = searchParams.get('from');
    const customTo = searchParams.get('to');

    let { startDate, endDate, prevStart, prevEnd } = buildDateRange(range);

    if (customFrom && customTo) {
      startDate = new Date(customFrom);
      endDate = new Date(customTo);
      const duration = endDate.getTime() - startDate.getTime();
      prevEnd = new Date(startDate);
      prevStart = new Date(startDate.getTime() - duration);
    }

    const [analyses, prevAnalyses] = await Promise.all([
      prisma.analysis.findMany({
        where: { creationDate: { gte: startDate, lte: endDate } },
        select: {
          id: true,
          creationDate: true,
          totalPrice: true,
          patientShare: true,
          insuranceShare: true,
          isUrgent: true,
          status: true,
          validatedBioAt: true,
          patientGender: true,
        },
      }),
      prisma.analysis.findMany({
        where: { creationDate: { gte: prevStart, lte: prevEnd } },
        select: { id: true, totalPrice: true },
      }),
    ]);

    const totalAnalyses = analyses.length;
    const totalRevenue = analyses.reduce((acc, a) => acc + (a.totalPrice || 0), 0);
    const urgentCount = analyses.filter(a => a.isUrgent).length;
    const urgentPercentage = totalAnalyses > 0 ? (urgentCount / totalAnalyses) * 100 : 0;

    let totalTatMinutes = 0;
    let tatCount = 0;
    analyses.forEach(a => {
      if (a.validatedBioAt && a.creationDate) {
        totalTatMinutes += differenceInMinutes(a.validatedBioAt, a.creationDate);
        tatCount++;
      }
    });
    const averageTatMinutes = tatCount > 0 ? Math.round(totalTatMinutes / tatCount) : 0;

    const prevRevenue = prevAnalyses.reduce((acc, a) => acc + (a.totalPrice || 0), 0);
    const prevCount = prevAnalyses.length;
    const revenueVariation = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
    const volumeVariation = prevCount > 0 ? ((totalAnalyses - prevCount) / prevCount) * 100 : null;

    const genderCounts: Record<string, number> = {};
    analyses.forEach(a => {
      const g = a.patientGender || 'Inconnu';
      genderCounts[g] = (genderCounts[g] || 0) + 1;
    });
    const genderDistribution = Object.entries(genderCounts).map(([gender, count]) => ({ gender, count }));

    const timelineMap: Record<string, { date: string; revenue: number; volume: number }> = {};
    analyses.forEach(a => {
      const dateKey = a.creationDate.toISOString().split('T')[0];
      if (!timelineMap[dateKey]) timelineMap[dateKey] = { date: dateKey, revenue: 0, volume: 0 };
      timelineMap[dateKey].revenue += a.totalPrice || 0;
      timelineMap[dateKey].volume += 1;
    });
    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    const [topTestsGroups, totalPatients] = await Promise.all([
      prisma.result.groupBy({
        by: ['testId'],
        _count: { testId: true },
        where: {
          analysis: { creationDate: { gte: startDate, lte: endDate } },
          test: { parentId: null, isGroup: false },
        },
        orderBy: { _count: { testId: 'desc' } },
        take: 10,
      }),
      prisma.patient.count(),
    ]);

    const topTestsIds = topTestsGroups.map(t => t.testId);
    const testDetails = await prisma.test.findMany({
      where: { id: { in: topTestsIds } },
      select: { id: true, name: true, categoryRel: { select: { name: true } } },
    });

    const topTests = topTestsGroups.map(g => {
      const detail = testDetails.find(d => d.id === g.testId);
      return {
        id: g.testId,
        name: detail?.name || 'Test Inconnu',
        category: detail?.categoryRel?.name || 'Général',
        count: g._count.testId,
      };
    });

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalAnalyses,
        urgentPercentage: Math.round(urgentPercentage * 10) / 10,
        averageTatMinutes,
        totalPatients,
        revenueVariation,
        volumeVariation,
      },
      genderDistribution,
      timeline,
      topTests,
    });
  } catch (error) {
    console.error('[API Statistics/Overview]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
