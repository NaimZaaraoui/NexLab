import type { Result } from '@/lib/types';
import type { ResultWithRenderCategory } from './types';

export function sortAnalysisResults(results: Result[]): ResultWithRenderCategory[] {
  const sorted: ResultWithRenderCategory[] = [];
  const visited = new Set<string>();

  const addTestAndChildren = (testId: string, renderCategory: string) => {
    if (visited.has(testId)) return;
    const result = results.find((item) => item.testId === testId);
    if (!result) return;

    sorted.push({ ...result, renderCategory });
    visited.add(testId);

    const children = results.filter((item) => item.test?.parentId === testId);
    children.sort((a, b) => (a.test?.rank || 0) - (b.test?.rank || 0));
    children.forEach((child) => addTestAndChildren(child.testId, renderCategory));
  };

  const categoryGroups: Record<string, Result[]> = {};
  const categoriesMeta: Record<string, { rank: number; name: string }> = {};

  results.forEach((result) => {
    const categoryName = result.test?.categoryRel?.name || 'Divers';
    const categoryRank = result.test?.categoryRel?.rank ?? 999;

    if (!categoryGroups[categoryName]) {
      categoryGroups[categoryName] = [];
      categoriesMeta[categoryName] = { rank: categoryRank, name: categoryName };
    }

    categoryGroups[categoryName].push(result);
  });

  const categories = Object.keys(categoryGroups).sort((a, b) => {
    const metaA = categoriesMeta[a];
    const metaB = categoriesMeta[b];
    if (metaA.rank !== metaB.rank) return metaA.rank - metaB.rank;
    return a.localeCompare(b);
  });

  categories.forEach((category) => {
    const categoryResults = categoryGroups[category];
    const topLevel = categoryResults.filter((result) => {
      const parentId = result.test?.parentId;
      return !parentId || !categoryResults.some((parentResult) => parentResult.testId === parentId);
    });

    topLevel.sort((a, b) => (a.test?.rank || 0) - (b.test?.rank || 0));
    topLevel.forEach((result) => addTestAndChildren(result.testId, category));
  });

  results.forEach((result) => {
    if (!visited.has(result.testId)) {
      sorted.push({ ...result, renderCategory: result.test?.categoryRel?.name || 'Divers' });
      visited.add(result.testId);
    }
  });

  return sorted;
}
