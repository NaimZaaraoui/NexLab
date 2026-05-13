import { prisma } from '@/lib/prisma';
import { applyRenalAutoSelection } from '@/lib/renal-tests';

export async function resolveAnalysisTestIds(ids: string[]): Promise<string[]> {
  const catalogTests = await prisma.test.findMany({
    select: {
      id: true,
      code: true,
    },
  });
  const requestedIds = applyRenalAutoSelection(ids, catalogTests);
  const allIds = new Set<string>();

  const fetchChildren = async (testId: string) => {
    if (allIds.has(testId)) return;
    allIds.add(testId);

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { children: true },
    });

    if (!test?.children) return;

    for (const child of test.children) {
      await fetchChildren(child.id);
    }
  };

  for (const testId of requestedIds) {
    await fetchChildren(testId);
  }

  const finalIds = applyRenalAutoSelection(Array.from(allIds), catalogTests);
  for (const testId of finalIds) {
    await fetchChildren(testId);
  }

  return Array.from(allIds);
}
