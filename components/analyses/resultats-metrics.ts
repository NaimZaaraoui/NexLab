import { getTestReferenceValues } from '@/lib/core/utils';
import { 
  parseLocaleNumber, 
  formatLocaleNumber,
  calculateHematologyIndices,
  calculateAbsoluteFromPercentage,
  calculateSmartEGFR,
  isResultAbnormal
} from '@/lib/clinical/calculations';
import { applyCalculatedTestFormulas } from '@/lib/clinical/calculated-tests';
import type { Analysis, Result, Test } from '@/lib/core/types';

export interface PaymentStatusDisplay {
  label: string;
  classes: string;
}

export interface ResultMetrics {
  totalCount: number;
  completedCount: number;
  abnormalCount: number;
  progressPct: number;
}

export function performAnalysisCalculations(
  analysis: Analysis | null,
  currentResults: Record<string, string>
): { updatedResults: Record<string, string>; resultMetadata: Record<string, string> } {
  if (!analysis) return { updatedResults: currentResults, resultMetadata: {} };

  const updatedResults = { ...currentResults };
  const resultMetadata: Record<string, string> = {};

  const normalizeCode = (code?: string | null) => (code || '').trim().toUpperCase();

  const getResByAliases = (codes: string[]) => {
    const requested = codes.map(normalizeCode);
    return analysis.results.find((result: Result) => {
      const testCode = normalizeCode(result.test?.code);
      const suffix = testCode.includes('-') ? testCode.split('-').pop() || testCode : testCode;
      return requested.includes(testCode) || requested.includes(suffix);
    });
  };
  
  const getVal = (code: string) => {
    const res = getResByAliases([code]);
    if (!res) return null;
    const val = updatedResults[res.id];
    return val ? parseLocaleNumber(val) : null;
  };

  const setVal = (code: string, value: number | null, overrideDecimals?: number, metadata?: string) => {
    if (value === null) return;
    const res = getResByAliases([code]);
    if (res) {
      const decimals = overrideDecimals ?? res.test?.decimals ?? 1;
      updatedResults[res.id] = formatLocaleNumber(value, decimals);
      if (metadata) {
        resultMetadata[res.id] = metadata;
      }
    }
  };

  // 1. Hematology Indices (VGM, TCMH, CCMH)
  const rbc = getVal('RBC') || getVal('GR');
  const hgb = getVal('HGB') || getVal('HB');
  const hct = getVal('HCT') || getVal('HT');
  const rdw = getVal('RDW') || getVal('IDW');
  
  const indicesInput: Record<string, number> = {};
  if (rbc !== null) { indicesInput.RBC = rbc; indicesInput.GR = rbc; }
  if (hgb !== null) { indicesInput.HGB = hgb; indicesInput.HB = hgb; }
  if (hct !== null) { indicesInput.HCT = hct; indicesInput.HT = hct; }
  if (rdw !== null) { indicesInput.RDW = rdw; indicesInput.IDW = rdw; }

  const indices = calculateHematologyIndices(indicesInput);
  if (indices.vgm !== undefined) setVal('VGM', indices.vgm);
  if (indices.tcmh !== undefined) setVal('TCMH', indices.tcmh);
  if (indices.ccmh !== undefined) setVal('CCMH', indices.ccmh);

  // 2. WBC Differential (Absolute counts)
  const wbc = getVal('WBC') || getVal('GB');
  if (wbc) {
    const diffMap = [
      { pct: 'GRA%', abs: 'GRA' },
      { pct: 'LYM%', abs: 'LYM' },
      { pct: 'MID%', abs: 'MID' },
    ];
    diffMap.forEach(({ pct, abs }) => {
      const pVal = getVal(pct);
      const absVal = calculateAbsoluteFromPercentage(pVal, wbc);
      if (absVal !== null) setVal(abs, absVal);
    });
  }

  // 3. Clinical Chemistry (eGFR / CKD-EPI)
  const creatRes = getResByAliases(['CREAT', 'CR', 'CREA', 'CREATININE']);
  const creat = creatRes ? parseLocaleNumber(updatedResults[creatRes.id] || '') : null;
  const patientAge = calculateAgeFromBirthDate(analysis.patient?.birthDate);
  const patientGender = analysis.patient?.gender || null;

  if (creatRes && creat !== null && patientAge !== null) {
    const unit = creatRes.unit || creatRes.test?.unit || 'mg/dL';
    
    const egfr = calculateSmartEGFR(creat, patientAge, patientGender, unit);
    if (egfr !== null) {
      const meta = JSON.stringify({ formula: egfr.formula });
      setVal('DFG', egfr.value, 0, meta); 
      setVal('eGFR', egfr.value, 0, meta);
    }
  }

  const calculatedFormulas = applyCalculatedTestFormulas(analysis, updatedResults);
  // Pour l'instant on ne gère pas de metadata complexe pour les formules basiques
  // mais on merge les résultats
  Object.assign(updatedResults, calculatedFormulas);

  return { updatedResults, resultMetadata };
}

function calculateAgeFromBirthDate(birthDate?: Date | string | null): number | null {
  if (!birthDate) return null;

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function calculateResultMetrics(
  analysis: Analysis,
  results: Record<string, string>
): ResultMetrics {
  const leafResults = analysis.results.filter((result: Result) => !result.test?.isGroup);
  const totalCount = leafResults.length;
  const completedCount = leafResults.filter((result: Result) => {
    const value = results[result.id];
    return Boolean(value) && value !== '';
  }).length;
  const abnormalCount = leafResults.filter((result: Result) => {
    const test = result.test;
    if (!test) return false;
    return isResultAbnormal(results[result.id], result, analysis.patient?.gender);
  }).length;

  return {
    totalCount,
    completedCount,
    abnormalCount,
    progressPct: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

export function getPaymentStatusDisplay(
  paymentStatus: Analysis['paymentStatus']
): PaymentStatusDisplay {
  if (paymentStatus === 'PAID') {
    return {
      label: 'Payé',
      classes: 'status-pill status-pill-success',
    };
  }

  if (paymentStatus === 'PARTIAL') {
    return {
      label: 'Partiellement payé',
      classes: 'status-pill status-pill-warning',
    };
  }

  return {
    label: 'Non payé',
    classes: 'status-pill status-pill-error',
  };
}
