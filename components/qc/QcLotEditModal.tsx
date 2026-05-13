'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface QcLotEditModalProps {
  open: boolean;
  saving: boolean;
  lot: {
    id: string;
    lotNumber: string;
    expiryDate: string;
    openedAt: string;
  } | null;
  onClose: () => void;
  onChange: (next: { id: string; lotNumber: string; expiryDate: string; openedAt: string } | null) => void;
  onSave: () => void;
}

export function QcLotEditModal({ open, saving, lot, onClose, onChange, onSave }: QcLotEditModalProps) {
  if (!lot) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !saving && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-xl flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">Modifier le lot QC</DialogTitle>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">Ajustez les informations du lot sans quitter la configuration QC.</p>
        </DialogHeader>

        <div className="grid gap-4 px-6 py-5 overflow-y-auto">
          <label className="grid gap-2">
            <span className="form-label">Numero du lot</span>
            <input
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={lot.lotNumber}
              onChange={(event) => onChange({ ...lot, lotNumber: event.target.value })}
            />
          </label>
          <label className="grid gap-2">
            <span className="form-label">Date d&apos;expiration</span>
            <input
              type="date"
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={lot.expiryDate}
              onChange={(event) => onChange({ ...lot, expiryDate: event.target.value })}
            />
          </label>
          <label className="grid gap-2">
            <span className="form-label">Date d&apos;ouverture</span>
            <input
              type="date"
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={lot.openedAt}
              onChange={(event) => onChange({ ...lot, openedAt: event.target.value })}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
          <button type="button" className="btn-secondary-sm" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className="btn-primary-sm" onClick={onSave} disabled={saving || !lot.lotNumber.trim() || !lot.expiryDate}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
