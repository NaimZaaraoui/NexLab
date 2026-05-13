'use client';

import { useCallback, useState } from 'react';
import type { Analysis, Result } from '@/lib/types';

interface UseResultInteractionsOptions {
  analysis: Analysis | null;
  showNotification: (type: 'success' | 'error', message: string) => void;
}

export function useResultInteractions({
  analysis,
  showNotification,
}: UseResultInteractionsOptions) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const toggleNote = (id: string) => {
    const isOpening = !expandedNotes.includes(id);
    if (isOpening) {
      setDraftNotes((prev) => ({ ...prev, [id]: notes[id] || '' }));
    }

    setExpandedNotes((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const handleNoteChange = (id: string, value: string) => {
    setDraftNotes((prev) => ({ ...prev, [id]: value }));
  };

  const applyNote = (id: string) => {
    setNotes((prev) => ({ ...prev, [id]: draftNotes[id] || '' }));
    showNotification('success', "Note enregistrée localement (pensez à sauvegarder l'analyse)");
    toggleNote(id);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDraftNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showNotification('success', 'Note supprimée');
    if (expandedNotes.includes(id)) {
      toggleNote(id);
    }
  };

  const toggleSelectAll = (totalCount: number) => {
    if (selectedIds.length === totalCount) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(
      analysis?.results
        .filter((result: Result) => !result.test?.isGroup)
        .map((result: Result) => result.id) || []
    );
  };

  const initializeFromAnalysis = useCallback((nextNotes: Record<string, string>) => {
    setNotes(nextNotes);
    setDraftNotes({});
    setExpandedNotes([]);
  }, []);

  return {
    notes,
    setNotes,
    draftNotes,
    expandedNotes,
    activeTab,
    setActiveTab,
    selectedIds,
    toggleSelection,
    toggleNote,
    handleNoteChange,
    applyNote,
    deleteNote,
    toggleSelectAll,
    initializeFromAnalysis,
  };
}
