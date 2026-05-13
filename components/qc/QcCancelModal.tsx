'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface Props {
  isOpen: boolean;
  motive: string;
  savingCancel: boolean;
  onClose: () => void;
  onMotiveChange: (motive: string) => void;
  onConfirm: () => void;
}

export function QcCancelModal({
  isOpen,
  motive,
  savingCancel,
  onClose,
  onMotiveChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">Invalider le point</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col">
          <p className="text-sm text-[var(--color-text-soft)] mb-4 leading-relaxed">
            Un point invalidé ne sera plus pris en compte dans les calculs de Levey-Jennings ni dans la moyenne mensuelle.
          </p>
          <textarea
            value={motive}
            onChange={(e) => onMotiveChange(e.target.value)}
            placeholder="Motif d'invalidation (obligatoire)..."
            className="input-premium mb-5 h-24 resize-none text-sm"
          />
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary-md w-full">Annuler</button>
            <button 
              onClick={onConfirm} 
              disabled={!motive.trim() || savingCancel}
              className="btn-primary-md w-full bg-rose-500 hover:bg-rose-600 border-rose-500 disabled:opacity-50"
            >
              {savingCancel ? 'Sauvegarde...' : 'Invalider'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
