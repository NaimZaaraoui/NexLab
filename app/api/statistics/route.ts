import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { differenceInMinutes, startOfDay, subDays, startOfYear } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    let startDate = startOfDay(new Date());
    const endDate = new Date();

    if (range === '7d') startDate = subDays(startDate, 7);
    else if (range === '30d') startDate = subDays(startDate, 30);
    else if (range === 'ytd') startDate = startOfYear(startDate);
    else if (range === 'all') startDate = new Date(0); // far past

    // Fetch analyses for the period
    const analyses = await prisma.analysis.findMany({
      where: { creationDate: { gte: startDate, lte: endDate } },
      select: {
        id: true,
        creationDate: true,
        totalPrice: true,
        patientShare: true,
        insuranceShare: true,
        insuranceProvider: true,
        insuranceCoverage: true,
        isUrgent: true,
        status: true,
        validatedBioAt: true,
      },
    });

    const totalAnalyses = analyses.length;
    const totalRevenue = analyses.reduce((acc, a) => acc + (a.totalPrice || 0), 0);
    const urgentCount = analyses.filter(a => a.isUrgent).length;
    const urgentPercentage = totalAnalyses > 0 ? (urgentCount / totalAnalyses) * 100 : 0;

    // CNAM Financial breakdown
    const totalInsuranceShare = analyses.reduce((acc, a) => acc + (a.insuranceShare || 0), 0);
    const totalPatientShare = analyses.reduce((acc, a) => acc + (a.patientShare || 0), 0);
    const cnamAnalysesCount = analyses.filter(a => a.insuranceCoverage && a.insuranceCoverage > 0).length;

    // CNAM breakdown by provider
    const providerMap: Record<string, { count: number; totalPrice: number; insuranceShare: number; patientShare: number }> = {};
    analyses.forEach(a => {
      if (!a.insuranceProvider) return;
      if (!providerMap[a.insuranceProvider]) {
        providerMap[a.insuranceProvider] = { count: 0, totalPrice: 0, insuranceShare: 0, patientShare: 0 };
      }
      providerMap[a.insuranceProvider].count += 1;
      providerMap[a.insuranceProvider].totalPrice += a.totalPrice || 0;
      providerMap[a.insuranceProvider].insuranceShare += a.insuranceShare || 0;
      providerMap[a.insuranceProvider].patientShare += a.patientShare || 0;
    });

    const cnamByProvider = Object.entries(providerMap).map(([provider, stats]) => ({
      provider,
      ...stats,
    })).sort((a, b) => b.insuranceShare - a.insuranceShare);

    // Calculate Average TAT (Turnaround Time) for completed analyses
    let totalTatMinutes = 0;
    let tatCount = 0;
    analyses.forEach(a => {
      if (a.validatedBioAt && a.creationDate) {
        totalTatMinutes += differenceInMinutes(a.validatedBioAt, a.creationDate);
        tatCount++;
      }
    });
    const averageTatMinutes = tatCount > 0 ? Math.round(totalTatMinutes / tatCount) : 0;

    // Group Timeline Data (Daily/Monthly based on string approach)
    // For smaller ranges, we group daily. For YTD, monthly could be better, but daily is fine to aggregate in client.
    const timelineMap: Record<string, { date: string; revenue: number; volume: number }> = {};
    
    analyses.forEach(a => {
      // YYYY-MM-DD format key
      const dateKey = a.creationDate.toISOString().split('T')[0];
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { date: dateKey, revenue: 0, volume: 0 };
      }
      timelineMap[dateKey].revenue += (a.totalPrice || 0);
      timelineMap[dateKey].volume += 1;
    });

    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Fetch Top 10 Tests dynamically — only parent tests (no sub-tests, no groups)
    const topTestsGroups = await prisma.result.groupBy({
      by: ['testId'],
      _count: { testId: true },
      where: {
        analysis: {
          creationDate: { gte: startDate, lte: endDate }
        },
        test: {
          parentId: null,
          isGroup: false,
        }
      },
      orderBy: { _count: { testId: 'desc' } },
      take: 10,
    });

    // Populate Test Names
    const topTestsIds = topTestsGroups.map(t => t.testId);
    const testDetails = await prisma.test.findMany({
      where: { id: { in: topTestsIds } },
      select: { id: true, name: true, categoryRel: { select: { name: true } } }
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
        urgentPercentage,
        averageTatMinutes,
        totalInsuranceShare,
        totalPatientShare,
        cnamAnalysesCount,
      },
      cnamByProvider,
      timeline,
      topTests
    });
    
  } catch (error) {
    console.error('[API Statistics] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
