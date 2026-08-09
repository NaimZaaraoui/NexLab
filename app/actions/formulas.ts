'use server';

import { prisma } from '@/lib/db/prisma';
import { requireAnyRole } from '@/lib/security/authz';
import {
  validateFormula,
  evaluateFormula,
  extractFormulaDependencies,
} from '@/lib/clinical/calculated-tests';
import type { Test } from '@/lib/core/types';

export type FormulaTest = Pick<
  Test,
  'id' | 'code' | 'name' | 'options' | 'decimals' | 'unit' | 'categoryId' | 'resultType'
> & { categoryName?: string };

export type FormulaStatus = 'valid' | 'broken' | 'empty';

export type FormulaWithStatus = FormulaTest & {
  status: FormulaStatus;
  dependencies: string[];
  brokenDeps: string[];
};

export async function getCalculatedTests(): Promise<FormulaWithStatus[]> {
  const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN', 'RECEPTIONNISTE']);
  if (!guard.ok) return [];

  const tests = await prisma.test.findMany({
    where: { resultType: 'calculated', isGroup: false },
    orderBy: [{ rank: 'asc' }, { name: 'asc' }],
    include: { categoryRel: true },
  });

  const allTests = await prisma.test.findMany({
    where: { isGroup: false },
    select: { code: true, resultType: true, isGroup: true, options: true, decimals: true },
  });

  return tests.map((t) => {
    const formula = t.options?.trim() || '';
    const deps = formula ? extractFormulaDependencies(formula) : [];

    let status: FormulaStatus = 'empty';
    let brokenDeps: string[] = [];

    if (formula) {
      const validation = validateFormula(formula, allTests, t.code);
      if (validation.valid) {
        status = 'valid';
      } else {
        status = 'broken';
        const allCodes = new Set(allTests.map((a) => a.code.toUpperCase()));
        brokenDeps = deps.filter((d) => !allCodes.has(d.toUpperCase()));
      }
    }

    return {
      id: t.id,
      code: t.code,
      name: t.name,
      options: t.options,
      decimals: t.decimals,
      unit: t.unit,
      categoryId: t.categoryId,
      resultType: t.resultType,
      categoryName: (t as unknown as { categoryRel?: { name: string } }).categoryRel?.name,
      status,
      dependencies: deps,
      brokenDeps,
    };
  });
}

export async function getAllNumericTests() {
  const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN', 'RECEPTIONNISTE']);
  if (!guard.ok) return [];

  const tests = await prisma.test.findMany({
    where: { resultType: 'numeric', isGroup: false },
    select: { id: true, code: true, name: true },
    orderBy: [{ rank: 'asc' }, { name: 'asc' }],
  });

  return tests;
}

export async function testFormulaLive(
  formula: string,
  values: Record<string, string>,
  decimals: number
): Promise<{ ok: boolean; result?: string; error?: string }> {
  const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN', 'RECEPTIONNISTE']);
  if (!guard.ok) return { ok: false, error: 'Non autorisé' };

  if (!formula.trim()) return { ok: false, error: 'Formule vide' };

  const evaluation = evaluateFormula(formula, values, decimals);
  if (evaluation.ok) {
    return { ok: true, result: evaluation.value ?? undefined };
  }

  const errorMessages: Record<string, string> = {
    missing_dependency: 'Valeur manquante pour un test source',
    invalid_number: 'Valeur non numérique',
    division_by_zero: 'Division par zéro',
    invalid_formula: 'Formule invalide',
  };

  return { ok: false, error: errorMessages[evaluation.error ?? ''] ?? 'Erreur inconnue' };
}
