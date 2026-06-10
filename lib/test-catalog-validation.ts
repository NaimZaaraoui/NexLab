import { extractFormulaDependencies, validateFormula } from '@/lib/calculated-tests';
import type { TestCreateInput, TestUpdateInput } from '@/lib/validators';

type CatalogTest = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  isGroup: boolean;
  resultType: string;
  options: string | null;
  decimals: number | null;
};

type PersistedTestDataInput = TestCreateInput | TestUpdateInput;

export function normalizeDropdownOptions(options: string | null | undefined) {
  if (!options) {
    return null;
  }

  const normalized = Array.from(
    new Set(
      options
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

  return normalized.length > 0 ? normalized.join(', ') : null;
}

export function buildTestPersistenceData(
  payload: PersistedTestDataInput,
  categoryId: string | null
) {
  const isGroup = Boolean(payload.isGroup);
  const resultType = isGroup ? 'text' : payload.resultType;
  const numericLike = !isGroup && (resultType === 'numeric' || resultType === 'calculated');

  return {
    code: payload.code,
    name: payload.name,
    unit: numericLike ? payload.unit ?? null : null,
    minValue: numericLike ? payload.minValue ?? null : null,
    maxValue: numericLike ? payload.maxValue ?? null : null,
    minValueM: numericLike ? payload.minValueM ?? null : null,
    maxValueM: numericLike ? payload.maxValueM ?? null : null,
    minValueF: numericLike ? payload.minValueF ?? null : null,
    maxValueF: numericLike ? payload.maxValueF ?? null : null,
    decimals: numericLike ? payload.decimals ?? 1 : 1,
    resultType,
    categoryId: categoryId ?? null,
    parentId: payload.parentId ?? null,
    options:
      resultType === 'dropdown'
        ? normalizeDropdownOptions(payload.options)
        : resultType === 'calculated'
          ? payload.formula ?? null
          : payload.options ?? null,
    isGroup,
    isOptional: Boolean(payload.isOptional),
    sampleType: payload.sampleType ?? null,
    sampleContainer: payload.sampleContainer ?? null,
    price: payload.price ?? 0,
  };
}

export function assertValidParentAssignment(
  tests: CatalogTest[],
  parentId: string | null | undefined,
  currentTestId?: string
) {
  if (!parentId) {
    return;
  }

  const testsById = new Map(tests.map((test) => [test.id, test]));
  const parent = testsById.get(parentId);

  if (!parent) {
    throw new Error('Le panel parent sélectionné est introuvable.');
  }

  if (!parent.isGroup) {
    throw new Error('Le parent sélectionné doit être un panel ou bilan.');
  }

  if (!currentTestId) {
    return;
  }

  if (parentId === currentTestId) {
    throw new Error('Un test ne peut pas être son propre parent.');
  }

  const visited = new Set<string>();
  let cursor: CatalogTest | undefined = parent;

  while (cursor?.parentId) {
    if (cursor.parentId === currentTestId) {
      throw new Error('Cette hiérarchie créerait une boucle entre panels.');
    }

    if (visited.has(cursor.parentId)) {
      break;
    }

    visited.add(cursor.parentId);
    cursor = testsById.get(cursor.parentId);
  }
}

export function assertGroupCanBeConverted(
  tests: CatalogTest[],
  currentTestId: string | undefined,
  nextIsGroup: boolean
) {
  if (!currentTestId || nextIsGroup) {
    return;
  }

  const hasChildren = tests.some((test) => test.parentId === currentTestId);
  if (hasChildren) {
    throw new Error("Ce panel contient déjà des tests enfants. Retirez-les ou déplacez-les avant de le convertir en test individuel.");
  }
}

export function assertCalculatedDependentsRemainValid(
  tests: CatalogTest[],
  currentTestId: string | undefined,
  nextPayload: PersistedTestDataInput
) {
  if (!currentTestId) {
    return;
  }

  const currentTest = tests.find((test) => test.id === currentTestId);
  if (!currentTest) {
    return;
  }

  const simulatedCurrent = {
    id: currentTest.id,
    code: nextPayload.code,
    name: currentTest.name,
    parentId: nextPayload.parentId ?? null,
    isGroup: Boolean(nextPayload.isGroup),
    resultType: nextPayload.isGroup ? 'text' : nextPayload.resultType,
    options:
      nextPayload.isGroup
        ? null
        : nextPayload.resultType === 'calculated'
          ? nextPayload.formula ?? null
          : currentTest.options,
    decimals: nextPayload.decimals ?? currentTest.decimals ?? 1,
  };

  const availableTests = tests
    .filter((test) => test.id !== currentTestId)
    .map((test) => ({
      code: test.code,
      resultType: test.resultType,
      options: test.options,
      decimals: test.decimals,
      isGroup: test.isGroup,
    }));

  availableTests.push({
    code: simulatedCurrent.code,
    resultType: simulatedCurrent.resultType,
    options: simulatedCurrent.options,
    decimals: simulatedCurrent.decimals,
    isGroup: simulatedCurrent.isGroup,
  });

  const impactedDependents: string[] = [];

  for (const test of tests) {
    if (test.id === currentTestId || test.resultType !== 'calculated' || !test.options?.trim()) {
      continue;
    }

    let dependencies: string[];
    try {
      dependencies = extractFormulaDependencies(test.options);
    } catch {
      continue;
    }

    if (!dependencies.includes(currentTest.code)) {
      continue;
    }

    const validation = validateFormula(test.options, availableTests, test.code);
    if (!validation.valid) {
      impactedDependents.push(`${test.code}: ${validation.error || 'formule invalide'}`);
    }
  }

  if (impactedDependents.length > 0) {
    throw new Error(`Cette modification casserait des tests calculés dépendants: ${impactedDependents.join(' ; ')}`);
  }
}
