'use client';

import { DownloadCloud, Loader2, Plus, Search } from 'lucide-react';

interface PatientsToolbarProps {
  total: number;
  role: string;
  searchTerm: string;
  isSearching: boolean;
  onSearchTermChange: (value: string) => void;
  onOpenExports: () => void;
  onNewAnalysis: () => void;
}

export function PatientsToolbar({
  total,
  role,
  searchTerm,
  isSearching,
  onSearchTermChange,
  onOpenExports,
  onNewAnalysis,
}: PatientsToolbarProps) {
  return (
    <>
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">Patients</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Répertoire central des dossiers patients.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-md border bg-[var(--color-surface-muted)] px-3 py-2 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Total</div>
              <div className="text-lg font-semibold text-[var(--color-text)]">{total}</div>
            </div>

            <button onClick={onOpenExports} className="btn-secondary h-11 px-4">
              <DownloadCloud className="h-4 w-4" />
              Exporter
            </button>

            {role !== 'MEDECIN' && (
              <button onClick={onNewAnalysis} className="btn-primary-md px-4">
                <Plus className="h-4 w-4" />
                Nouveau dossier
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-[var(--color-surface)] p-3 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex h-11 items-center gap-2 rounded-md border bg-[var(--color-surface)] px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Rechercher par nom, prénom ou téléphone..."
            className="h-full w-full border-0 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
          />
          {isSearching && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-[var(--color-text-soft)]">
              <Loader2 size={12} className="animate-spin" />
              Recherche...
            </span>
          )}
        </div>
      </section>
    </>
  );
}
