import type { Analysis, Result } from '@/lib/types';
import { formatReferenceRange, getTestReferenceValues } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type {
  CategorizedResultsState,
  InvoicePrintItem,
  ParsedHistogramPayload,
  ParsedHistogramState,
  PrintSettings,
  ReferenceDisplay,
} from '@/components/print/types';

export function resolvePrintBranding(settings?: PrintSettings) {
  return {
    LAB_NAME: settings?.lab_name || 'Laboratoire',
    LAB_SUBTITLE: settings?.lab_subtitle || 'Service de Laboratoire',
    LAB_ADDRESS: [settings?.lab_address_1, settings?.lab_address_2].filter(Boolean).join(', '),
    LAB_PHONE: settings?.lab_phone || '',
    LAB_EMAIL: settings?.lab_email || '',
    LAB_LOGO: settings?.lab_logo || '',
    BIO_TITLE: settings?.lab_bio_title || 'Docteur',
    BIO_NAME: settings?.lab_bio_name || '',
    BIO_ONMPT: settings?.lab_bio_onmpt || '',
    FOOTER_TEXT: settings?.lab_footer_text || '',
    REPORT_TITLE: settings?.report_title || "RAPPORT D'ANALYSE",
    REPORT_DISCLAIMER: settings?.report_disclaimer || "Les résultats indiqués ci-dessus ont été obtenus par des méthodes validées et standardisées. Une interprétation clinique par votre médecin traitant est nécessaire.",
    SHOW_DOCTOR: settings?.report_show_doctor !== 'false',
    SHOW_BARCODE: settings?.report_show_barcode !== 'false',
    SHOW_PROVENANCE: settings?.report_show_provenance === 'true',
    SHOW_PREVIOUS_RESULT: settings?.report_show_previous_result !== 'false',
    SHOW_CBC_INDICES: settings?.report_show_cbc_indices !== 'false',
  };
}


export function sortReportResults(results: Result[]): Result[] {
  const sorted: Result[] = [];
  const visited = new Set<string>();
  const resultsMap = new Map(results.map((result) => [result.testId, result]));
  const childrenMap = new Map<string, Result[]>();

  results.forEach((result) => {
    const parentId = result.test?.parentId;
    if (!parentId) return;
    const siblings = childrenMap.get(parentId) || [];
    siblings.push(result);
    childrenMap.set(parentId, siblings);
  });

  const addTestAndChildren = (testId: string) => {
    if (visited.has(testId)) return;
    const result = resultsMap.get(testId);
    if (!result) return;

    sorted.push(result);
    visited.add(testId);

    const children = childrenMap.get(testId) || [];
    [...children]
      .sort((left, right) => (left.test?.rank || 0) - (right.test?.rank || 0))
      .forEach((child) => addTestAndChildren(child.testId));
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

  Object.keys(categoryGroups)
    .sort((left, right) => {
      const leftMeta = categoriesMeta[left];
      const rightMeta = categoriesMeta[right];
      if (leftMeta.rank !== rightMeta.rank) return leftMeta.rank - rightMeta.rank;
      return left.localeCompare(right);
    })
    .forEach((categoryName) => {
      const topLevel = categoryGroups[categoryName]
        .filter((result) => {
          const parentId = result.test?.parentId;
          return !parentId || !resultsMap.has(parentId);
        })
        .sort((left, right) => (left.test?.rank || 0) - (right.test?.rank || 0));

      topLevel.forEach((result) => addTestAndChildren(result.testId));
    });

  results.forEach((result) => {
    if (!visited.has(result.testId)) {
      sorted.push(result);
      visited.add(result.testId);
    }
  });

  return sorted;
}

export function filterSelectedReportResults(baseResults: Result[], selectedResultIds: string[]): Result[] {
  if (selectedResultIds.length === 0) {
    return baseResults;
  }

  const selectedSet = new Set(selectedResultIds);

  const hasSelectedDescendant = (parentId: string): boolean => {
    const children = baseResults.filter((result) => result.test?.parentId === parentId);
    return children.some((child) =>
      (!child.test?.isGroup && selectedSet.has(child.id)) ||
      (child.test?.isGroup && hasSelectedDescendant(child.testId))
    );
  };

  return baseResults.filter((result) => {
    const test = result.test;
    if (!test) return false;
    if (!test.isGroup) return selectedSet.has(result.id);
    return hasSelectedDescendant(result.testId);
  });
}

export function groupReportResultsByCategory(results: Result[]): CategorizedResultsState {
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

  const allOrderedCategories = Object.keys(categoryGroups).sort((left, right) => {
    const leftMeta = categoriesMeta[left];
    const rightMeta = categoriesMeta[right];
    if (leftMeta.rank !== rightMeta.rank) return leftMeta.rank - rightMeta.rank;
    return leftMeta.name.localeCompare(rightMeta.name);
  });

  return {
    categoryGroups,
    allOrderedCategories,
  };
}

export function parseReportHistograms(histogramData: string | null): ParsedHistogramState {
  try {
    if (!histogramData) {
      return { histogramData: null, pltData: null };
    }

    const data = JSON.parse(histogramData) as ParsedHistogramPayload;
    return {
      histogramData: data,
      pltData: {
        bins: data.rbc.bins.slice(0, 60),
        markers: data.rbc.markers.filter((marker) => marker < 60),
      },
    };
  } catch {
    return { histogramData: null, pltData: null };
  }
}

export function buildReportReferenceMap(
  results: Result[] | undefined,
  patientGender: Analysis['patientGender']
) {
  const references = new Map<string, ReferenceDisplay>();

  results?.forEach((result) => {
    if (!result.test) return;
    const refVals = getTestReferenceValues(result.test, patientGender);
    references.set(result.testId, {
      min: refVals.min,
      max: refVals.max,
      display: formatReferenceRange(refVals.min, refVals.max),
    });
  });

  return references;
}

export function buildInvoiceItems(results: Result[] | undefined): InvoicePrintItem[] {
  const safeResults = results || [];
  const items: InvoicePrintItem[] = [];

  safeResults.forEach((result) => {
    const test = result.test;
    if (!test) return;
    if (test.parentId) return;

    if (test.isGroup && test.children && test.children.length > 0) {
      const childIds = test.children.map((child) => child.id);
      const allChildrenPresent = childIds.every((childId) =>
        safeResults.some((entry) => entry.testId === childId)
      );

      if (allChildrenPresent) {
        const price = test.price ?? test.children.reduce((sum, child) => sum + (child.price || 0), 0);
        items.push({ name: test.name, price, isGroup: true });
        return;
      }
    }

    if (test.isGroup) {
      return;
    }

    const childIds = test.children?.map((child) => child.id) || [];
    const presentChildIds = childIds.filter((childId) =>
      safeResults.some((entry) => entry.testId === childId)
    );

    if (presentChildIds.length > 0 && presentChildIds.length < childIds.length) {
      test.children?.forEach((child) => {
        if (safeResults.some((entry) => entry.testId === child.id)) {
          items.push({ name: child.name, price: child.price || 0, isGroup: false });
        }
      });
      return;
    }

    items.push({ name: test.name, price: test.price || 0, isGroup: test.isGroup || false });
  });

  return items;
}

export function resolveEnvelopeRecipient(analysis?: Analysis) {
  return {
    patientName: analysis
      ? `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim()
      : '................................................',
    dailyId: analysis?.dailyId || '........',
    dateStr: analysis
      ? format(new Date(analysis.creationDate), 'dd/MM/yyyy', { locale: fr })
      : '../../....',
  };
}
