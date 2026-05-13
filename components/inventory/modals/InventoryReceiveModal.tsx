import { InventoryModalShell } from '@/components/inventory/InventoryModalShell';

interface Props {
  lotNumber: string;
  expiryDate: string;
  quantity: string;
  onLotNumberChange: (v: string) => void;
  onExpiryDateChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function InventoryReceiveModal({
  lotNumber,
  expiryDate,
  quantity,
  onLotNumberChange,
  onExpiryDateChange,
  onQuantityChange,
  onClose,
  onSubmit,
}: Props) {
  return (
    <InventoryModalShell open={true} title="Réceptionner un lot" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex min-h-full flex-col">
        <div className="grid flex-1 gap-4">
          <label className="grid gap-1">
            <span className="form-label">N° de lot</span>
            <input
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={lotNumber}
              onChange={(e) => onLotNumberChange(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="form-label">Date d’expiration</span>
            <input
              type="date"
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={expiryDate}
              onChange={(e) => onExpiryDateChange(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="form-label">Quantité reçue</span>
            <input
              type="number"
              step="0.01"
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
          <button className="btn-primary-md px-5" type="submit">Valider</button>
        </div>
      </form>
    </InventoryModalShell>
  );
}
