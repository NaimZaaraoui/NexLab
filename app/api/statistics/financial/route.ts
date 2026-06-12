import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { subDays, startOfYear, startOfMonth, startOfDay, subMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { requireAuthUser } from '@/lib/security/authz';
import { checkStatisticsRateLimit } from '@/lib/security/rate-limit';

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
    if (!(await checkStatisticsRateLimit(`stats-financial:${ip}`))) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const { startDate, endDate } = buildRange(range, searchParams.get('from'), searchParams.get('to'));

    const analyses = await prisma.analysis.findMany({
      where: { creationDate: { gte: startDate, lte: endDate } },
      select: {
        id: true,
        creationDate: true,
        totalPrice: true,
        amountPaid: true,
        paymentStatus: true,
        paymentMethod: true,
        paidAt: true,
        insuranceProvider: true,
        insuranceCoverage: true,
        insuranceShare: true,
        patientShare: true,
      },
    });

    const totalRevenue = analyses.reduce((acc, a) => acc + (a.totalPrice || 0), 0);
    const totalPaid = analyses.reduce((acc, a) => acc + (a.amountPaid || 0), 0);
    const totalInsuranceShare = analyses.reduce((acc, a) => acc + (a.insuranceShare || 0), 0);
    const totalPatientShare = analyses.reduce((acc, a) => acc + (a.patientShare || 0), 0);
    const recoveryRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

    // Payment status breakdown
    const payStatusMap: Record<string, { count: number; amount: number }> = {};
    analyses.forEach(a => {
      const s = a.paymentStatus || 'UNPAID';
      if (!payStatusMap[s]) payStatusMap[s] = { count: 0, amount: 0 };
      payStatusMap[s].count++;
      payStatusMap[s].amount += a.totalPrice || 0;
    });
    const paymentStatusBreakdown = Object.entries(payStatusMap).map(([status, data]) => ({ status, ...data }));

    // Payment method breakdown
    const methodMap: Record<string, number> = {};
    analyses.forEach(a => {
      if (!a.paymentMethod) return;
      methodMap[a.paymentMethod] = (methodMap[a.paymentMethod] || 0) + 1;
    });
    const paymentMethodBreakdown = Object.entries(methodMap).map(([method, count]) => ({ method, count }));

    // Monthly revenue — last 12 months always for trend
    const monthlyData: Record<string, { month: string; label: string; revenue: number; paid: number; count: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM yy', { locale: fr });
      monthlyData[key] = { month: key, label, revenue: 0, paid: 0, count: 0 };
    }
    analyses.forEach(a => {
      const key = format(new Date(a.creationDate), 'yyyy-MM');
      if (monthlyData[key]) {
        monthlyData[key].revenue += a.totalPrice || 0;
        monthlyData[key].paid += a.amountPaid || 0;
        monthlyData[key].count++;
      }
    });
    const monthlyRevenue = Object.values(monthlyData);

    // CNAM by provider
    const providerMap: Record<string, { provider: string; count: number; totalPrice: number; insuranceShare: number; patientShare: number }> = {};
    analyses.forEach(a => {
      if (!a.insuranceProvider) return;
      if (!providerMap[a.insuranceProvider])
        providerMap[a.insuranceProvider] = { provider: a.insuranceProvider, count: 0, totalPrice: 0, insuranceShare: 0, patientShare: 0 };
      providerMap[a.insuranceProvider].count++;
      providerMap[a.insuranceProvider].totalPrice += a.totalPrice || 0;
      providerMap[a.insuranceProvider].insuranceShare += a.insuranceShare || 0;
      providerMap[a.insuranceProvider].patientShare += a.patientShare || 0;
    });
    const cnamByProvider = Object.values(providerMap).sort((a, b) => b.insuranceShare - a.insuranceShare);
    const cnamAnalysesCount = analyses.filter(a => (a.insuranceCoverage || 0) > 0).length;

    // Pending payments
    const pendingAmount = analyses
      .filter(a => a.paymentStatus === 'UNPAID' || a.paymentStatus === 'PARTIAL')
      .reduce((acc, a) => acc + ((a.totalPrice || 0) - (a.amountPaid || 0)), 0);

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalPaid,
        totalInsuranceShare,
        totalPatientShare,
        recoveryRate: Math.round(recoveryRate * 10) / 10,
        pendingAmount,
        cnamAnalysesCount,
        totalAnalyses: analyses.length,
      },
      paymentStatusBreakdown,
      paymentMethodBreakdown,
      monthlyRevenue,
      cnamByProvider,
    });
  } catch (error) {
    console.error('[API Statistics/Financial]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
