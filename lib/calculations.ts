/**
 * lib/calculations.ts
 * 
 * Centralized business logic for all laboratory calculations
 * Consolidates hematology indices, clinical interpretations, and value transformations
 * 
 * This module replaces scattered calculation logic across:
 * - components/analyses/resultats-metrics.ts
 * - lib/interpretations.ts
 * - lib/qc.ts
 */

import type { Analysis, Result, Test } from '@/lib/types';
import { getTestReferenceValues, getResultReferenceValues } from '@/lib/utils';
import { HEMATOLOGY_THRESHOLDS as H_THRESH } from '@/lib/lab-rules';

export type EGFRFormula = 'CKD_EPI_2021' | 'EKFC_2021';

export interface SmartEGFRResult {
  value: number;
  displayValue: string;
  formula: EGFRFormula;
  warning?: string;
}

// ============================================================================
// VALUE PARSING & FORMATTING UTILITIES
// ============================================================================

/**
 * Parse a locale-aware numeric string (comma as decimal separator)
 * 
 * @param value - String value with potential comma as decimal separator
 * @returns Parsed number or null if invalid
 * @example
 * parseLocaleNumber("123,45") // → 123.45
 * parseLocaleNumber("invalid") // → null
 */
export function parseLocaleNumber(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Format a number with locale-aware decimal separator
 * 
 * @param value - Numeric value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with comma as decimal separator
 * @example
 * formatLocaleNumber(123.45, 2) // → "123,45"
 * formatLocaleNumber(10) // → "10,0"
 */
export function formatLocaleNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

// ============================================================================
// HEMATOLOGY INDEX CALCULATIONS
// ============================================================================

/**
 * Calculate Mean Corpuscular Volume (MCV / VGM)
 * Formula: (Hematocrit / RBC count) * 10
 * 
 * Normal range: 80-100 fL (Adult)
 * - Below 80 fL: Microcytosis (small cells)
 * - Above 100 fL: Macrocytosis (large cells)
 * 
 * @param hematocrit - Hematocrit value (%) 
 * @param rbcCount - Red blood cell count (10⁶/µL)
 * @returns MCV in fL or null if calculation impossible
 * @example
 * calculateMCV(40, 5.0) // → 80 (normal)
 */
export function calculateMCV(hematocrit: number | null, rbcCount: number | null): number | null {
  if (hematocrit === null || hematocrit <= 0 || rbcCount === null || rbcCount <= 0) return null;
  return (hematocrit / rbcCount) * 10;
}

/**
 * Calculate Mean Corpuscular Hemoglobin (MCH / TCMH)
 * Formula: (Hemoglobin * 10) / RBC count
 * 
 * Normal range: 27-33 pg (Adult)
 * Indicates average hemoglobin mass per red cell
 * 
 * @param hemoglobin - Hemoglobin value (g/dL)
 * @param rbcCount - Red blood cell count (10⁶/µL)
 * @returns MCH in pg or null if calculation impossible
 * @example
 * calculateMCH(14, 5.0) // → 28 (normal)
 */
export function calculateMCH(hemoglobin: number | null, rbcCount: number | null): number | null {
  if (hemoglobin === null || hemoglobin <= 0 || rbcCount === null || rbcCount <= 0) return null;
  return (hemoglobin * 10) / rbcCount;
}

/**
 * Calculate Mean Corpuscular Hemoglobin Concentration (MCHC / CCMH)
 * Formula: (Hemoglobin / Hematocrit) * 100
 * 
 * Normal range: 32-36 g/dL (Adult)
 * Indicates hemoglobin concentration within red cells
 * 
 * @param hemoglobin - Hemoglobin value (g/dL)
 * @param hematocrit - Hematocrit value (%)
 * @returns MCHC in g/dL or null if calculation impossible
 * @example
 * calculateMCHC(14, 42) // → 33.3 (normal)
 */
export function calculateMCHC(hemoglobin: number | null, hematocrit: number | null): number | null {
  if (hemoglobin === null || hemoglobin <= 0 || hematocrit === null || hematocrit <= 0) return null;
  return (hemoglobin / hematocrit) * 100;
}

function normalizeGender(gender: string | null): 'M' | 'F' | null {
  const normalized = gender?.trim().toUpperCase();
  return normalized === 'M' || normalized === 'F' ? normalized : null;
}

function normalizeCreatinineToMgDl(scr: number, unit: string): number {
  const normalizedUnit = unit
    .toLowerCase()
    .replace(/[\s/]/g, '')
    .replace('\u03bc', '\u00b5');

  if (normalizedUnit === 'umoll' || normalizedUnit === '\u00b5moll') {
    return scr / 88.4;
  }

  if (normalizedUnit === 'mgl') {
    return scr / 10;
  }

  if (normalizedUnit !== 'mgdl' && normalizedUnit !== '') {
    console.warn(`[normalizeCreatinineToMgDl] Unrecognized unit "${unit}" — treating as mg/dL. Check test catalog configuration.`);
  }

  return scr;
}

/**
 * Calculate Estimated Glomerular Filtration Rate (eGFR / DFG)
 * Formula: CKD-EPI 2021 (Race-free)
 * 
 * Standard formula for assessing kidney function.
 * eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^-1.200 × 0.9938^Age × [1.012 if female]
 * 
 * @param scr - Serum Creatinine value
 * @param age - Patient age in years
 * @param gender - Patient gender ('M' or 'F')
 * @param unit - Creatinine unit ('mg/dL', 'mg/L', or 'µmol/L')
 * @returns eGFR in mL/min/1.73m² or null if calculation impossible
 */
function getEKFCQFactor(age: number, gender: 'M' | 'F'): number | null {
  if (age < 2) return null;
  if (age > 25) return gender === 'F' ? 0.70 : 0.90;

  const qUmolL = gender === 'F'
    ? Math.exp(3.080 + 0.177 * age - 0.223 * Math.log(age) - 0.00596 * Math.pow(age, 2) + 0.0000686 * Math.pow(age, 3))
    : Math.exp(3.200 + 0.259 * age - 0.543 * Math.log(age) - 0.00763 * Math.pow(age, 2) + 0.0000790 * Math.pow(age, 3));

  return qUmolL / 88.4;
}

export function calculateEGFR(
  scr: number | null,
  age: number | null,
  gender: string | null,
  unit: string = 'mg/dL'
): number | null {
  const genderKey = normalizeGender(gender);
  if (scr === null || age === null || !genderKey || scr <= 0 || age < 18) return null;

  const scrMgDl = normalizeCreatinineToMgDl(scr, unit);
  if (scrMgDl <= 0) return null;

  const isFemale = genderKey === 'F';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const femaleAdjustment = isFemale ? 1.012 : 1.0;

  const egfr = 142 *
    Math.pow(Math.min(scrMgDl / kappa, 1), alpha) *
    Math.pow(Math.max(scrMgDl / kappa, 1), -1.200) *
    Math.pow(0.9938, age) *
    femaleAdjustment;

  return egfr;
}

/**
 * Calculate eGFR with the creatinine-based European Kidney Function Consortium equation.
 * Validated as a full-age-spectrum estimate for children older than 2 years through adults.
 */
export function calculateEKFC(
  scr: number | null,
  age: number | null,
  gender: string | null,
  unit: string = 'mg/dL'
): number | null {
  const genderKey = normalizeGender(gender);
  if (scr === null || age === null || !genderKey || scr <= 0 || age < 2) return null;

  const scrMgDl = normalizeCreatinineToMgDl(scr, unit);
  if (scrMgDl <= 0) return null;

  const q = getEKFCQFactor(age, genderKey);
  if (!q) return null;

  const ratio = scrMgDl / q;
  const exponent = ratio < 1 ? -0.322 : -1.132;
  const ageFactor = age > 40 ? Math.pow(0.990, age - 40) : 1;

  return 107.3 * Math.pow(ratio, exponent) * ageFactor;
}

/**
 * Master eGFR selector:
 * - age < 2: returns null (no validated formula)
 * - age 2–17: EKFC 2021
 * - age >= 18: CKD-EPI 2021 (NKF, race-free)
 * - age 18–25: CKD-EPI used, but EKFC is also validated — warning emitted
 */
export function calculateSmartEGFR(
  scr: number | null,
  age: number | null,
  gender: string | null,
  unit: string = 'mg/dL'
): SmartEGFRResult | null {
  if (scr === null || age === null || scr <= 0 || age < 2 || !normalizeGender(gender)) return null;

  const formula: EGFRFormula = age < 18 ? 'EKFC_2021' : 'CKD_EPI_2021';
  const value = formula === 'EKFC_2021'
    ? calculateEKFC(scr, age, gender, unit)
    : calculateEGFR(scr, age, gender, unit);

  if (value === null) return null;

  const roundedValue = Math.round(value);

  const warnings: string[] = [];
  if (roundedValue > 90) warnings.push('Les équations DFG sont moins précises aux valeurs élevées.');
  if (age >= 18 && age <= 25) warnings.push('Tranche d\'âge 18–25 ans : EKFC et CKD-EPI sont tous deux validés ; les résultats peuvent diverger.');

  return {
    value: roundedValue,
    displayValue: roundedValue > 90 ? '> 90' : String(roundedValue),
    formula,
    warning: warnings.length > 0 ? warnings.join(' ') : undefined,
  };
}

/**
 * Calculate Red Cell Distribution Width coefficient (RDW / IDR)
 * Indicates variability in red cell size (degree of anisocytosis)
 * 
 * Normal range: 11-15% (Adult)
 * - Above 15%: Increased anisocytosis (variable cell sizes)
 * 
 * Note: Some instruments provide absolute RDW in fL; others provide percentage
 * This function validates threshold for clinical interpretation
 * 
 * @param rdw - RDW value (can be % or fL depending on analyzer)
 * @returns true if RDW indicates anisocytosis, false otherwise
 * @example
 * interpretRDW(16.5) // → true (anisocytosis detected)
 * interpretRDW(13.0) // → false (normal distribution)
 */
export function interpretRDW(rdw: number | null): boolean {
  if (rdw === null) return false;
  return rdw > 15.0;
}

// ============================================================================
// DIFFERENTIAL CALCULATIONS
// ============================================================================

/**
 * Calculate absolute white cell count from percentage and total WBC
 * Formula: (Percentage / 100) * Total WBC count
 * 
 * Converts differential percentages (%GRA, %LYM, %MID) to absolute values
 * Essential for clinical interpretation of differential counts
 * 
 * @param percentage - Cell percentage (0-100)
 * @param totalWBC - Total white blood cell count (10³/µL)
 * @returns Absolute count in 10³/µL or null if invalid input
 * @example
 * calculateAbsoluteFromPercentage(60, 10.0) // → 6.0 (absolute GRA count)
 */
export function calculateAbsoluteFromPercentage(percentage: number | null, totalWBC: number | null): number | null {
  if (percentage === null || totalWBC === null || totalWBC === 0) return null;
  return (percentage / 100) * totalWBC;
}

/**
 * Calculate percentage from absolute count and total WBC
 * Formula: (Absolute Count / Total WBC) * 100
 * 
 * Inverse of calculateAbsoluteFromPercentage
 * Used when only absolute values are available but percentages are needed
 * 
 * @param absoluteCount - Cell count in 10³/µL
 * @param totalWBC - Total white blood cell count (10³/µL)
 * @returns Percentage (0-100) or null if invalid input
 * @example
 * calculatePercentageFromAbsolute(6.0, 10.0) // → 60 (%GRA)
 */
export function calculatePercentageFromAbsolute(absoluteCount: number | null, totalWBC: number | null): number | null {
  if (absoluteCount === null || totalWBC === null || totalWBC === 0) return null;
  return (absoluteCount / totalWBC) * 100;
}

// ============================================================================
// BATCH HEMATOLOGY CALCULATIONS
// ============================================================================

interface HematologyIndices {
  vgm?: number;
  tcmh?: number;
  ccmh?: number;
  rdwAnisocytosis?: boolean;
}

/**
 * Calculate all hematology indices from raw measurements
 * 
 * Calculates VGM, TCMH, CCMH from:
 * - RBC (Red blood cell count)
 * - HGB (Hemoglobin)
 * - HCT (Hematocrit)
 * - RDW (Red cell distribution width)
 * 
 * Handles alternative test codes (GR/RBC, HB/HGB, HT/HCT, IDW/RDW)
 * All calculation results are returned; caller decides which to persist
 * 
 * @param values - Object with test code as key, numeric value
 * @returns Calculated indices (only non-null values included)
 * @example
 * calculateHematologyIndices({
 *   RBC: 5.0,
 *   HGB: 14.0,
 *   HCT: 42.0,
 *   RDW: 13.5
 * })
 * // → { vgm: 84.0, tcmh: 28.0, ccmh: 33.3, rdwAnisocytosis: false }
 */
export function calculateHematologyIndices(values: Record<string, number>): HematologyIndices {
  const rbc = values.RBC ?? values.GR ?? null;
  const hgb = values.HGB ?? values.HB ?? null;
  const hct = values.HCT ?? values.HT ?? null;
  const rdw = values.RDW ?? values.IDW ?? null;

  const indices: HematologyIndices = {};

  const vgm = calculateMCV(hct, rbc);
  if (vgm !== null) indices.vgm = vgm;

  const tcmh = calculateMCH(hgb, rbc);
  if (tcmh !== null) indices.tcmh = tcmh;

  const ccmh = calculateMCHC(hgb, hct);
  if (ccmh !== null) indices.ccmh = ccmh;

  if (rdw !== null) {
    indices.rdwAnisocytosis = interpretRDW(rdw);
  }

  return indices;
}

// ============================================================================
// CBC REPORT INDICES
// ============================================================================

export type CbcIndexGroup = 'microcytosis' | 'inflammation';

export interface CbcIndexResult {
  id: string;
  group: CbcIndexGroup;
  name: string;
  value: number;
  displayValue: string;
  formula: string;
  reference: string;
  interpretation: string;
  isAlert: boolean;
}

const CBC_INDEX_CODE_ALIASES = {
  mcv: ['MCV', 'VGM'],
  rbc: ['RBC', 'GR', 'GRBC'],
  rdw: ['RDW', 'IDW', 'RDWCV', 'RDW-CV'],
  hgb: ['HGB', 'HB', 'HEMOGLOBIN', 'HEMOGLOBINE'],
  wbc: ['WBC', 'GB', 'GBT', 'LEUCOCYTES'],
  platelets: ['PLT', 'PLAQUETTES', 'PLAQ', 'THROMBOCYTES'],
  neutrophils: ['NEU', 'NEUT', 'NEUTA', 'NEUTABS', 'NEUABS', 'PNN', 'PNNA', 'PNNABS', 'PNN_ABS', 'GRA', 'GRA_P', 'GRA_PCT', 'GRAN', 'GRANULOCYTES'],
  lymphocytes: ['LYM', 'LYMA', 'LYMABS', 'LYM_ABS', 'LYM_P', 'LYM_PCT', 'LYMPH', 'LYMPHA', 'LYMPHABS', 'LYMPHOCYTES'],
  monocytes: ['MON', 'MONA', 'MONABS', 'MON_ABS', 'MONO', 'MONOA', 'MONOABS', 'MONO_ABS', 'MONOCYTES', 'MID', 'MID_P', 'MID_PCT'],
} as const;

function normalizeCbcIndexCode(code: string | undefined | null) {
  return (code || '')
    .toUpperCase()
    .replace(/^NFS[-_ ]?/, '')
    .replace(/[^A-Z0-9%]/g, '');
}

function matchesCbcIndexAlias(code: string, aliases: readonly string[]) {
  const normalized = normalizeCbcIndexCode(code).replace(/%/g, '');
  return aliases.some((alias) => normalizeCbcIndexCode(alias).replace(/%/g, '') === normalized);
}

function isPercentageCbcResult(result: Result) {
  const code = normalizeCbcIndexCode(result.test?.code);
  const unit = (result.unit || result.test?.unit || '').toLowerCase();
  return code.includes('%') || code.endsWith('P') || code.endsWith('PCT') || unit.includes('%');
}

function getCbcResultValue(result: Result, values: Record<string, string>) {
  return parseLocaleNumber(values[result.id] ?? result.value);
}

function findCbcValue(
  analysis: Analysis,
  values: Record<string, string>,
  aliases: readonly string[],
  mode: 'any' | 'absolute' | 'percentage' = 'any'
) {
  for (const result of analysis.results) {
    const code = result.test?.code;
    if (!code || !matchesCbcIndexAlias(code, aliases)) continue;
    const percentage = isPercentageCbcResult(result);
    if (mode === 'absolute' && percentage) continue;
    if (mode === 'percentage' && !percentage) continue;

    const value = getCbcResultValue(result, values);
    if (value !== null) return value;
  }

  return null;
}

function findCbcDifferentialAbsolute(
  analysis: Analysis,
  values: Record<string, string>,
  aliases: readonly string[],
  wbc: number | null
) {
  const absolute = findCbcValue(analysis, values, aliases, 'absolute');
  if (absolute !== null) return absolute;

  const percentage = findCbcValue(analysis, values, aliases, 'percentage');
  if (percentage === null || wbc === null || wbc <= 0) return null;

  return (percentage / 100) * wbc;
}

function isPositiveCbcValue(value: number | null): value is number {
  return value !== null && value > 0;
}

function makeCbcIndex(
  id: string,
  group: CbcIndexGroup,
  name: string,
  value: number,
  decimals: number,
  formula: string,
  reference: string,
  interpretation: string,
  isAlert: boolean
): CbcIndexResult {
  return {
    id,
    group,
    name,
    value,
    displayValue: formatLocaleNumber(value, decimals),
    formula,
    reference,
    interpretation,
    isAlert,
  };
}

export function calculateCbcIndices(analysis: Analysis, values: Record<string, string>): CbcIndexResult[] {
  const indices: CbcIndexResult[] = [];

  const mcv = findCbcValue(analysis, values, CBC_INDEX_CODE_ALIASES.mcv);
  const rbc = findCbcValue(analysis, values, CBC_INDEX_CODE_ALIASES.rbc);
  const rdw = findCbcValue(analysis, values, CBC_INDEX_CODE_ALIASES.rdw);
  const hgb = findCbcValue(analysis, values, CBC_INDEX_CODE_ALIASES.hgb);

  if (isPositiveCbcValue(mcv) && mcv < 80 && isPositiveCbcValue(rbc)) {
    const mentzer = mcv / rbc;
    indices.push(makeCbcIndex(
      'mentzer',
      'microcytosis',
      'Indice de Mentzer',
      mentzer,
      2,
      'VGM / GR',
      '< 13 : thalassémie  |  > 13 : carence martiale',
      mentzer < 13 ? "Profil en faveur d'une thalassémie" : "Profil en faveur d'une carence martiale",
      true
    ));
  }

  if (isPositiveCbcValue(mcv) && mcv < 80 && isPositiveCbcValue(rbc) && isPositiveCbcValue(rdw)) {
    const rdwi = (rdw * mcv) / rbc;
    indices.push(makeCbcIndex(
      'rdwi',
      'microcytosis',
      'RDWI',
      rdwi,
      1,
      '(RDW × VGM) / GR',
      '< 220 : thalassémie',
      rdwi < 220 ? "Profil en faveur d'une thalassémie" : 'Au-dessus du seuil thalassémique',
      rdwi < 220
    ));
  }

  if (isPositiveCbcValue(mcv) && mcv < 80 && isPositiveCbcValue(rdw) && isPositiveCbcValue(hgb)) {
    const greenKing = (mcv * mcv * rdw) / (hgb * 100);
    indices.push(makeCbcIndex(
      'green-king',
      'microcytosis',
      'Green & King',
      greenKing,
      1,
      '(VGM² × RDW) / (Hb × 100)',
      '< 65 : thalassémie',
      greenKing < 65 ? "Profil en faveur d'une thalassémie" : 'Au-dessus du seuil thalassémique',
      greenKing < 65
    ));
  }

  const wbc = findCbcValue(analysis, values, CBC_INDEX_CODE_ALIASES.wbc);
  const neutrophils = findCbcDifferentialAbsolute(analysis, values, CBC_INDEX_CODE_ALIASES.neutrophils, wbc);
  const lymphocytes = findCbcDifferentialAbsolute(analysis, values, CBC_INDEX_CODE_ALIASES.lymphocytes, wbc);
  const monocytes = findCbcDifferentialAbsolute(analysis, values, CBC_INDEX_CODE_ALIASES.monocytes, wbc);
  const platelets = findCbcValue(analysis, values, CBC_INDEX_CODE_ALIASES.platelets);

  if (isPositiveCbcValue(neutrophils) && isPositiveCbcValue(lymphocytes) && isPositiveCbcValue(monocytes) && isPositiveCbcValue(platelets)) {
    const nlr = neutrophils / lymphocytes;
    indices.push(makeCbcIndex(
      'nlr',
      'inflammation',
      'NLR',
      nlr,
      2,
      'Neutrophiles abs. / Lymphocytes abs.',
      '1 – 3',
      nlr >= 1 && nlr <= 3 ? "Dans l'intervalle attendu" : "Hors de l'intervalle attendu",
      nlr < 1 || nlr > 3
    ));

    const plr = platelets / lymphocytes;
    indices.push(makeCbcIndex(
      'plr',
      'inflammation',
      'PLR',
      plr,
      1,
      'Plaquettes / Lymphocytes abs.',
      '50 – 150',
      plr >= 50 && plr <= 150 ? "Dans l'intervalle attendu" : "Hors de l'intervalle attendu",
      plr < 50 || plr > 150
    ));

    const mlr = monocytes / lymphocytes;
    indices.push(makeCbcIndex(
      'mlr',
      'inflammation',
      'MLR',
      mlr,
      2,
      'Monocytes abs. / Lymphocytes abs.',
      '0,1 – 0,3',
      mlr >= 0.1 && mlr <= 0.3 ? "Dans l'intervalle attendu" : "Hors de l'intervalle attendu",
      mlr < 0.1 || mlr > 0.3
    ));

    const sii = (neutrophils * platelets) / lymphocytes;
    indices.push(makeCbcIndex(
      'sii',
      'inflammation',
      'SII',
      sii,
      0,
      '(Neutrophiles abs. × Plaquettes) / Lymphocytes abs.',
      '< 500',
      sii < 500 ? 'Sous le seuil de référence' : 'Au-dessus du seuil de référence',
      sii >= 500
    ));
  }

  return indices;
}

// ============================================================================
// ABNORMALITY DETECTION
// ============================================================================

/**
 * Determine if a result value is abnormal relative to reference ranges
 * 
 * Compares value against:
 * 1. Gender-specific reference values (if available)
 * 2. Test definition min/max values
 * 3. Returns false if no reference range defined
 * 
 * Handles locale-specific number formatting (comma as decimal separator)
 * 
 * @param value - String representation of result value
 * @param test - Test definition with reference ranges
 * @param patientGender - Patient gender ('M'/'F') for gender-specific ranges
 * @returns true if value exceeds defined reference ranges
 * @example
 * const test = { minValue: 4.0, maxValue: 10.0, resultType: 'numeric' };
 * const result = { test, value: "11,5" };
 * isResultAbnormal("11,5", result, "M") // → true (exceeds max)
 * isResultAbnormal("8,0", result, "M") // → false (within range)
 */
export function isResultAbnormal(
  value: string,
  result: Result,
  patientGender?: string | null
): boolean {
  if (!value) return false;

  const refVals = getResultReferenceValues(result, patientGender);
  const min = refVals?.min ?? result.test?.minValue ?? null;
  const max = refVals?.max ?? result.test?.maxValue ?? null;

  if (min === null && max === null) return false;

  const num = parseLocaleNumber(value);
  if (num === null) return false;

  if (max !== null && num > max) return true;
  if (min !== null && num < min) return true;
  return false;
}

// ============================================================================
// CLINICAL INTERPRETATION THRESHOLDS
// ============================================================================

/**
 * Get clinical interpretation flags for hematology results
 * 
 * Evaluates results against clinical thresholds for:
 * - Anemia (gender-specific hemoglobin)
 * - Leukocytosis/Leukopenia (WBC)
 * - Thrombocytosis/Thrombopenia (PLT)
 * - Lymphocytosis/Lymphopenia (LYM absolute)
 * - Neutrophilia/Neutropenia (GRA absolute)
 * - Macrocytosis/Microcytosis (MCV/VGM)
 * - Anisocytosis (RDW/IDW)
 * 
 * Thresholds are defined in lib/lab-rules.ts (HEMATOLOGY_THRESHOLDS)
 * Returns empty array if all values normal
 * 
 * @param analysis - Analysis object with patient demographics
 * @param results - Dict of test result values keyed by test ID
 * @returns Array of clinical interpretation flags (French text)
 * @example
 * const flags = getHematologyFlags(analysis, { ...results });
 * // → ["ANÉMIE", "LYMPHOCYTOSE"]
 */
export function getHematologyFlags(analysis: Analysis, results: Record<string, string>): string[] {
  const flags: string[] = [];

  const HEMA_ALIASES: Record<string, string[]> = {
    gb:        ['GB', 'WBC', 'GBT', 'LEUCOCYTES'],
    hgb:       ['HGB', 'HB', 'HEMOGLOBIN', 'HEMOGLOBINE'],
    plt:       ['PLT', 'PLAQUETTES', 'PLAQ', 'THROMBOCYTES'],
    lymPct:    ['LYM%', 'LYM_P', 'LYM_PCT', 'LYMP', 'LYMPH%'],
    graPct:    ['GRA%', 'GRA_P', 'GRA_PCT', 'NEUT%', 'NEU%', 'PNN%'],
    vgm:       ['VGM', 'MCV'],
    rdw:       ['RDW', 'IDW', 'RDWCV', 'RDW-CV'],
  };

  const getVal = (aliases: string[]) => {
    for (const code of aliases) {
      const res = analysis.results.find(r => {
        const testCode = (r.test?.code || '').toUpperCase();
        return testCode === code || testCode.endsWith(`-${code}`);
      });
      if (res) {
        const parsed = parseLocaleNumber(results[res.id]);
        if (parsed !== null) return parsed;
      }
    }
    return null;
  };

  const gb  = getVal(HEMA_ALIASES.gb);
  const hgb = getVal(HEMA_ALIASES.hgb);
  const plt = getVal(HEMA_ALIASES.plt);
  const lymPercent = getVal(HEMA_ALIASES.lymPct);
  const graPercent = getVal(HEMA_ALIASES.graPct);
  const vgm = getVal(HEMA_ALIASES.vgm);
  const rdw = getVal(HEMA_ALIASES.rdw);

  // WBC interpretation
  if (gb !== null) {
    if (gb < H_THRESH.GB.LEUCOPENIA) flags.push('LEUCOPÉNIE');
    if (gb > H_THRESH.GB.HYPERLEUKOCYTOSIS) flags.push('HYPERLEUCOCYTOSE');
  }

  // Hemoglobin interpretation
  if (hgb !== null) {
    const isMale = analysis.patientGender === 'M';
    if (isMale && hgb < H_THRESH.HGB.ANEMIA_MALE) flags.push('ANÉMIE');
    if (!isMale && hgb < H_THRESH.HGB.ANEMIA_FEMALE) flags.push('ANÉMIE');
  }

  // Platelet interpretation
  if (plt !== null) {
    if (plt < H_THRESH.PLT.THROMBOPENIA) flags.push('THROMBOPÉNIE');
    if (plt > H_THRESH.PLT.THROMBOCYTOSIS) flags.push('THROMBOCYTOSE');
  }

  // Lymphocyte interpretation (absolute count)
  if (lymPercent !== null && gb !== null) {
    const lymAbs = calculateAbsoluteFromPercentage(lymPercent, gb);
    if (lymAbs !== null) {
      if (lymAbs > H_THRESH.LYM_ABS.LYMPHOCYTOSIS) flags.push('LYMPHOCYTOSE');
      if (lymAbs < H_THRESH.LYM_ABS.LYMPHOPENIA) flags.push('LYMPHOPÉNIE');
    }
  }

  // Neutrophil interpretation (absolute count)
  if (graPercent !== null && gb !== null) {
    const pnnAbs = calculateAbsoluteFromPercentage(graPercent, gb);
    if (pnnAbs !== null) {
      if (pnnAbs > H_THRESH.PNN_ABS.NEUTROPHILIA) flags.push('POLYNUCLÉOSE NEUTROPHILE');
      if (pnnAbs < H_THRESH.PNN_ABS.NEUTROPENIA) flags.push('NEUTROPÉNIE');
    }
  }

  // MCV interpretation (morphological classification)
  if (vgm !== null) {
    if (vgm < 80) flags.push('MICROCYTOSE');
    if (vgm > 100) flags.push('MACROCYTOSE');
  }

  // RDW interpretation (anisocytosis)
  if (rdw !== null && interpretRDW(rdw)) {
    flags.push('ANISOCYTOSE');
  }

  return flags;
}

// ============================================================================
// HISTOGRAM DATA INTERPRETATION
// ============================================================================

/**
 * Extract morphological flags from instrument histogram data
 * 
 * Parses analyzer-provided histogram flags for:
 * - RBC morphology (anisocytosis, RBC abnormalities)
 * - WBC morphology (blast presence, left shift)
 * - PLT morphology (platelet aggregates)
 * 
 * @param histogramData - Stringified JSON histogram data from analyzer
 * @returns Array of morphological interpretation flags (French text)
 * @example
 * const flags = getHistogramFlags(analysis.histogramData);
 * // → ["PRÉSENCE D'AGRÉGATS PLAQUETTAIRES", "ANISOCYTOSE"]
 */
export function getHistogramFlags(histogramData: string | null | undefined): string[] {
  const flags: string[] = [];

  if (!histogramData) return flags;

  try {
    const data = JSON.parse(histogramData);

    if (data.rbc?.flags) {
      if (data.rbc.flags.includes('Aniso')) {
        flags.push('ANISOCYTOSE');
      }
    }

    if (data.plt?.flags) {
      if (data.plt.flags.includes('Aggr')) {
        flags.push("PRÉSENCE D'AGRÉGATS PLAQUETTAIRES");
      }
    }

    if (data.wbc?.flags) {
      if (data.wbc.flags.includes('Blasts')) {
        flags.push('PRÉSENCE POSSIBLE DE BLASTES (À VÉRIFIER)');
      }
    }
  } catch {
    // Silently ignore parse errors - histogram data is optional
  }

  return flags;
}
