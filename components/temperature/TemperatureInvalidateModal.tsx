'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import type { TemperatureReading } from '@/components/temperature/types';

interface TemperatureInvalidateModalProps {
  reading: TemperatureReading | null;
  reason: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReasonChange: (value: string) => void;
}

export function TemperatureInvalidateModal({
  reading,
  reason,
  saving,
  onClose,
  onConfirm,
  onReasonChange,
}: TemperatureInvalidateModalProps) {
  if (!reading) return null;

  return (
    <Dialog open={!!reading} onOpenChange={(val) => !val && !saving && onClose()}>
      <DialogContent className="flex bg-white max-h-[90vh] max-w-lg flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">Annuler un relevé</DialogTitle>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">
            {new Date(reading.recordedAt).toLocaleString('fr-FR')} · {reading.period}
          </p>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5 overflow-y-auto">
          <p className="text-sm text-[var(--color-text-soft)]">
            Indiquez le motif d’annulation pour garder une trace claire dans l’historique et l’audit.
          </p>
          <label className="grid gap-2">
            <span className="form-label">Motif d’annulation</span>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={4}
              className="input-premium resize-none py-3"
              placeholder="Ex. erreur de saisie, relevé fait au mauvais horaire, valeur non valide..."
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
          <button type="button" className="btn-secondary-sm" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className="btn-primary-sm" onClick={onConfirm} disabled={saving || !reason.trim()}>
            {saving ? 'Annulation...' : 'Confirmer l’annulation'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
