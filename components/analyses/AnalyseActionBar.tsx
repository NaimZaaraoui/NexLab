'use client';

import { createPortal } from 'react-dom';
import { Save } from 'lucide-react';

interface AnalyseActionBarProps {
  selectedCount: number;
  totalAmount: number;
  amountUnit: string;
  isUrgent: boolean;
  isExpired: boolean;
  submitting: boolean;
  submitDisabled: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function AnalyseActionBar({
  selectedCount,
  totalAmount,
  amountUnit,
  isUrgent,
  isExpired,
  submitting,
  submitDisabled,
  onCancel,
  onSubmit,
}: AnalyseActionBarProps) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed right-10 bottom-0 z-[90] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-4 lg:px-5 xl:px-6 print:hidden">
      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <div className="pointer-events-auto flex w-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-3 shadow-[0_18px_40px_rgba(15,31,51,0.14)] backdrop-blur md:flex-row md:items-center md:justify-between sm:px-4">
          <div className="grid w-full grid-cols-3 gap-3 md:flex md:w-auto md:items-center md:gap-6">
            <div className="flex flex-col">
              <span className="section-label">Sélection</span>
              <span className="text-sm font-semibold text-[var(--color-text)]">{selectedCount} examen(s)</span>
            </div>
            <div className="hidden h-8 w-px bg-slate-200 md:block" />
            <div className="flex flex-col">
              <span className="section-label">Total à payer</span>
              <span className="text-base font-semibold tracking-tight text-[var(--color-text)] sm:text-lg">
                {totalAmount.toLocaleString()} <span className="text-[10px] text-[var(--color-text-soft)]">{amountUnit}</span>
              </span>
            </div>
            <div className="hidden h-8 w-px bg-slate-200 md:block" />
            <div className="flex items-center md:block">
              <span className={`status-pill rounded-md px-2.5 py-1 ${isUrgent ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'}`}>
                {isUrgent ? 'Urgent' : 'Routine'}
              </span>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:gap-3 md:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary-md w-full md:w-auto"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={submitDisabled}
              className="btn-primary-md w-full md:w-auto md:min-w-[180px] disabled:cursor-not-allowed disabled:opacity-50"
              title={isExpired ? "Impossible de créer un dossier avec une licence expirée" : "Enregistrer"}
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : isExpired ? (
                <span className="inline font-bold">Bloqué (Licence)</span>
              ) : (
                <>
                  <Save size={18} />
                  <span className="inline">Valider & Créer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
