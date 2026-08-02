'use client';

import { useState, useEffect, useRef } from 'react';

import { NotificationToast } from '@/components/ui/notification-toast';
import { EditAnalysisDialog } from './EditAnalysisDialog';
import { DiatronImportDialog } from './DiatronImportDialog';
import { AnalysisHeaderPanel } from './AnalysisHeaderPanel';
import { AnalysisResultsPanel } from './AnalysisResultsPanel';
import { AnalysisSpecimensPanel } from './AnalysisSpecimensPanel';
import { AnalysisProvider, useAnalysisContext } from './AnalysisContext';

function splitSettingsList(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ResultatsFormContent() {
  const {
    loading,
    analysis,
    notification,
    diatronPreview,
    setDiatronPreview,
    handleDiatronSelect,
    editDialogOpen,
    setEditDialogOpen,
    editForm,
    setEditForm,
    selectedTestIds,
    toggleSelectedTest,
    testSearch,
    setTestSearch,
    availableTests,
    saveAnalysisMeta,
    savingMeta,
    reportSettings,
    printUrl
  } = useAnalysisContext();

  if (loading || !analysis) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-xl bg-[var(--color-surface-muted)]" />
        <div className="h-80 rounded-xl bg-[var(--color-surface-muted)]" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5 pb-16">
        <AnalysisHeaderPanel />
        <AnalysisSpecimensPanel />
        <AnalysisResultsPanel />
      </div>

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}

      <DiatronImportDialog
        preview={diatronPreview}
        onCancel={() => setDiatronPreview(null)}
        onSelect={handleDiatronSelect}
      />

      <EditAnalysisDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editForm={editForm}
        setEditForm={setEditForm}
        selectedTestIds={selectedTestIds}
        toggleSelectedTest={toggleSelectedTest}
        testSearch={testSearch}
        setTestSearch={setTestSearch}
        availableTests={availableTests}
        provenanceOptions={splitSettingsList(reportSettings.provenance_options)}
        prescriberOptions={splitSettingsList(reportSettings.prescriber_options)}
        saveAnalysisMeta={saveAnalysisMeta}
        savingMeta={savingMeta}
      />

      <PrintIframe printUrl={printUrl} />
    </>
  );
}

function PrintIframe({ printUrl }: { printUrl: string | null }) {
  const [printStatus, setPrintStatus] = useState<'idle' | 'sent' | 'failed'>('idle');
  const activePrintUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!printUrl) {
      activePrintUrlRef.current = null;
      return;
    }
    activePrintUrlRef.current = printUrl;
    const timer = setTimeout(() => {
      if (activePrintUrlRef.current === printUrl) {
        setPrintStatus('failed');
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [printUrl]);

  if (!printUrl) return null;

  return (
    <>
      <iframe
        key={printUrl}
        src={printUrl}
        title="Print Engine Frame"
        className="absolute"
        tabIndex={-1}
        style={{ border: 0, left: '-10000px', top: '-10000px', width: '1px', height: '1px', position: 'fixed' }}
        onLoad={() => {
          activePrintUrlRef.current = null;
          setPrintStatus('sent');
        }}
      />
      {printStatus === 'sent' && (
        <NotificationToast type="success" message="Impression envoyée ✓" />
      )}
      {printStatus === 'failed' && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-lg">
          <span className="text-sm font-medium text-amber-800">Impression bloquée — </span>
          <a
            href={printUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
          >
            Ouvrir dans un onglet
          </a>
        </div>
      )}
    </>
  );
}

export function ResultatsForm({
  analysisId,
  prevId,
  nextId,
}: {
  analysisId: string;
  prevId: string | null;
  nextId: string | null;
}) {
  return (
    <AnalysisProvider analysisId={analysisId} prevId={prevId} nextId={nextId}>
      <ResultatsFormContent />
    </AnalysisProvider>
  );
}
