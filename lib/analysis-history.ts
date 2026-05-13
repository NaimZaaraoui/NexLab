import { prisma } from '@/lib/prisma';

export async function getPreviousResultsMapForAnalysis(analysisId: string) {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
    include: {
      patient: true,
      specimens: {
        orderBy: [
          { sampleType: 'asc' },
          { createdAt: 'asc' },
        ],
      },
      results: {
        include: {
          test: {
            include: {
              children: true,
              parent: true,
              categoryRel: true,
            },
          },
        },
      },
    },
  });

  if (!analysis) {
    return null;
  }

  const previousAnalysis = await prisma.analysis.findFirst({
    where: {
      patientId: analysis.patientId,
      status: { in: ['completed', 'validated_bio'] },
      creationDate: {
        lt: analysis.creationDate,
      },
    },
    orderBy: {
      creationDate: 'desc',
    },
    include: {
      results: true,
    },
  });

  const previousResults: Record<string, string> = {};
  if (previousAnalysis) {
    previousAnalysis.results.forEach((result) => {
      if (result.value) {
        previousResults[result.testId] = result.value;
      }
    });
  }

  return {
    ...analysis,
    previousResults,
  };
}
