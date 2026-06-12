/**
 * lib/test-classification.ts
 *
 * Centralized test metadata and classification logic
 * Consolidates test categories, code aliases, and classification rules from:
 * - lib/inventory-categories.ts (category definitions)
 * - app/api/categories/reset/route.ts (test ordering)
 * - prisma/seeds/* (test definitions)
 * - components/* (test display logic)
 */

import type { Test } from '@/lib/core/types';

// ============================================================================
// TEST CATEGORIES
// ============================================================================

/**
 * Standard test categories used across the lab system
 * Aligned with typical clinical laboratory organization
 */
export const TEST_CATEGORIES = {
  HEMATOLOGIE: 'Hématologie',
  BIOCHIMIE: 'Biochimie',
  IMMUNOLOGIE: 'Immunologie',
  MICROBIOLOGIE: 'Microbiologie',
  COAGULATION: 'Coagulation',
  UROLOGIE: 'Urologie',
  AUTRE: 'Autre',
} as const;

export type TestCategory = (typeof TEST_CATEGORIES)[keyof typeof TEST_CATEGORIES];

/**
 * Ranking for category display order
 * Lower numbers appear first in UI lists
 */
export const CATEGORY_DISPLAY_ORDER: Record<TestCategory, number> = {
  [TEST_CATEGORIES.HEMATOLOGIE]: 0,
  [TEST_CATEGORIES.BIOCHIMIE]: 1,
  [TEST_CATEGORIES.IMMUNOLOGIE]: 2,
  [TEST_CATEGORIES.MICROBIOLOGIE]: 3,
  [TEST_CATEGORIES.COAGULATION]: 4,
  [TEST_CATEGORIES.UROLOGIE]: 5,
  [TEST_CATEGORIES.AUTRE]: 6,
};

/**
 * Icon identifiers for each category
 * Icons used in UI display of test lists
 */
export const CATEGORY_ICONS: Record<TestCategory, string | null> = {
  [TEST_CATEGORIES.HEMATOLOGIE]: 'droplets',
  [TEST_CATEGORIES.BIOCHIMIE]: 'flask-conical',
  [TEST_CATEGORIES.IMMUNOLOGIE]: 'shield-check',
  [TEST_CATEGORIES.MICROBIOLOGIE]: 'microscope',
  [TEST_CATEGORIES.COAGULATION]: 'activity',
  [TEST_CATEGORIES.UROLOGIE]: 'test-tube',
  [TEST_CATEGORIES.AUTRE]: 'package',
};

// ============================================================================
// TEST CODE ALIASES
// ============================================================================

/**
 * Standard test code aliases
 * Maps different naming conventions (international vs local) to standard codes
 *
 * Example:
 * - VGM/MCV: Mean Corpuscular Volume (French vs English)
 * - GR/RBC: Red Blood Cells (French "Globules Rouges" vs English)
 */
export const TEST_CODE_ALIASES: Record<string, string[]> = {
  // Hematology indices
  VGM: ['VGM', 'MCV'],
  TCMH: ['TCMH', 'MCH'],
  CCMH: ['CCMH', 'MCHC'],
  RDW: ['RDW', 'IDW', 'IDRc'],

  // Red blood cells
  RBC: ['RBC', 'GR', 'GRBC'],
  HGB: ['HGB', 'HB', 'HEMOGLOBIN'],
  HCT: ['HCT', 'HT', 'HEMATOCRIT'],

  // White blood cells
  WBC: ['WBC', 'GB', 'GBT'],
  GRA: ['GRA', 'GRAN', 'GRANULOCYTES', 'PNN'],
  LYM: ['LYM', 'LYMPH', 'LYMPHOCYTES'],
  MID: ['MID', 'MON', 'MONOCYTES'],

  // Platelets
  PLT: ['PLT', 'PLAQUETTES', 'THROMBOCYTES'],

  // Percentages/Differential
  'GRA%': ['GRA%', 'GRA_P', 'GRA_PCT', 'GRANULOCYTES%'],
  'LYM%': ['LYM%', 'LYM_P', 'LYM_PCT', 'LYMPHOCYTES%'],
  'MID%': ['MID%', 'MID_P', 'MID_PCT', 'MONOCYTES%'],

  // Chemistry
  GLY: ['GLY', 'GLUCOSE', 'GLYCEMIA'],
  UREE: ['UREE', 'UREA', 'BUN'],
  CREA: ['CREA', 'CREATININE'],
  URIC: ['URIC', 'ACIDE_URIQUE'],
};

