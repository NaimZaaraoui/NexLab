'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { getQcZone } from '@/lib/qc';
import type { QcLot } from '@/components/qc/types';

interface QcEntryModalProps {
  selectedLot: QcLot | null;
  showEntry: boolean;
  comment: string;
  instrumentName: string;
  values: Record<string, string>;
  formatQcNumber: (value: number) => string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onCommentChange: (value: string) => void;
  onInstrumentNameChange: (value: string) => void;
  onValueChange: (testCode: string, value: string) => void;
}

export function QcEntryModal({
  selectedLot,
  showEntry,
  comment,
  instrumentName,
  values,
  formatQcNumber,
  onClose,
  onSubmit,
  onCommentChange,
  onInstrumentNameChange,
  onValueChange,
}: QcEntryModalProps) {
  if (!selectedLot) return null;

  return (
    <Dialog open={showEntry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[90%] bg-white flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-[var(--color-border)]">
          <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">Saisie QC</DialogTitle>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">
            Lot {selectedLot.lotNumber} · {selectedLot.targets.length} paramètre(s)
          </p>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="form-label">Automate / instrument</span>
                <input
                  className="input-premium h-11 bg-[var(--color-surface)]"
                  value={instrumentName}
                  onChange={(event) => onInstrumentNameChange(event.target.value)}
                  placeholder="Ex: Sysmex XP-300"
                />
              </label>
              <label className="grid gap-1">
                <span className="form-label">Commentaire</span>
                <input
                  className="input-premium h-11 bg-[var(--color-surface)]"
                  value={comment}
                  onChange={(event) => onCommentChange(event.target.value)}
                  placeholder="Observation optionnelle"
                />
              </label>
            </div>

            <div className="space-y-3">
              {selectedLot.targets.map((target) => {
                const raw = values[target.testCode];
                const numeric = Number(raw);
                const zScore =
                  Number.isFinite(numeric) && target.controlMode === 'STATISTICAL' && target.sd && target.sd > 0
                    ? (numeric - target.mean) / target.sd
                    : null;
                const acceptanceOk =
                  Number.isFinite(numeric) &&
                  target.controlMode === 'ACCEPTANCE_RANGE' &&
                  target.minAcceptable !== null &&
                  target.maxAcceptable !== null
                    ? numeric >= target.minAcceptable && numeric <= target.maxAcceptable
                    : null;
                const tone =
                  target.controlMode === 'STATISTICAL'
                    ? zScore === null
                      ? 'bg-slate-200'
                      : Math.abs(zScore) > 3
                        ? 'bg-rose-500'
                        : Math.abs(zScore) > 2
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                    : acceptanceOk === null
                      ? 'bg-slate-200'
                      : acceptanceOk
                        ? 'bg-emerald-500'
                        : 'bg-rose-500';

                return (
                  <div key={target.id} className="grid gap-3 rounded-xl border bg-[var(--color-surface-muted)] px-4 py-4 lg:grid-cols-[1.1fr_0.8fr_0.8fr_auto] lg:items-center">
                    <div>
                      <div className="text-sm font-semibold text-[var(--color-text)]">{target.testName}</div>
                      <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                        {target.testCode} · Cible {formatQcNumber(target.mean)} {target.unit || ''}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-slate-700">
                          Mode: {target.controlMode === 'STATISTICAL' ? 'Statistique' : 'Plage'}
                        </span>
                        {target.controlMode === 'STATISTICAL' && target.sd ? (
                          <>
                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-slate-700">
                              1 SD: {formatQcNumber(target.mean - target.sd)} - {formatQcNumber(target.mean + target.sd)}
                            </span>
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                              2 SD: {formatQcNumber(target.mean - target.sd * 2)} - {formatQcNumber(target.mean + target.sd * 2)}
                            </span>
                            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                              3 SD: {formatQcNumber(target.mean - target.sd * 3)} - {formatQcNumber(target.mean + target.sd * 3)}
                            </span>
                          </>
                        ) : (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                            Plage: {formatQcNumber(target.minAcceptable ?? NaN)} - {formatQcNumber(target.maxAcceptable ?? NaN)}
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      className="input-premium h-11 bg-[var(--color-surface)]"
                      value={raw || ''}
                      onChange={(event) => onValueChange(target.testCode, event.target.value)}
                      placeholder="Valeur mesurée"
                    />
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {target.controlMode === 'STATISTICAL'
                        ? zScore === null
                          ? '—'
                          : `z = ${zScore.toFixed(2)}`
                        : acceptanceOk === null
                          ? '—'
                          : acceptanceOk
                            ? 'Dans la plage'
                            : 'Hors plage'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-3 w-3 rounded-full ${tone}`} />
                      <span className="text-xs font-medium text-[var(--color-text-soft)]">
                        {target.controlMode === 'STATISTICAL'
                          ? zScore === null
                            ? 'En attente'
                            : getQcZone(zScore).label
                          : acceptanceOk === null
                            ? 'En attente'
                            : acceptanceOk
                              ? 'Conforme a la plage'
                              : 'Hors plage'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end border-t border-[var(--color-border)] px-6 py-4">
            <button type="submit" className="btn-primary-md px-6">
              Enregistrer le contrôle
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
