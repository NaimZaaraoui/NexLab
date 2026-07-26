import { useCallback } from 'react';
import type { Analysis } from '@/lib/core/types';
import type { EditAnalysisForm } from './types';

interface UseResultatsPersistenceOptions {
  analysisId: string;
  analysis: Analysis | null;
  results: Record<string, string>;
  resultMetadata: Record<string, string>;
  notes: Record<string, string>;
  globalNote: string;
  globalNotePlacement: 'all' | 'first' | 'last';
  editForm: EditAnalysisForm;
  selectedTestIds: string[];
  paymentAmountInput: string;
  paymentMethod: string;
  emailConfigured: boolean;
  showNotification: (type: 'success' | 'error', message: string) => void;
  getErrorMessage: (error: unknown) => string;
  loadAnalysis: () => Promise<void>;
  setAnalysis: (analysis: Analysis) => void;
  setSaving: (value: boolean) => void;
  setSaveGlobalNoteBusy: (value: boolean) => void;
  setSavingMeta: (value: boolean) => void;
  setEditDialogOpen: (value: boolean) => void;
  setSendingEmail: (value: boolean) => void;
  setSavingPayment: (value: boolean) => void;
  setPaymentAmountInput: (value: string) => void;
}

export function useResultatsPersistence({
  analysisId,
  analysis,
  results,
  resultMetadata,
  notes,
  globalNote,
  globalNotePlacement,
  editForm,
  selectedTestIds,
  paymentAmountInput,
  paymentMethod,
  emailConfigured,
  showNotification,
  getErrorMessage,
  loadAnalysis,
  setAnalysis,
  setSaving,
  setSaveGlobalNoteBusy,
  setSavingMeta,
  setEditDialogOpen,
  setSendingEmail,
  setSavingPayment,
  setPaymentAmountInput,
}: UseResultatsPersistenceOptions) {
  const readResponseErrorMessage = useCallback(async (response: Response, fallback: string) => {
    const bodyText = await response.text();
    try {
      const parsed = JSON.parse(bodyText) as { error?: string; details?: string };
      return parsed.details || parsed.error || fallback;
    } catch {
      return bodyText || fallback;
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/results`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, notes, metadata: resultMetadata }),
      });
      if (!response.ok) {
        let errorMessage = 'Erreur serveur';
        const bodyText = await response.text();
        try {
          const error = JSON.parse(bodyText);
          errorMessage = error.error || error.details || errorMessage;
        } catch {
          errorMessage = bodyText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      await loadAnalysis();
      showNotification('success', 'Résultats sauvegardés avec succès');
    } catch (error) {
      showNotification('error', `Erreur lors de la sauvegarde: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }, [analysis, analysisId, getErrorMessage, loadAnalysis, notes, results, resultMetadata, setSaving, showNotification]);

  const saveGlobalNote = useCallback(async () => {
    setSaveGlobalNoteBusy(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalNote, globalNotePlacement }),
      });
      if (!response.ok) throw new Error("Impossible d'enregistrer la note globale");
      const updated = await response.json();
      setAnalysis(updated);
      showNotification('success', 'Note globale enregistrée');
    } catch {
      showNotification('error', 'Erreur lors de la sauvegarde de la note globale');
    } finally {
      setSaveGlobalNoteBusy(false);
    }
  }, [analysisId, globalNote, globalNotePlacement, setAnalysis, setSaveGlobalNoteBusy, showNotification]);

  const saveAnalysisMeta = useCallback(async () => {
    setSavingMeta(true);
    try {
      const testsResponse = await fetch(`/api/analyses/${analysisId}/results`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testsIds: selectedTestIds }),
      });
      if (!testsResponse.ok) {
        throw new Error(await readResponseErrorMessage(testsResponse, 'Impossible de mettre à jour les tests sélectionnés'));
      }

      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyId: editForm.dailyId,
          receiptNumber: editForm.receiptNumber,
          provenance: editForm.provenance,
          medecinPrescripteur: editForm.medecinPrescripteur,
          isUrgent: editForm.isUrgent,
        }),
      });
      if (!response.ok) {
        throw new Error(await readResponseErrorMessage(response, 'Impossible de mettre à jour le dossier'));
      }
      await response.json();
      await loadAnalysis();
      setEditDialogOpen(false);
      showNotification('success', 'Dossier mis à jour');
    } catch (error) {
      showNotification('error', getErrorMessage(error) || 'Erreur lors de la mise à jour du dossier');
    } finally {
      setSavingMeta(false);
    }
  }, [analysisId, editForm, getErrorMessage, loadAnalysis, readResponseErrorMessage, selectedTestIds, setEditDialogOpen, setSavingMeta, showNotification]);

  const savePayment = useCallback(async (amount: number) => {
    if (!analysis) return;

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      showNotification('error', 'Montant payé invalide');
      return;
    }

    setSavingPayment(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: parsed,
          paymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du paiement');
      }
      await loadAnalysis();
      showNotification('success', 'Paiement mis à jour');
    } catch (error: unknown) {
      showNotification('error', getErrorMessage(error));
    } finally {
      setSavingPayment(false);
    }
  }, [analysis, analysisId, getErrorMessage, loadAnalysis, paymentMethod, setSavingPayment, showNotification]);

  const handleSavePayment = useCallback(async () => {
    if (!analysis) return;
    await savePayment(Number(paymentAmountInput));
  }, [analysis, paymentAmountInput, savePayment]);

  const handlePayAll = useCallback(async () => {
    if (!analysis) return;
    const fullAmount = (analysis.patientShare ?? 0) > 0
      ? Number(analysis.patientShare)
      : Number(analysis.totalPrice ?? 0);
    if (fullAmount <= 0) {
      showNotification('error', 'Le montant total est à zéro, veuillez saisir un montant manuellement.');
      return;
    }
    setPaymentAmountInput(String(fullAmount));
    await savePayment(fullAmount);
  }, [analysis, savePayment, setPaymentAmountInput, showNotification]);

  const handleSendEmail = useCallback(async () => {
    if (!analysis) return;

    if (!emailConfigured) {
      showNotification('error', "Le service email n'est pas configuré sur ce serveur.");
      return;
    }

    const recipientEmail = analysis.patient?.email;
    if (!recipientEmail) {
      showNotification('error', "Le patient n'a pas d'adresse email renseignée.");
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de l'envoi");
      }

      showNotification('success', `Email envoyé avec succès à ${recipientEmail}`);
    } catch (error: unknown) {
      showNotification('error', getErrorMessage(error) || "Échec de l'envoi de l'email");
    } finally {
      setSendingEmail(false);
    }
  }, [analysis, analysisId, emailConfigured, getErrorMessage, setSendingEmail, showNotification]);

  return {
    handleSave,
    saveGlobalNote,
    saveAnalysisMeta,
    handleSavePayment,
    handlePayAll,
    handleSendEmail,
  };
}