/**
 * Find canonical test code from any alias
 *
 * @param code - Test code or alias (case-insensitive)
 * @returns Canonical test code or input code if no alias found
 *
 * @example
 * normalizeTestCode('MCV') // → 'VGM'
 * normalizeTestCode('RBC') // → 'RBC'
 * normalizeTestCode('gr') // → 'RBC'
 */
export function normalizeTestCode(code: string): string {
  const upperCode = code.toUpperCase();

  // Find the canonical code for this alias
  for (const [canonical, aliases] of Object.entries(TEST_CODE_ALIASES)) {
    if (aliases.some((a) => a.toUpperCase() === upperCode)) {
      return canonical;
    }
  }

  // No alias found, return as-is
  return code;
}

/**
 * Check if a code matches any alias (case-insensitive)
 *
 * @param code - Test code to check
 * @param targetAliases - List of aliases to match against
 * @returns true if code matches any target alias
 *
 * @example
 * matchesAnyAlias('VGM', ['MCV', 'VGM']) // → true
 * matchesAnyAlias('gb', ['WBC', 'GB']) // → true (case-insensitive)
 * matchesAnyAlias('HGB', ['RBC']) // → false
 */
export function matchesAnyAlias(code: string, targetAliases: string[]): boolean {
  const upperCode = code.toUpperCase();
  return targetAliases.some((alias) => alias.toUpperCase() === upperCode);
}

// ============================================================================
// HEMATOLOGY TEST GROUPING
// ============================================================================

/**
 * Standard hematology test codes that are part of NFS (Formule Sanguine)
 * These tests are typically ordered together and interpreted as a group
 */
export const NFS_TEST_CODES = [
  // WBC counts
  'GB',
  'WBC',
  'GRA',
  'GRAN',
  'LYM',
  'LYMPH',
  'MID',
  'MON',

  // WBC percentages
  'GRA%',
  'LYM%',
  'MID%',

  // RBC counts and indices
  'GR',
  'RBC',
  'HB',
  'HGB',
  'HT',
  'HCT',
  'VGM',
  'MCV',
  'TCMH',
  'MCH',
  'CCMH',
  'MCHC',

  // RBC morphology
  'RDW',
  'IDW',
  'IDRc',

  // Platelets
  'PLT',
  'PLAQUETTES',
];

/**
 * Check if a test code belongs to hematology (NFS) category
 *
 * @param code - Test code to check
 * @returns true if code is part of standard hematology battery
 *
 * @example
 * isHematologyTest('VGM') // → true
 * isHematologyTest('GLY') // → false
 */
export function isHematologyTest(code: string): boolean {
  const normalized = normalizeTestCode(code).toUpperCase();
  return NFS_TEST_CODES.some((c) => c.toUpperCase() === normalized);
}

// ============================================================================
// TEST SORTING & ORDERING
// ============================================================================

/**
 * Predefined sort order for NFS (Complete Blood Count) tests
 * Ensures consistent presentation across reports and interfaces
 * Order follows typical lab output: WBC differential → RBC → Indices → Platelets
 */
export const NFS_SORT_ORDER = [
  'GB',
  'WBC',
  'PNN',
  'NEUT',
  'PNNA',
  'PNN_ABS',
  'NEUTA',
  'LYM',
  'LYMPH',
  'LYMA',
  'LYM_ABS',
  'LYMPHA',
  'MONO',
  'MONA',
  'MONO_ABS',
  'EOS',
  'EOS_ABS',
  'BASO',
  'BASA',
  'BASO_ABS',
  'GR',
  'RBC',
  'HB',
  'HGB',
  'HT',
  'HCT',
  'VGM',
  'CCMH',
  'TCMH',
  'PLT',
];

