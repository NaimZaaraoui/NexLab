'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { DiatronPreviewItem } from './types';

interface UseDiatronImportOptions {
  analysisId: string;
  onImportSuccess: () => Promise<void>;
  showNotification: (type: 'success' | 'error', message: string) => void;
  getErrorMessage: (error: unknown) => string;
}

export function useDiatronImport({
  analysisId,
  onImportSuccess,
  showNotification,
  getErrorMessage,
}: UseDiatronImportOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<DiatronPreviewItem[] | null>(null);
  const [lastFileContent, setLastFileContent] = useState<string | null>(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const content = await file.text();
      setLastFileContent(content);

      const res = await fetch(`/api/analyses/${analysisId}/import/diatron`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de l’import');
      }

      const data = await res.json();

      if (data.preview) {
        setPreview(data.records);
      } else {
        showNotification('success', data.message || 'Importation réussie');
        await onImportSuccess();
      }
    } catch (error: unknown) {
      showNotification('error', getErrorMessage(error));
    } finally {
      setIsImporting(false);
      resetFileInput();
    }
  };

  const handleSelect = async (index: number) => {
    if (!lastFileContent) return;

    setIsImporting(true);
    setPreview(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/import/diatron`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: lastFileContent, selectedIndex: index }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de l’import');
      }

      const data = await res.json();
      showNotification('success', data.message || 'Importation réussie');
      await onImportSuccess();
    } catch (error: unknown) {
      showNotification('error', getErrorMessage(error));
    } finally {
      setIsImporting(false);
    }
  };

  return {
    fileInputRef,
    isImporting,
    diatronPreview: preview,
    setDiatronPreview: setPreview,
    handleDiatronFileChange: handleFileChange,
    handleDiatronSelect: handleSelect,
  };
}
