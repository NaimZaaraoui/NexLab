'use server';

import { prisma } from '@/lib/prisma';

export async function exportTestsAction() {
  const tests = await prisma.test.findMany({
    include: { categoryRel: true, parent: true },
    orderBy: [
      { categoryRel: { rank: 'asc' } },
      { rank: 'asc' },
    ],
  });

  return tests.map((t) => ({
    Code: t.code,
    Nom: t.name,
    Catégorie: t.categoryRel?.name || '',
    Unité: t.unit || '',
    'Valeur Min': t.minValue ?? '',
    'Valeur Max': t.maxValue ?? '',
    'Valeur Min (H)': t.minValueM ?? '',
    'Valeur Max (H)': t.maxValueM ?? '',
    'Valeur Min (F)': t.minValueF ?? '',
    'Valeur Max (F)': t.maxValueF ?? '',
    'Prix': t.price,
    'Type de Résultat': t.resultType,
    'Décimales': t.decimals ?? 1,
    "Type d'échantillon": t.sampleType || '',
    'Récipient': t.sampleContainer || '',
    'Options': t.options || '',
    'Ordre': t.rank,
    'Est un groupe': t.isGroup,
    'Est optionnel': t.isOptional,
    'Code Parent': t.parent?.code || '',
  }));
}