/**
 * Get sort position for a test within its category
 * Lower numbers sort first
 *
 * @param code - Test code
 * @param category - Test category (defaults to determining from code)
 * @returns Sort index (0-based), or Infinity if not in predefined list
 *
 * @example
 * getTestSortPosition('VGM', 'Hématologie') // → 26
 * getTestSortPosition('GB', 'Hématologie') // → 0
 * getTestSortPosition('GLY', 'Biochimie') // → Infinity
 */
export function getTestSortPosition(code: string, category?: string): number {
  const upperCode = code.toUpperCase();

  if (category === TEST_CATEGORIES.HEMATOLOGIE || isHematologyTest(code)) {
    const position = NFS_SORT_ORDER.findIndex(
      (c) => c.toUpperCase() === upperCode
    );
    return position >= 0 ? position : Infinity;
  }

  return Infinity;
}

/**
 * Sort tests by category then by predefined order within category
 *
 * @param tests - Tests to sort
 * @returns Sorted tests array
 *
 * @example
 * const sorted = sortTestsByCategory(tests);
 * // Tests grouped by category, hematology tests in NFS order
 */
export function sortTestsByCategory(tests: Test[]): Test[] {
  return [...tests].sort((a, b) => {
    const catA = (a.categoryRel?.name || a.categoryId || TEST_CATEGORIES.AUTRE) as TestCategory;
    const catB = (b.categoryRel?.name || b.categoryId || TEST_CATEGORIES.AUTRE) as TestCategory;

    const catOrder = (CATEGORY_DISPLAY_ORDER[catA] ?? 999) - (CATEGORY_DISPLAY_ORDER[catB] ?? 999);
    if (catOrder !== 0) return catOrder;

    // Within same category, use predefined order if available
    const posA = getTestSortPosition(a.code, catA);
    const posB = getTestSortPosition(b.code, catB);

    if (posA !== Infinity || posB !== Infinity) {
      return posA - posB;
    }

    // Fallback: alphabetical by name
    return (a.name || '').localeCompare(b.name || '');
  });
}

// ============================================================================
// TEST RESULT TYPE CLASSIFICATION
// ============================================================================

/**
 * Valid result types for tests
 * Affects how results are input and interpreted
 */
export const RESULT_TYPES = {
  NUMERIC: 'numeric',
  TEXT: 'text',
  SELECT: 'select',
} as const;

export type ResultType = (typeof RESULT_TYPES)[keyof typeof RESULT_TYPES];

/**
 * Numeric result tests (support numeric comparisons and abnormality flags)
 * These tests have defined reference ranges
 */
export function isNumericResultType(test: Test): boolean {
  return test.resultType === RESULT_TYPES.NUMERIC;
}

/**
 * Text result tests (interpreted as strings, no numeric calculations)
 * Examples: culture results, qualitative results
 */
export function isTextResultType(test: Test): boolean {
  return test.resultType === RESULT_TYPES.TEXT;
}

/**
 * Select/Option tests (predefined list of choices)
 * Examples: positive/negative, present/absent
 */
export function isSelectResultType(test: Test): boolean {
  return test.resultType === RESULT_TYPES.SELECT;
}

// ============================================================================
// TEST REFERENCE RANGE CLASSIFICATION
// ============================================================================

/**
 * Check if test has gender-specific reference ranges
 *
 * @param test - Test object
 * @returns true if different ranges for male/female
 *
 * @example
 * hasGenderSpecificRanges(creatinineTest) // → true
 * hasGenderSpecificRanges(platelets) // → false
 */
export function hasGenderSpecificRanges(test: Test): boolean {
  return Boolean(
    (test.minValueM !== null && test.minValueM !== undefined) ||
      (test.maxValueM !== null && test.maxValueM !== undefined) ||
      (test.minValueF !== null && test.minValueF !== undefined) ||
      (test.maxValueF !== null && test.maxValueF !== undefined)
  );
}

/**
 * Check if test has any reference range defined
 *
 * @param test - Test object
 * @returns true if min or max range exists
 */
