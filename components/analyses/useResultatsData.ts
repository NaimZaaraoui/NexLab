import { useCallback, useEffect, useState } from 'react';
import type { Analysis, Result } from '@/lib/core/types';
import { performAnalysisCalculations } from './resultats-metrics';
import type {
  AnalysisNotePlacement,
  AnalysisResultHistory,
  AnalysisResultValues,
  AvailableTestOption,
  EditAnalysisForm,
  ReportSettingsMap,
} from './types';
import { DEFAULT_EDIT_ANALYSIS_FORM } from './types';

interface UseResultatsDataOptions {
  analysisId: string;
}

export function useResultatsData({
  analysisId,
}: UseResultatsDataOptions) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<AnalysisResultValues>({});
  const [resultMetadata, setResultMetadata] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<AnalysisResultHistory>({});
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [availableTests, setAvailableTests] = useState<AvailableTestOption[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [paymentAmountInput, setPaymentAmountInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [globalNote, setGlobalNote] = useState('');
  const [globalNotePlacement, setGlobalNotePlacement] = useState<AnalysisNotePlacement>('all');
  const [editForm, setEditForm] = useState<EditAnalysisForm>(DEFAULT_EDIT_ANALYSIS_FORM);
  const [reportSettings, setReportSettings] = useState<ReportSettingsMap>({});
  const [initialResultNotes, setInitialResultNotes] = useState<Record<string, string>>({});

  const loadHistory = useCallback(async (patientId: string, testId: string, resultId: string) => {
    try {
      const response = await fetch(`/api/results/history?patientId=${patientId}&testId=${testId}&currentAnalysisId=${analysisId}`);
      if (response.ok) {
        const data = await response.json();
        setHistory((prev) => ({ ...prev, [resultId]: data }));
      }
    } catch (error) {
      console.error('History fetch error', error);
    }
  }, [analysisId]);

  const loadAnalysis = useCallback(async () => {
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Analyse non trouvée');
      const data = await response.json();
      setAnalysis(data);

      const initialResults: AnalysisResultValues = {};
      const initialNotes: Record<string, string> = {};
      data.results.forEach((result: Result) => {
        initialResults[result.id] = result.value || '';
        if (result.notes) initialNotes[result.id] = result.notes;
        loadHistory(data.patientId, result.testId, result.id);
      });

      const { updatedResults, resultMetadata: metadata } = performAnalysisCalculations(data, initialResults);
      setResults(updatedResults);
      setResultMetadata(metadata);
      setInitialResultNotes(initialNotes);
      setGlobalNote(data.globalNote || '');
      setGlobalNotePlacement(data.globalNotePlacement || 'all');
      setPaymentAmountInput(String(data.amountPaid ?? 0));
      setPaymentMethod(data.paymentMethod || 'cash');
      setEditForm({
        dailyId: data.dailyId || '',
        receiptNumber: data.receiptNumber || '',
        patientFirstName: data.patientFirstName || '',
        patientLastName: data.patientLastName || '',
        patientAge: data.patientAge !== null && data.patientAge !== undefined ? String(data.patientAge) : '',
        patientGender: data.patientGender || 'M',
        provenance: data.provenance || '',
        medecinPrescripteur: data.medecinPrescripteur || '',
        isUrgent: Boolean(data.isUrgent),
      });
      setSelectedTestIds(Array.from(new Set(data.results.map((r: Result) => r.testId))));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [analysisId, loadHistory]);

  const loadTests = useCallback(async () => {
    try {
      const response = await fetch('/api/tests');
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data)) {
        setAvailableTests([]);
        return;
      }
      const normalized = data
        .filter((item): item is { id: string; code?: string; name?: string } => Boolean(item?.id))
        .map((item) => ({
          id: item.id,
          code: item.code ?? '',
          name: item.name ?? '',
        }));
      setAvailableTests(normalized);
    } catch (error) {
      console.error('Erreur chargement tests', error);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setReportSettings(data);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres impression', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadEmailStatus = async () => {
      try {
        const response = await fetch('/api/email/status');
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setEmailConfigured(Boolean(data?.configured));
        }
      } catch {
        if (!cancelled) {
          setEmailConfigured(false);
        }
      }
    };

    loadEmailStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadAnalysis();
    loadTests();
    loadSettings();
  }, [loadAnalysis, loadSettings, loadTests]);

  return {
    analysis,
    setAnalysis,
    loading,
    results,
    setResults,
    resultMetadata,
    setResultMetadata,
    history,
    emailConfigured,
    availableTests,
    selectedTestIds,
    setSelectedTestIds,
    paymentAmountInput,
    setPaymentAmountInput,
    paymentMethod,
    setPaymentMethod,
    globalNote,
    setGlobalNote,
    globalNotePlacement,
    setGlobalNotePlacement,
    editForm,
    setEditForm,
    reportSettings,
    initialResultNotes,
    loadAnalysis,
  };
}
