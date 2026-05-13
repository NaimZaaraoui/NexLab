import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Test } from '@/lib/types';
import { usePatientSelection } from './usePatientSelection';
import type { BilanOption } from './analyse-form-types';
import { applyRenalAutoSelection } from '@/lib/renal-tests';

export function useAnalyseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get('patientId');

  const [tests, setTests] = useState<Test[]>([]);
  const [bilans, setBilans] = useState<BilanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTest, setSearchTest] = useState('');
  
  const [dailyId, setDailyId] = useState(''); 
  const [receiptNumber, setReceiptNumber] = useState('');
  const [provenance, setProvenance] = useState('');
  const [medecinPrescripteur, setMedecinPrescripteur] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  const patientState = usePatientSelection({ initialPatientId: urlPatientId });
  
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [labSettings, setLabSettings] = useState<Record<string, string>>({
    amount_unit: 'DA',
    provenance_options: 'Consultation, Externe, Interne, Urgence, Médecin traitant, Maternité, Chirurgie',
    prescriber_options: '',
  });

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const readErrorMessage = useCallback(async (response: Response, fallback: string) => {
    const bodyText = await response.text();
    try {
      const parsed = JSON.parse(bodyText) as { error?: string; details?: string };
      return parsed.details || parsed.error || fallback;
    } catch {
      return bodyText || fallback;
    }
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setLabSettings({
          amount_unit: data.amount_unit || 'DA',
          provenance_options: data.provenance_options || 'Consultation, Externe, Interne, Urgence, Médecin traitant, Maternité, Chirurgie',
          prescriber_options: data.prescriber_options || '',
        });
      })
      .catch(console.error);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [resTests, resBilans] = await Promise.all([
        fetch('/api/tests'),
        fetch('/api/bilans')
      ]);
      const testsData = await resTests.json();
      const bilansData = await resBilans.json();
      setTests(Array.isArray(testsData) ? testsData : []);
      setBilans(Array.isArray(bilansData) ? bilansData : []);
    } catch {
      showNotification('error', 'Erreur chargement des données');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTest = useCallback((testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setSelectedTests(prev => {
      const isSelecting = !prev.includes(testId);
      const childrenIds = test.children?.map((c) => c.id) || [];
      if (isSelecting) {
        return applyRenalAutoSelection(Array.from(new Set([...prev, testId, ...childrenIds])), tests);
      } else {
        return applyRenalAutoSelection(prev.filter(id => id !== testId && !childrenIds.includes(id)), tests);
      }
    });
  }, [tests]);

  const toggleBilan = useCallback((bilan: BilanOption) => {
    const bilanTestIds = bilan.tests.map((t) => t.id);
    const allSelected = bilanTestIds.every((id: string) => selectedTests.includes(id));

    setSelectedTests(prev => {
      if (allSelected) {
        return applyRenalAutoSelection(prev.filter(id => !bilanTestIds.includes(id)), tests);
      } else {
        return applyRenalAutoSelection(Array.from(new Set([...prev, ...bilanTestIds])), tests);
      }
    });
  }, [selectedTests, tests]);

  const filteredTests = tests.filter(test =>
    test.code.toLowerCase().includes(searchTest.toLowerCase()) ||
    test.name.toLowerCase().includes(searchTest.toLowerCase())
  );

  const groupedTests = filteredTests.reduce((acc, test) => {
    const category = test.categoryRel?.name || 'Autres';
    if (!acc[category]) acc[category] = [];
    acc[category].push(test);
    return acc;
  }, {} as Record<string, Test[]>);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!dailyId) {
      showNotification('error', 'Le numéro de paillasse est requis');
      return;
    }
    if (selectedTests.length === 0) {
      showNotification('error', 'Sélectionnez au moins un test');
      return;
    }
    if (!patientState.patient.patientFirstName || !patientState.patient.patientLastName) {
      showNotification('error', 'Le nom et prénom du patient sont requis');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientState.selectedPatientId,
          dailyId,
          ...patientState.patient,
          receiptNumber,
          provenance,
          medecinPrescripteur,
          isUrgent,
          testsIds: selectedTests,
          insuranceProvider: patientState.insuranceProvider || null,
          insuranceNumber: patientState.insuranceNumber || null,
          insuranceCoverage: patientState.insuranceCoverage ? parseFloat(patientState.insuranceCoverage) : null,
        })
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Erreur lors de la création'));
      }
      const analysis = await response.json();
      router.push(`/analyses/${analysis.id}`);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la création');
      setSubmitting(false);
    }
  }, [dailyId, isUrgent, medecinPrescripteur, patientState, provenance, readErrorMessage, receiptNumber, router, selectedTests, showNotification]);

  return {
    router,
    tests,
    bilans,
    loading,
    submitting,
    searchTest,
    setSearchTest,
    dailyId,
    setDailyId,
    receiptNumber,
    setReceiptNumber,
    provenance,
    setProvenance,
    medecinPrescripteur,
    setMedecinPrescripteur,
    isUrgent,
    setIsUrgent,
    patientState,
    selectedTests,
    notification,
    labSettings,
    toggleTest,
    toggleBilan,
    groupedTests,
    handleSubmit,
  };
}