export function hasReferenceRange(test: Test): boolean {
  return Boolean(
    (test.minValue !== null && test.minValue !== undefined) ||
      (test.maxValue !== null && test.maxValue !== undefined) ||
      hasGenderSpecificRanges(test)
  );
}

/**
 * Get reference range for a test based on gender
 *
 * @param test - Test object
 * @param gender - Patient gender ('M'/'F' or null for unisex range)
 * @returns Object with min/max values, or null if no range defined
 *
 * @example
 * getTestReferenceRange(creatinineTest, 'M')
 * // → { min: 7, max: 13 }
 * getTestReferenceRange(platelets, null)
 * // → { min: 150, max: 450 }
 */
export function getTestReferenceRange(
  test: Test,
  gender?: string | null
): { min: number | null; max: number | null } | null {
  if (!hasReferenceRange(test)) return null;

  if (gender === 'M' && (test.minValueM !== null || test.maxValueM !== null)) {
    return { min: test.minValueM, max: test.maxValueM };
  }

  if (gender === 'F' && (test.minValueF !== null || test.maxValueF !== null)) {
    return { min: test.minValueF, max: test.maxValueF };
  }

  // Fallback to unisex range
  return { min: test.minValue, max: test.maxValue };
}

// ============================================================================
// TEST GROUPING & BILANS
// ============================================================================

/**
 * Standard Bilan (Test Panel) groupings
 * Collections of related tests typically ordered together
 */
export const STANDARD_BILANS = {
  NFS: {
    name: 'Numération Formule Sanguine',
    code: 'NFS',
    tests: NFS_TEST_CODES,
    category: TEST_CATEGORIES.HEMATOLOGIE,
  },
  BILAN_METABOLIQUE: {
    name: 'Bilan Métabolique',
    code: 'BM',
    tests: ['GLY', 'UREE', 'CREA', 'URIC'],
    category: TEST_CATEGORIES.BIOCHIMIE,
  },
} as const;

/**
 * Check if a test belongs to a predefined bilan
 *
 * @param testCode - Test code to check
 * @param bilanCode - Bilan code (e.g., 'NFS')
 * @returns true if test is part of bilan
 *
 * @example
 * isInBilan('VGM', 'NFS') // → true
 * isInBilan('GLY', 'NFS') // → false
 */
export function isInBilan(testCode: string, bilanCode: keyof typeof STANDARD_BILANS): boolean {
  const bilan = STANDARD_BILANS[bilanCode];
  if (!bilan) return false;

  const normalized = normalizeTestCode(testCode).toUpperCase();
  return bilan.tests.some((c) => normalizeTestCode(c).toUpperCase() === normalized);
}

// ============================================================================
// CALCULATED/FORMULA TESTS
// ============================================================================

/**
 * Test codes that are automatically calculated from other test values
 * These tests should have read-only input fields and show calculation details
 * 
 * Includes:
 * - Hematology indices (VGM, TCMH, CCMH) calculated from RBC, HGB, HCT
 * - WBC differentials (percentages and absolutes) calculated from absolute counts
 * - Renal function estimates (DFG/eGFR) calculated from creatinine and patient demographics
 */
export const CALCULATED_TEST_CODES = ['VGM', 'MCV', 'TCMH', 'MCH', 'CCMH', 'MCHC', 'PNN', 'GRA', 'LYM', 'MID', 'MON', 'EOS', 'BASO', 'DFG', 'EGFR'] as const;

/**
 * Check if a test code represents a calculated/formula test
 * Calculated tests are auto-computed from other test values and have read-only inputs
 * 
 * @param code - Test code to check
 * @returns true if test is automatically calculated
 * 
 * @example
 * isCalculatedTest('VGM') // → true (calculated from RBC, HGB, HCT)
 * isCalculatedTest('GR') // → false (manually entered)
 * isCalculatedTest('HGB') // → false (manually entered)
 */
export function isCalculatedTest(code: string): boolean {
  const upperCode = code.toUpperCase();
  return CALCULATED_TEST_CODES.some((c) => c === upperCode);
}
