import { InventoryModalShell } from '@/components/inventory/InventoryModalShell';
import type { InventoryDetailItem } from '@/components/inventory/types';

interface Props {
  item: InventoryDetailItem;
  quantity: string;
  lotNumber: string;
  reason: string;
  onQuantityChange: (v: string) => void;
  onLotNumberChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function InventoryWasteModal({
  item,
  quantity,
  lotNumber,
  reason,
  onQuantityChange,
  onLotNumberChange,
  onReasonChange,
  onClose,
  onSubmit,
}: Props) {
  return (
    <InventoryModalShell open={true} title="Mise au rebut / retrait de stock" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex min-h-full flex-col">
        <div className="grid flex-1 gap-4">
          <label className="grid gap-1">
            <span className="form-label">Quantité à retirer</span>
            <input
              type="number"
              step="0.01"
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="form-label">Lot ciblé</span>
            <select
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={lotNumber}
              onChange={(e) => onLotNumberChange(e.target.value)}
            >
              <option value="">FEFO automatique</option>
              {item.lots.filter((lot) => lot.isActive && lot.remaining > 0).map((lot) => (
                <option key={lot.id} value={lot.lotNumber}>
                  {lot.lotNumber} · {lot.remaining} {item.unit}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="form-label">Motif de retrait</span>
            <textarea
              className="input-premium min-h-[100px] bg-[var(--color-surface)] p-3"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Périmé, flacon cassé, contamination, lot rejeté..."
              required
            />
          </label>
          <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            Utiliser cette action pour retirer un stock non consommable du circuit.
          </div>
        </div>
        <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
          <button className="btn-primary-md px-5" type="submit">Confirmer le retrait</button>
        </div>
      </form>
    </InventoryModalShell>
  );
}
