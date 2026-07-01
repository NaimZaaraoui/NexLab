import { prisma } from '@/lib/db/prisma';

export async function processAccumulationForTarget(
  targetId: string,
  measured: number
): Promise<{
  transitioned: boolean;
  excluded: boolean;
  validPoints?: number;
  meanLoc?: number;
  sdLoc?: number;
  phase?: string;
  testCode?: string;
}> {
  const target = await prisma.qcTarget.findUnique({
    where: { id: targetId },
  });

  if (!target) {
    throw new Error(`Cible QC introuvable: ${targetId}`);
  }

  if (target.phase === 'ROUTINE') {
    return { transitioned: false, excluded: false, testCode: target.testCode };
  }

  let isGrossError = false;
  if (target.sd && target.sd > 0) {
    const diff = Math.abs(measured - target.mean);
    if (diff > 3 * target.sd) {
      isGrossError = true;
    }
  }

  if (isGrossError) {
    return { transitioned: false, excluded: true, testCode: target.testCode };
  }

  const newValidPoints = target.validPoints + 1;

  if (newValidPoints < 20) {
    await prisma.qcTarget.update({
      where: { id: targetId },
      data: { validPoints: newValidPoints },
    });
    return { transitioned: false, excluded: false, validPoints: newValidPoints, phase: 'ACCUMULATION', testCode: target.testCode };
  }

  // Calculate meanLoc and sdLoc
  // We need to fetch the 19 previous valid points from the DB
  const previousValues = await prisma.qcValue.findMany({
    where: {
      testCode: target.testCode,
      result: { lotId: target.lotId },
      isExcluded: false,
    },
    orderBy: {
      result: { performedAt: 'desc' },
    },
    take: 19,
    select: { measured: true },
  });

  const allMeasurements = [...previousValues.map(v => v.measured), measured];
  
  const sum = allMeasurements.reduce((a, b) => a + b, 0);
  const meanLoc = sum / allMeasurements.length;
  
  const varianceSum = allMeasurements.reduce((a, b) => a + Math.pow(b - meanLoc, 2), 0);
  const sdLoc = Math.sqrt(varianceSum / (allMeasurements.length - 1));

  await prisma.qcTarget.update({
    where: { id: targetId },
    data: {
      validPoints: newValidPoints,
      phase: 'ROUTINE',
      meanLoc,
      sdLoc,
    },
  });

  return { transitioned: true, excluded: false, meanLoc, sdLoc, testCode: target.testCode };
}
