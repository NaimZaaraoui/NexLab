import { useCallback, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { applyRenalAutoSelection, type RenalTestOption } from '@/lib/clinical/renal-tests';
import type { ResultWithRenderCategory, AnalysisInputsMap, AvailableTestOption } from './types';

interface UseResultatsUiOptions {
  analysisId: string;
  selectedIds: string[];
  sortedResults: ResultWithRenderCategory[];
  inputsRef: MutableRefObject<AnalysisInputsMap>;
  setSelectedTestIds: Dispatch<SetStateAction<string[]>>;
  availableTests: AvailableTestOption[];
}

export function useResultatsUi({
  analysisId,
  selectedIds,
  sortedResults,
  inputsRef,
  setSelectedTestIds,
  availableTests,
}: UseResultatsUiOptions) {
  const formatValue = useCallback((value: string, decimals: number = 1): string => {
    if (!value) return '';
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return value;
    return num.toFixed(decimals).replace('.', ',');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, total: number, navigationIds?: string[]) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();
    const navigationResults = navigationIds?.length
      ? navigationIds
        .map((id) => sortedResults.find((result) => result.id === id))
        .filter((result): result is ResultWithRenderCategory => Boolean(result))
      : sortedResults;
    const navigationTotal = navigationResults.length || total;
    let nextIndex = (index + 1) % navigationTotal;
    let steps = 0;

    while (steps < navigationTotal) {
      const next = navigationResults[nextIndex]?.test;
      if (!next?.isGroup && next?.resultType !== 'calculated' && !next?.isOptional) break;
      nextIndex = (nextIndex + 1) % navigationTotal;
      steps += 1;
    }

    const nextId = navigationResults[nextIndex]?.id;
    if (nextId && inputsRef.current[nextId]) {
      inputsRef.current[nextId]?.focus();
    }
  }, [inputsRef, sortedResults]);

  const toggleSelectedTest = useCallback((testId: string) => {
    setSelectedTestIds((prev) => {
      const isSelected = prev.includes(testId);
      const test = availableTests.find(t => t.id === testId);
      
      console.log('toggleSelectedTest', { testId, isSelected, isGroup: test?.isGroup });
      
      let nextSelected = isSelected 
        ? prev.filter((id) => id !== testId)
        : [...prev, testId];

      const getAllChildIds = (parentId: string): string[] => {
        const children = availableTests.filter(t => t.parentId === parentId).map(t => t.id);
        return children.reduce((acc, childId) => {
          return [...acc, childId, ...getAllChildIds(childId)];
        }, [] as string[]);
      };

      const childIds = getAllChildIds(testId);
      
      if (childIds.length > 0) {
        console.log('Parent group toggled, childIds:', childIds);
        
        if (isSelected) {
          // Deselect parent -> deselect children
          nextSelected = nextSelected.filter(id => !childIds.includes(id));
        } else {
          // Select parent -> select children
          const toAdd = childIds.filter(id => !nextSelected.includes(id));
          nextSelected = [...nextSelected, ...toAdd];
        }
      }
      
      return applyRenalAutoSelection(nextSelected, availableTests);
    });
  }, [availableTests, setSelectedTestIds]);

  const [printUrl, setPrintUrl] = useState<string | null>(null);

  const handlePrint = useCallback(() => {
    const selected = selectedIds.length > 0 ? `&selected=${selectedIds.join(',')}` : '';
    setPrintUrl(`/analyses/${analysisId}/export?autoprint=1${selected}&_t=${Date.now()}`);
  }, [analysisId, selectedIds]);

  const handlePrintInvoice = useCallback(() => {
    setPrintUrl(`/analyses/${analysisId}/invoice?autoprint=1&_t=${Date.now()}`);
  }, [analysisId]);

  return {
    formatValue,
    handleKeyDown,
    toggleSelectedTest,
    handlePrint,
    handlePrintInvoice,
    printUrl,
  };
}
