export type RenalTestOption = {
  id: string;
  code?: string | null;
};

const CREATININE_CODES = new Set(['CR', 'CREA', 'CREAT', 'CREATININE']);
const EGFR_CODES = new Set(['DFG', 'EGFR']);

export function normalizeTestCodeForRenal(code?: string | null): string {
  return (code || '').trim().toUpperCase();
}

export function getTestCodeSuffix(code?: string | null): string {
  const normalized = normalizeTestCodeForRenal(code);
  return normalized.includes('-') ? normalized.split('-').pop() || normalized : normalized;
}

export function isCreatinineTestCode(code?: string | null): boolean {
  const normalized = normalizeTestCodeForRenal(code);
  return CREATININE_CODES.has(normalized) || CREATININE_CODES.has(getTestCodeSuffix(normalized));
}

export function isEgfrTestCode(code?: string | null): boolean {
  const normalized = normalizeTestCodeForRenal(code);
  return EGFR_CODES.has(normalized) || EGFR_CODES.has(getTestCodeSuffix(normalized));
}

export function applyRenalAutoSelection(selectedIds: string[], tests: RenalTestOption[]): string[] {
  const selected = new Set(selectedIds);
  const hasCreatinine = tests.some((test) => selected.has(test.id) && isCreatinineTestCode(test.code));
  const egfrTests = tests.filter((test) => isEgfrTestCode(test.code));

  if (hasCreatinine) {
    egfrTests.forEach((test) => selected.add(test.id));
  } else {
    egfrTests.forEach((test) => selected.delete(test.id));
  }

  return Array.from(selected);
}
