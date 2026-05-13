import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type ExcelRow = Record<string, unknown>;

interface ExcelPatient {
  id: string;
  lastName?: string | null;
  firstName?: string | null;
  gender?: string | null;
  birthDate?: string | Date | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt?: string | Date | null;
}

interface ExcelAnalysisSummary {
  patientId?: string | null;
  orderNumber?: string | null;
  dailyId?: string | null;
  patientFirstName?: string | null;
  patientLastName?: string | null;
  patientGender?: string | null;
  patientAge?: number | null;
  status?: string | null;
  totalPrice?: number | null;
  creationDate: string | Date;
  validatedBioName?: string | null;
  validatedTechName?: string | null;
}

interface ExcelTestCategory {
  name?: string | null;
}

interface ExcelTestDefinition {
  code?: string | null;
  name?: string | null;
  categoryRel?: ExcelTestCategory | null;
  isGroup?: boolean | null;
  resultType?: string | null;
  unit?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  minValueM?: number | null;
  maxValueM?: number | null;
  minValueF?: number | null;
  maxValueF?: number | null;
  price?: number | null;
  sampleType?: string | null;
  parentId?: string | null;
}

interface ExcelResultEntry {
  test?: ExcelTestDefinition | null;
  value?: string | null;
  unit?: string | null;
  abnormal?: boolean | null;
  notes?: string | null;
}

interface ExcelAnalysisWithResults extends ExcelAnalysisSummary {
  results?: ExcelResultEntry[] | null;
}

/**
 * Utility to export data to Excel
 */
export const exportToExcel = <T extends Record<string, unknown>>(
  data: T[],
  fileName: string,
  sheetName: string = 'Sheet1'
) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Create a blob and trigger download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Format patient data for Excel
 */
export const formatPatientsForExcel = (patients: unknown[]): ExcelRow[] => {
  return (patients as ExcelPatient[]).map(p => ({
    'ID': p.id.substring(0, 8).toUpperCase(),
    'Nom': p.lastName?.toUpperCase() || '',
    'Prénom': p.firstName || '',
    'Sexe': p.gender === 'M' ? 'Homme' : 'Femme',
    'Âge': p.birthDate ? differenceInYears(new Date(), new Date(p.birthDate)) : '?',
    'Téléphone': p.phoneNumber || '',
    'Email': p.email || '',
    'Adresse': p.address || '',
    'Date Inscription': p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''
  }));
};

/**
 * Format analysis data for Excel
 */
export const formatAnalysesForExcel = (
  analyses: unknown[],
  currencyUnit: string = 'DA'
): ExcelRow[] => {
  return (analyses as ExcelAnalysisSummary[]).map(a => ({
    'N° Commande': a.orderNumber,
    'ID Paillasse': a.dailyId || '',
    'Patient': `${a.patientFirstName || ''} ${a.patientLastName || ''}`.trim(),
    'Sexe': a.patientGender === 'M' ? 'H' : 'F',
    'Âge': a.patientAge || '?',
    'Statut': a.status === 'completed' || a.status === 'validated_bio' ? 'Validé' : 
              a.status === 'validated_tech' ? 'Valid. Tech' : 'En cours',
    [`Total (${currencyUnit})`]: a.totalPrice || 0,
    'Date Création': a.creationDate ? format(new Date(a.creationDate), 'dd/MM/yyyy HH:mm', { locale: fr }) : '',
    'Validé par': a.validatedBioName || a.validatedTechName || ''
  }));
};

/**
 * Format detailed results for Excel
 */
