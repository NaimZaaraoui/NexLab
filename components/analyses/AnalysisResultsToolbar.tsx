import { Activity, Calculator, CheckCircle, Download, Microscope } from 'lucide-react';
import { calculateCbcIndices } from '@/lib/clinical/calculations';

import { useAnalysisContext } from './AnalysisContext';

export function AnalysisResultsToolbar() {
  const {
    analysis,
    activeTab,
    setActiveTab,
    totalCount,
    abnormalCount,
    isFinalValidated,
    hasNFS,
    isImporting,
    fileInputRef,
    handleDiatronFileChange,
    toggleSelectAll,
    selectedIds,
    diatronEnabled,
    cbcIndicesEnabled,
    results,
  } = useAnalysisContext();
  if (!analysis) return null;

  const cbcIndices = cbcIndicesEnabled ? calculateCbcIndices(analysis, results) : [];

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-accent)]">
          <Activity size={16} />
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text)]">Résultats des tests</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md border bg-[var(--color-surface-muted)] p-1">
          <button onClick={() => setActiveTab('all')} className={`rounded-md px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'all' ? 'border bg-[var(--color-surface)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>Tous ({totalCount})</button>
          <button onClick={() => setActiveTab('urgent')} className={`rounded-md px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'urgent' ? 'bg-rose-600 text-white' : 'text-[var(--color-text-secondary)] hover:text-rose-700'}`}>Anomalies ({abnormalCount})</button>
          {analysis.histogramData && (
            <button onClick={() => setActiveTab('charts')} className={`rounded-md px-4 py-2 text-xs font-semibold transition-all ${activeTab === 'charts' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'}`}>Graphiques</button>
          )}
          {cbcIndices.length > 0 && (
            <button onClick={() => setActiveTab('indices')} className={`rounded-md px-4 py-2 text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${activeTab === 'indices' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'}`}>
              <Calculator size={13} />
              Indices
            </button>
          )}
        </div>

        {!isFinalValidated && hasNFS && diatronEnabled && (
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleDiatronFileChange} accept=".txt" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="btn-secondary h-9 text-xs">
              <Microscope size={14} className={isImporting ? 'animate-pulse' : ''} />
              {isImporting ? 'Import...' : 'Diatron'}
            </button>
          </div>
        )}

        {isFinalValidated && (
          <button className="btn-secondary h-9 text-xs" onClick={() => toggleSelectAll(totalCount)}>
            <div className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all ${selectedIds.length === totalCount ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
              {selectedIds.length === totalCount && <CheckCircle size={10} className="text-white" />}
            </div>
            Tout sélectionner
          </button>
        )}

        {isFinalValidated && (
          <a
            href={`/api/analyses/${analysis.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary h-9 text-xs inline-flex items-center gap-1.5"
            title="Télécharger le rapport PDF en cache (instantané)"
          >
            <Download size={13} />
            PDF
          </a>
        )}
      </div>
    </div>
  );
}
