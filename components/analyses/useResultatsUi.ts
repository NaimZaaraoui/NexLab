import { useCallback, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { applyRenalAutoSelection, type RenalTestOption } from '@/lib/renal-tests';
import type { ResultWithRenderCategory, AnalysisInputsMap } from './types';

interface UseResultatsUiOptions {
  analysisId: string;
  selectedIds: string[];
  sortedResults: ResultWithRenderCategory[];
  inputsRef: MutableRefObject<AnalysisInputsMap>;
  setSelectedTestIds: Dispatch<SetStateAction<string[]>>;
  availableTests: RenalTestOption[];
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, total: number) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();
    let nextIndex = (index + 1) % total;
    let steps = 0;

    while (steps < total) {
      const next = sortedResults[nextIndex]?.test;
      if (!next?.isGroup && next?.resultType !== 'calculated' && !next?.isOptional) break;
      nextIndex = (nextIndex + 1) % total;
      steps += 1;
    }

    const nextId = sortedResults[nextIndex]?.id;
    if (nextId && inputsRef.current[nextId]) {
      inputsRef.current[nextId]?.focus();
    }
  }, [inputsRef, sortedResults]);

  const toggleSelectedTest = useCallback((testId: string) => {
    setSelectedTestIds((prev) => (
      applyRenalAutoSelection(
        prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId],
        availableTests
      )
    ));
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