export const formatResultsForExcel = (
  analysesWithResults: unknown[]
): ExcelRow[] => {
  const rows: ExcelRow[] = [];
  
  (analysesWithResults as ExcelAnalysisWithResults[]).forEach(analysis => {
    analysis.results?.forEach((res) => {
      if (res.test?.isGroup) return;
      if (!res.test) return; // Skip orphaned results
      
      const refMin = res.test.minValue ?? res.test.minValueM ?? null;
      const refMax = res.test.maxValue ?? res.test.maxValueM ?? null;

      rows.push({
        'Date': format(new Date(analysis.creationDate), 'dd/MM/yyyy', { locale: fr }),
        'N° Commande': analysis.orderNumber,
        'Patient': `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim(),
        'Examen': res.test?.name || '',
        'Code': res.test?.code || '',
        'Résultat': res.value || '',
        'Unité': res.unit || res.test?.unit || '',
        'Ref. Min': refMin ?? '',
        'Ref. Max': refMax ?? '',
        'Normalité': res.abnormal ? 'Anormal' : 'Normal',
        'Note': res.notes || ''
      });
    });
  });
  
  return rows;
};

// Helper for age calculation (since we might not have date-fns/differenceInYears imported everywhere)
function differenceInYears(dateLeft: Date, dateRight: Date): number {
  const diff = dateLeft.getTime() - dateRight.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

/**
 * Format tests catalog for Excel
 */
export const formatTestsForExcel = (
  tests: unknown[],
  currencyUnit: string = 'DA'
): ExcelRow[] => {
  return (tests as ExcelTestDefinition[])
    .filter(t => !t.parentId)
    .map(t => {
      const refRange = buildReferenceRange(t);
      return {
        'Code': t.code || '',
        'Nom du Test': t.name || '',
        'Catégorie': t.categoryRel?.name || '',
        'Type': t.isGroup ? 'Groupe' : t.resultType || 'Numérique',
        'Unité': t.unit || '',
        'Référence': refRange,
        [`Prix (${currencyUnit})`]: t.price || 0,
        'Type Échantillon': t.sampleType || ''
      };
    });
};

interface DailySummary {
  date: string;
  count: number;
  total: number;
  validated: number;
  pending: number;
}

interface MonthlySummary {
  month: string;
  count: number;
  total: number;
  validated: number;
  pending: number;
}

/**
 * Format analyses summary per day
 */
export const formatDailySummaryForExcel = (
  analyses: unknown[],
  currencyUnit: string = 'DA'
): ExcelRow[] => {
  const byDate = (analyses as ExcelAnalysisSummary[]).reduce<Record<string, DailySummary>>((acc, a) => {
    const dateKey = format(new Date(a.creationDate), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey, count: 0, total: 0, validated: 0, pending: 0 };
    }
    acc[dateKey].count++;
    acc[dateKey].total += a.totalPrice || 0;
    if (a.status === 'completed' || a.status === 'validated_bio') {
      acc[dateKey].validated++;
    } else {
      acc[dateKey].pending++;
    }
    return acc;
  }, {});

  return Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      'Date': format(new Date(d.date), 'dd/MM/yyyy', { locale: fr }),
      'Nb Analyses': d.count,
      [`Montant Total (${currencyUnit})`]: d.total,
      'Validées': d.validated,
      'En Cours': d.pending,
      'Taux Validation': d.count > 0 ? `${Math.round((d.validated / d.count) * 100)}%` : '0%'
    }));
};

/**
 * Format analyses summary per month
 */
export const formatMonthlySummaryForExcel = (
  analyses: unknown[],
  currencyUnit: string = 'DA'
): ExcelRow[] => {
  const byMonth = (analyses as ExcelAnalysisSummary[]).reduce<Record<string, MonthlySummary>>((acc, a) => {
    const monthKey = format(new Date(a.creationDate), 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, count: 0, total: 0, validated: 0, pending: 0 };
    }
    acc[monthKey].count++;
    acc[monthKey].total += a.totalPrice || 0;
    if (a.status === 'completed' || a.status === 'validated_bio') {
      acc[monthKey].validated++;
    } else {
      acc[monthKey].pending++;
    }
    return acc;
  }, {});

  return Object.values(byMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({
      'Mois': format(new Date(m.month + '-01'), 'MMMM yyyy', { locale: fr }),
      'Nb Analyses': m.count,
      [`Montant Total (${currencyUnit})`]: m.total,
      'Validées': m.validated,
      'En Cours': m.pending,
      'Taux Validation': m.count > 0 ? `${Math.round((m.validated / m.count) * 100)}%` : '0%'
    }));
};

/**
 * Format analyses summary per category
 */
export const formatCategorySummaryForExcel = (
  analysesWithResults: unknown[]
): ExcelRow[] => {
  const byCategory = (analysesWithResults as ExcelAnalysisWithResults[]).reduce<Record<string, { category: string; count: number; abnormal: number; normal: number }>>((acc, a) => {
    (a.results || []).forEach((res) => {
      if (!res.test || res.test?.isGroup) return; // Skip groups & orphans
      const cat = res.test?.categoryRel?.name || 'Non classé';
      if (!acc[cat]) {
        acc[cat] = { category: cat, count: 0, abnormal: 0, normal: 0 };
      }
      acc[cat].count++;
      if (res.abnormal) {
        acc[cat].abnormal++;
      } else {
        acc[cat].normal++;
      }
    });
    return acc;
  }, {});

  return Object.values(byCategory)
    .sort((a, b) => b.count - a.count)
    .map(c => ({
      'Catégorie': c.category,
      'Nb Résultats': c.count,
      'Normaux': c.normal,
      'Anormaux': c.abnormal,
      'Taux Anormal': c.count > 0 ? `${Math.round((c.abnormal / c.count) * 100)}%` : '0%'
    }));
};

/**
 * Format analyses per patient
 */
export const formatPatientAnalysesForExcel = (
  analyses: unknown[],
  currencyUnit: string = 'DA'
): ExcelRow[] => {
  const byPatient = (analyses as ExcelAnalysisSummary[]).reduce<Record<string, { patient: string; gender: string; age: number; count: number; total: number; lastVisit: Date }>>((acc, a) => {
    const key = a.patientId || `${a.patientFirstName ?? ''}${a.patientLastName ?? ''}`;
    if (!acc[key]) {
      acc[key] = {
        patient: `${a.patientFirstName || ''} ${a.patientLastName || ''}`.trim(),
        gender: a.patientGender ?? '',
        age: a.patientAge ?? 0,
        count: 0,
        total: 0,
        lastVisit: new Date(a.creationDate)
      };
    }
    acc[key].count++;
    acc[key].total += a.totalPrice || 0;
    if (new Date(a.creationDate) > acc[key].lastVisit) {
      acc[key].lastVisit = new Date(a.creationDate);
    }
    return acc;
  }, {});

  return Object.values(byPatient)
    .sort((a, b) => b.count - a.count)
    .map(p => ({
      'Patient': p.patient,
      'Sexe': p.gender === 'M' ? 'Homme' : 'Femme',
      'Âge': p.age || '?',
      'Nb Analyses': p.count,
      [`Total Dépenses (${currencyUnit})`]: p.total,
      'Dernière Visite': format(p.lastVisit, 'dd/MM/yyyy', { locale: fr })
    }));
};

function buildReferenceRange(test: ExcelTestDefinition): string {
  const parts: string[] = [];
  
  if (test.minValue !== null && test.maxValue !== null) {
    parts.push(`${test.minValue} - ${test.maxValue}`);
  }
  
  if (test.minValueM !== null && test.maxValueM !== null) {
    parts.push(`H: ${test.minValueM} - ${test.maxValueM}`);
  }
  
  if (test.minValueF !== null && test.maxValueF !== null) {
    parts.push(`F: ${test.minValueF} - ${test.maxValueF}`);
  }
  
  return parts.join(' | ') || '-';
}
