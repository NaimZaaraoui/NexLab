import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { differenceInMinutes, subDays, startOfYear, startOfMonth, subMonths, startOfDay } from 'date-fns';
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
    if (!(await checkStatisticsRateLimit(`stats-analyses:${ip}`))) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const { startDate, endDate } = buildRange(range, searchParams.get('from'), searchParams.get('to'));

    const analyses = await prisma.analysis.findMany({
      where: { creationDate: { gte: startDate, lte: endDate } },
      select: {
        id: true,
        status: true,
        isUrgent: true,
        creationDate: true,
        validatedBioAt: true,
        medecinPrescripteur: true,
        results: {
          select: {
            abnormal: true,
            testId: true,
            test: { select: { name: true, categoryId: true, parentId: true, isGroup: true, categoryRel: { select: { name: true } } } },
          },
        },
      },
    });

    // Status distribution
    const statusMap: Record<string, number> = {};
    analyses.forEach(a => {
      const s = a.status || 'pending';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Urgent vs normal by week
    const weeklyMap: Record<string, { week: string; urgent: number; normal: number }> = {};
    analyses.forEach(a => {
      const d = new Date(a.creationDate);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().split('T')[0];
      if (!weeklyMap[key]) weeklyMap[key] = { week: key, urgent: 0, normal: 0 };
      if (a.isUrgent) weeklyMap[key].urgent++;
      else weeklyMap[key].normal++;
    });
    const urgentVsNormal = Object.values(weeklyMap).sort((a, b) => a.week.localeCompare(b.week));

    // TAT by category
    const tatCategoryMap: Record<string, { name: string; totalMin: number; count: number; minVal: number; maxVal: number }> = {};
    analyses.forEach(a => {
      if (!a.validatedBioAt) return;
      const tat = differenceInMinutes(a.validatedBioAt, a.creationDate);
      const seen = new Set<string>();
      a.results.forEach(r => {
        const cat = r.test?.categoryRel?.name || 'Autre';
        if (seen.has(cat)) return;
        seen.add(cat);
        if (!tatCategoryMap[cat]) tatCategoryMap[cat] = { name: cat, totalMin: 0, count: 0, minVal: Infinity, maxVal: -Infinity };
        tatCategoryMap[cat].totalMin += tat;
        tatCategoryMap[cat].count++;
        tatCategoryMap[cat].minVal = Math.min(tatCategoryMap[cat].minVal, tat);
        tatCategoryMap[cat].maxVal = Math.max(tatCategoryMap[cat].maxVal, tat);
      });
    });
    const tatByCategory = Object.values(tatCategoryMap).map(c => ({
      name: c.name,
      avgMin: c.count > 0 ? Math.round(c.totalMin / c.count) : 0,
      minMin: c.minVal === Infinity ? 0 : c.minVal,
      maxMin: c.maxVal === -Infinity ? 0 : c.maxVal,
      count: c.count,
    })).sort((a, b) => b.avgMin - a.avgMin);

    // Abnormal rate by test (top-level tests only)
    const testAbnMap: Record<string, { name: string; total: number; abnormal: number }> = {};
    analyses.forEach(a => {
      a.results.forEach(r => {
        if (r.test?.parentId || r.test?.isGroup) return;
        const name = r.test?.name || 'Inconnu';
        if (!testAbnMap[name]) testAbnMap[name] = { name, total: 0, abnormal: 0 };
        testAbnMap[name].total++;
        if (r.abnormal) testAbnMap[name].abnormal++;
      });
    });
    const abnormalRates = Object.values(testAbnMap)
      .filter(t => t.total >= 5)
      .map(t => ({ name: t.name, total: t.total, abnormal: t.abnormal, rate: Math.round((t.abnormal / t.total) * 100) }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 15);

    // Top prescripteurs
    const prescMap: Record<string, number> = {};
    analyses.forEach(a => {
      if (!a.medecinPrescripteur) return;
      prescMap[a.medecinPrescripteur] = (prescMap[a.medecinPrescripteur] || 0) + 1;
    });
    const topPrescripteurs = Object.entries(prescMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Monthly volume trend
    const monthlyMap: Record<string, { month: string; volume: number; urgent: number }> = {};
    analyses.forEach(a => {
      const d = new Date(a.creationDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, volume: 0, urgent: 0 };
      monthlyMap[key].volume++;
      if (a.isUrgent) monthlyMap[key].urgent++;
    });
    const monthlyVolume = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      kpis: {
        total: analyses.length,
        validated: analyses.filter(a => a.status === 'validated').length,
        pending: analyses.filter(a => a.status === 'pending').length,
        urgent: analyses.filter(a => a.isUrgent).length,
      },
      statusDistribution,
      urgentVsNormal,
      tatByCategory,
      abnormalRates,
      topPrescripteurs,
      monthlyVolume,
    });
  } catch (error) {
    console.error('[API Statistics/Analyses]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
