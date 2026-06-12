import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isThisWeek } from 'date-fns';
import { Analysis } from '@/lib/core/types';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';

import { ANALYSIS_STATUSES, AnalysisStatus } from '@/lib/analysis/analysis-status';
import { isAnalysisFinalValidated } from '@/lib/analysis/status-flow';

export type StatusFilter = 'all' | AnalysisStatus;
export type DateFilter = 'today' | 'yesterday' | 'week' | 'custom' | 'all';

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  ...(Object.entries(ANALYSIS_STATUSES) as [AnalysisStatus, {label: string}][]).map(([key, meta]) => ({
    value: key,
    label: meta.label,
  })),
];

export const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: '7 derniers jours' },
  { value: 'custom', label: 'Date personnalisée' },
  { value: 'all', label: 'Tout historique' },
];

export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

export function useAnalysesList() {
  const searchParams = useSearchParams();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [customDate, setCustomDate] = useState('');
  const [itemsPerPage, setItemsPerPage] = useLocalStorageState<number>('analyses:itemsPerPage', 10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tatThresholds, setTatThresholds] = useState({ warnMinutes: 45, alertMinutes: 60 });
  const [currencyUnit, setCurrencyUnit] = useState('DA');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchValue(query);
      setDateFilter('all');
    }
  }, [searchParams]);

  useEffect(() => {
    let start = '';
    let end = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      start = today.toISOString();
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      start = yesterday.toISOString();
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      end = yesterdayEnd.toISOString();
    } else if (dateFilter === 'week') {
      const monday = new Date(today);
      const day = monday.getDay() || 7;
      monday.setHours(-24 * (day - 1));
      start = monday.toISOString();
    } else if (dateFilter === 'custom' && customDate) {
      const selected = new Date(customDate);
      selected.setHours(0, 0, 0, 0);
      start = selected.toISOString();
      const selectedEnd = new Date(selected);
      selectedEnd.setHours(23, 59, 59, 999);
      end = selectedEnd.toISOString();
    }

    const loadAnalyses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          paginated: 'true',
          page: String(currentPage),
          limit: String(itemsPerPage),
          q: searchValue,
          status: statusFilter,
        });

        if (start) params.set('start', start);
        if (end) params.set('end', end);

        const [response, tatResponse, settingsResponse] = await Promise.all([
          fetch(`/api/analyses?${params.toString()}`, { cache: 'no-store' }),
          fetch('/api/tat-settings', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
        ]);

        if (!response.ok) throw new Error('Erreur API');
        const data = await response.json();
        
        setAnalyses(data.items || []);
        setTotalPages(data.pagination?.pages || 1);

        if (tatResponse.ok) {
          const tatData = await tatResponse.json();
          setTatThresholds({
            warnMinutes: Number(tatData.tatWarn) || 45,
            alertMinutes: Number(tatData.tatAlert) || 60,
          });
        }

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setCurrencyUnit(settingsData.amount_unit || 'DA');
        }
      } catch (error) {
        console.error('Erreur analyses:', error);
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce to avoid querying every keystroke in search
    const timer = setTimeout(() => {
      loadAnalyses();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, dateFilter, customDate, statusFilter, itemsPerPage, currentPage]);

  useEffect(() => {
    // Reset to page 1 only if filters change, not itemsPerPage (though that could be reset too)
    setCurrentPage(1);
  }, [searchValue, dateFilter, customDate, statusFilter, itemsPerPage]);

  const paginatedAnalyses = analyses;
  const filteredAnalyses = analyses; // for UI reference if it uses length

  const handleDeleteRequest = (event: React.MouseEvent, analysisId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setConfirmDialog({ open: true, id: analysisId });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    const id = confirmDialog.id;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Suppression impossible');
      setAnalyses((previous) => previous.filter((analysis) => analysis.id !== id));
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setDeletingId(null);
      setConfirmDialog({ open: false, id: null });
    }
  };

  const handlePrintRequest = (event: React.MouseEvent, analysisId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Silent Iframe Print
    const iframeId = `print-iframe-${analysisId}`;
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    // Navigating to the export page with autoprint=1 will trigger window.print() inside it
    iframe.src = `/analyses/${analysisId}/export?autoprint=1`;
  };

  const handleEmailRequest = async (event: React.MouseEvent, analysis: Analysis) => {
    event.preventDefault();
    event.stopPropagation();
    const recipientEmail = analysis.patient?.email;
    if (!recipientEmail) {
      alert("Ce patient n'a pas d'adresse email configurée.");
      return;
    }
    
    setSendingEmailId(analysis.id);
    try {
      const response = await fetch(`/api/analyses/${analysis.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur lors de l’envoi de l’email');
      }
      
      // Optimistic UI update
      setAnalyses((prev) => prev.map((a) => a.id === analysis.id ? { ...a, emailedAt: new Date() } : a));
      alert(`Email envoyé avec succès à ${recipientEmail}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue.';
      alert(message);
    } finally {
      setSendingEmailId(null);
    }
  };

  return {
    loading,
    searchValue,
    setSearchValue,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    customDate,
    setCustomDate,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    tatThresholds,
    currencyUnit,
    filteredAnalyses,
    paginatedAnalyses,
    totalPages,
    deletingId,
    sendingEmailId,
    confirmDialog,
    setConfirmDialog,
    handleDeleteRequest,
    handleConfirmDelete,
    handlePrintRequest,
    handleEmailRequest,
  };
}
