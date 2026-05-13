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

export function InventoryConsumeModal({
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
    <InventoryModalShell open={true} title="Enregistrer une consommation" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex min-h-full flex-col">
        <div className="grid flex-1 gap-4">
          <label className="grid gap-1">
            <span className="form-label">Quantité consommée</span>
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
            <span className="form-label">Motif</span>
            <textarea
              className="input-premium min-h-[100px] bg-[var(--color-surface)] p-3"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Analyse patient, contrôle QC..."
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
          <button className="btn-primary-md px-5" type="submit">Enregistrer</button>
        </div>
      </form>
    </InventoryModalShell>
  );
}
