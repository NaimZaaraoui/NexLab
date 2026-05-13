import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyUsers, getUserIdsByRoles } from '@/lib/notifications';
import { requireAuthUser } from '@/lib/authz';
import { getTatMinutes, normalizeTatThresholds } from '@/lib/tat';

export async function GET() {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tatSettings = await prisma.setting.findMany({
      where: { key: { in: ['tat_warn', 'tat_alert'] } },
      select: { key: true, value: true },
    });
    const tatThresholds = normalizeTatThresholds(
      tatSettings.find((row) => row.key === 'tat_warn')?.value,
      tatSettings.find((row) => row.key === 'tat_alert')?.value,
    );

    const total = await prisma.analysis.count();
    
    const totalToday = await prisma.analysis.count({
      where: {
        createdAt: { gte: startOfDay }
      }
    });
    
    const pending = await prisma.analysis.count({ 
      where: { 
        status: 'pending',
        createdAt: { gte: startOfDay }
      } 
    });
    
    const completed = await prisma.analysis.count({
      where: {
        status: { in: ['completed', 'validated_bio'] },
        updatedAt: { gte: startOfDay }
      }
    });
    
    const urgent = await prisma.analysis.count({
      where: {
        results: { some: { abnormal: true } },
        updatedAt: { gte: startOfDay }
      }
    });

    // --- Pipeline Granulaire ---
    const purePending = await prisma.analysis.count({
      where: { 
        status: 'pending',
        results: { none: {} },
        createdAt: { gte: startOfDay }
      }
    });

    const inProgress = await prisma.analysis.count({
      where: {
        status: { in: ['in_progress', 'validated_tech'] },
        createdAt: { gte: startOfDay }
      }
    });

    // --- TAT (Turnaround Time) du jour ---
    const completedToday = await prisma.analysis.findMany({
      where: {
        status: { in: ['completed', 'validated_bio'] },
        updatedAt: { gte: startOfDay }
      },
      select: {
        creationDate: true,
        createdAt: true,
        updatedAt: true,
        validatedTechAt: true,
        validatedBioAt: true,
      }
    });

    let avgTat = 0;
    if (completedToday.length > 0) {
      const totalTat = completedToday.reduce((acc, curr) => {
        return acc + (getTatMinutes(curr) ?? 0);
      }, 0);
      avgTat = Math.round(totalTat / completedToday.length);
    }


    // ── Trend Data Calculation (Last 12 Months) ──
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const trendRaw = await prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as count
      FROM analyses
      WHERE status IN ('completed', 'validated_bio')
        AND createdAt >= ${twelveMonthsAgo.toISOString()}
      GROUP BY month
      ORDER BY month ASC
    ` as { month: string, count: bigint }[];

    // Format trend to ensure we return a consistent array (even if months are missing)
    const rawTrendMap = new Map(trendRaw.map(t => [t.month, Number(t.count)]));
    const trendLabels: string[] = [];
    const trendData: number[] = [];
    const frenchMonths = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trendLabels.push(frenchMonths[d.getMonth()]);
      trendData.push(rawTrendMap.get(mKey) || 0);
    }

    const stats = {
      total,
      totalToday,
      pending,        // Total pending
      purePending,   // Not started
      inProgress,    // Started
      completed,
      urgent,
      tat: avgTat,
      tatWarn: tatThresholds.warnMinutes,
      tatAlert: tatThresholds.alertMinutes,
      trend: {
        labels: trendLabels,
        data: trendData
      },
      revenue: 0 
    };

    // --- TAT Breach Check ---
    try {
      const breachThreshold = new Date(Date.now() - tatThresholds.alertMinutes * 60 * 1000);
      
      const breachedAnalyses = await prisma.analysis.findMany({
        where: {
          status: 'in_progress',
          creationDate: { lt: breachThreshold },
          notifications: {
            none: { type: 'tat_breach' }
          }
        },
        select: { 
          id: true, 
          orderNumber: true, 
          patientFirstName: true, 
          patientLastName: true 
        }
      });

      if (breachedAnalyses.length > 0) {
        const adminIds = await getUserIdsByRoles(['ADMIN']);
        for (const a of breachedAnalyses) {
          await notifyUsers({
            userIds: adminIds,
            type: 'tat_breach',
            title: 'Délai dépassé',
            message: `L'analyse de ${a.patientLastName} ${a.patientFirstName} (ORD-${a.orderNumber}) dépasse ${tatThresholds.alertMinutes} minutes.`,
            analysisId: a.id,
          });
        }
      }
    } catch (e) {
      console.error('Error in TAT breach check:', e);
    }

    return NextResponse.json(stats);


  } catch (error) {
    console.error('Erreur stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
