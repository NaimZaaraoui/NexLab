import { InventoryModalShell } from '@/components/inventory/InventoryModalShell';
import type { InventoryDetailItem } from '@/components/inventory/types';

interface Props {
  item: InventoryDetailItem;
  newStock: string;
  reason: string;
  onNewStockChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function InventoryAdjustModal({
  item,
  newStock,
  reason,
  onNewStockChange,
  onReasonChange,
  onClose,
  onSubmit,
}: Props) {
  const diff = Number(newStock || 0) - item.currentStock;

  return (
    <InventoryModalShell open={true} title="Ajustement manuel" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex min-h-full flex-col">
        <div className="grid flex-1 gap-4">
          <label className="grid gap-1">
            <span className="form-label">Nouveau stock total</span>
            <input
              type="number"
              step="0.01"
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={newStock}
              onChange={(e) => onNewStockChange(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="form-label">Motif</span>
            <textarea
              className="input-premium min-h-[100px] bg-[var(--color-surface)] p-3"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              required
            />
          </label>
          <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            Variation: {diff > 0 ? '+' : ''}{diff} {item.unit}
          </div>
        </div>
        <div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4">
          <button className="btn-primary-md px-5" type="submit">Valider</button>
        </div>
      </form>
    </InventoryModalShell>
  );
}
