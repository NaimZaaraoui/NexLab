import { startOfDay } from 'date-fns';
import { prisma } from '@/lib/prisma';

export type AnalysisQcBlocker = {
  materialName: string;
  lotNumber: string;
  status: 'missing' | 'fail';
  tests: string[];
};

export async function getAnalysisQcReadiness(analysisId: string) {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
    include: {
      results: {
        select: {
          testId: true,
        },
      },
    },
  });

  if (!analysis) {
    throw new Error('Analyse non trouvée');
  }

  const analysisTestIds = Array.from(
    new Set(
      analysis.results
        .map((result) => result.testId)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (analysisTestIds.length === 0) {
    return {
      ready: true,
      blockers: [] as AnalysisQcBlocker[],
      relevantLots: 0,
    };
  }

  const today = startOfDay(new Date());
  const relevantLots = await prisma.qcLot.findMany({
    where: {
      isActive: true,
      material: { isActive: true },
      targets: {
        some: {
          testId: { in: analysisTestIds },
        },
      },
    },
    include: {
      material: {
        select: {
          name: true,
        },
      },
      targets: {
        where: {
          testId: { in: analysisTestIds },
        },
        select: {
          testName: true,
          testCode: true,
        },
      },
      results: {
        where: {
          performedAt: { gte: today },
          status: { not: 'cancelled' },
        },
        orderBy: { performedAt: 'desc' },
        take: 1,
        select: {
          status: true,
        },
      },
    },
  });

  const blockers = relevantLots
    .map((lot) => {
      const todayResult = lot.results[0] || null;
      if (todayResult && todayResult.status !== 'fail') {
        return null;
      }

      return {
        materialName: lot.material.name,
        lotNumber: lot.lotNumber,
        status: (todayResult?.status === 'fail' ? 'fail' : 'missing') as 'missing' | 'fail',
        tests: lot.targets.map((target) => target.testName || target.testCode),
      };
    })
    .filter((entry): entry is AnalysisQcBlocker => Boolean(entry));

  return {
    ready: blockers.length === 0,
    blockers,
    relevantLots: relevantLots.length,
  };
}
