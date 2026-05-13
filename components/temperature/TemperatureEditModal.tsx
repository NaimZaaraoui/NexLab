'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import type { TemperatureReading } from '@/components/temperature/types';

interface TemperatureEditModalProps {
  reading: TemperatureReading | null;
  value: string;
  measuredAt: string;
  correctiveAction: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onValueChange: (value: string) => void;
  onMeasuredAtChange: (value: string) => void;
  onCorrectiveActionChange: (value: string) => void;
}

export function TemperatureEditModal({
  reading,
  value,
  measuredAt,
  correctiveAction,
  saving,
  onClose,
  onSubmit,
  onValueChange,
  onMeasuredAtChange,
  onCorrectiveActionChange,
}: TemperatureEditModalProps) {
  if (!reading) return null;

  return (
    <Dialog open={!!reading} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] bg-white max-w-xl flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">Corriger un relevé</DialogTitle>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">
            {new Date(reading.recordedAt).toLocaleString('fr-FR')} · {reading.period}
          </p>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <label className="grid gap-2">
              <span className="form-label">Valeur mesurée</span>
              <input
                type="number"
                step="0.1"
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                className="input-premium h-11"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="form-label">Heure de mesure</span>
              <input
                type="datetime-local"
                value={measuredAt}
                onChange={(event) => onMeasuredAtChange(event.target.value)}
                className="input-premium h-11"
              />
            </label>
            <label className="grid gap-2">
              <span className="form-label">Action corrective</span>
              <textarea
                value={correctiveAction}
                onChange={(event) => onCorrectiveActionChange(event.target.value)}
                rows={3}
                className="input-premium resize-none py-3"
              />
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
            <button type="button" className="btn-secondary-sm" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary-sm" disabled={saving}>
              {saving ? 'Mise à jour...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
