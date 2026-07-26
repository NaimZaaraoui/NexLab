'use client';

import { useCallback, useState } from 'react';
import type { Analysis } from '@/lib/core/types';
import type { AnalysisQcReadiness } from './types';

interface UseAnalysisValidationOptions {
  analysisId: string;
  analysis: Analysis | null;
  results: Record<string, string>;
  showNotification: (type: 'success' | 'error', message: string) => void;
  onValidated: () => Promise<void>;
}

export function useAnalysisValidation({
  analysisId,
  analysis,
  results,
  showNotification,
  onValidated,
}: UseAnalysisValidationOptions) {
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [qcReadiness, setQcReadiness] = useState<AnalysisQcReadiness | null>(null);

  const loadQcReadiness = useCallback(async () => {
    try {
      const response = await fetch(`/api/analyses/${analysisId}/qc-readiness`, { cache: 'no-store' });
      if (!response.ok) {
        setQcReadiness(null);
        return;
      }
      const data = (await response.json()) as AnalysisQcReadiness;
      setQcReadiness(data);
    } catch (error) {
      console.error('Erreur chargement statut QC analyse', error);
      setQcReadiness(null);
    }
  }, [analysisId]);

  const handleValidation = useCallback(async (type: 'tech' | 'bio') => {
    if (!analysis) return;

    if (type === 'tech') {
      // Identifier tous les tests qui agissent comme parents
      const parentTestIds = new Set(
        analysis.results
          .map((r) => r.test?.parentId)
          .filter((pid): pid is string => Boolean(pid))
      );

      // Exclude group headers, calculated fields, explicitly optional tests, AND tests that act as parents
      const requiredResults = analysis.results.filter((result) => {
        return (
          !result.test?.isGroup &&
          result.test?.resultType !== 'calculated' &&
          !result.test?.isOptional &&
          (!result.test?.id || !parentTestIds.has(result.test.id))
        );
      });
      const testCount = requiredResults.length;
      const completedCount = requiredResults.filter((result) => {
        return Boolean(results[result.id]) && results[result.id] !== '';
      }).length;

      if (testCount === 0 || completedCount < testCount) {
        const message = 'Saisissez tous les résultats et sauvegardez avant la validation technique.';
        setValidationError(message);
        showNotification('error', message);
        return;
      }
    }

    setValidating(true);
    setValidationError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setValidationError(data.error || 'Erreur de validation');
        return;
      }

      await onValidated();
      await loadQcReadiness();
      showNotification(
        'success',
        type === 'tech'
          ? 'Validation technique enregistrée'
          : 'Résultats libérés — validation biologique enregistrée'
      );
    } catch {
      setValidationError('Erreur réseau');
    } finally {
      setValidating(false);
    }
  }, [analysis, analysisId, loadQcReadiness, onValidated, results, showNotification]);

  return {
    validating,
    validationError,
    qcReadiness,
    loadQcReadiness,
    handleValidation,
  };
}
