'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { PERIOD_LABELS, type Instrument, type TemperaturePeriod } from '@/components/temperature/types';

interface RecordReadingModalProps {
  open: boolean;
  instrument: Instrument | null;
  selectedPeriod: TemperaturePeriod;
  recordValue: string;
  correctiveAction: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onRecordValueChange: (value: string) => void;
  onCorrectiveActionChange: (value: string) => void;
}

export function RecordReadingModal({
  open,
  instrument,
  selectedPeriod,
  recordValue,
  correctiveAction,
  submitting,
  onClose,
  onSubmit,
  onRecordValueChange,
  onCorrectiveActionChange,
}: RecordReadingModalProps) {
  if (!instrument) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">Relevé {PERIOD_LABELS[selectedPeriod]}</DialogTitle>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">{instrument.name}</p>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <label className="grid gap-2">
              <span className="form-label">Température mesurée</span>
              <div className="input-premium flex h-12 items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={recordValue}
                  onChange={(event) => onRecordValueChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      const next = document.getElementById('correctiveAction');
                      next?.focus();
                    }
                  }}
                  className="w-full border-none bg-transparent text-lg font-semibold outline-none"
                  placeholder={`Ex: ${instrument.targetMin}`}
                  autoFocus
                  required
                />
                <span className="text-xs font-semibold text-[var(--color-text-soft)]">{instrument.unit}</span>
              </div>
            </label>

            <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3 text-xs text-[var(--color-text-soft)]">
              Plage cible: {instrument.targetMin}
              {instrument.unit} à {instrument.targetMax}
              {instrument.unit}
            </div>

            <label className="grid gap-2">
              <span className="form-label">Action corrective (si hors plage)</span>
              <textarea
                id="correctiveAction"
                value={correctiveAction}
                onChange={(event) => onCorrectiveActionChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    onSubmit(event);
                  }
                }}
                rows={3}
                className="input-premium resize-none py-3"
                placeholder="Ex: ajustement thermostat, vérification porte..."
              />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
            <button type="button" className="btn-secondary-sm" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary-sm" disabled={submitting}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
