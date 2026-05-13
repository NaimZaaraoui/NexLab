'use client';

import type { InventoryDetailItem } from '@/components/inventory/types';

interface InventoryLotsPanelProps {
  item: InventoryDetailItem;
}

export function InventoryLotsPanel({ item }: InventoryLotsPanelProps) {
  const todayTimestamp = new Date().setHours(0, 0, 0, 0);

  return (
    <article className="bento-panel overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Lots en cours</h2>
        <span className="text-xs text-[var(--color-text-soft)]">{item.lots.length} lot(s)</span>
      </div>
      {item.lots.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">Aucun lot actif.</div>
      ) : (
        <div className="divide-y">
          {item.lots.map((lot) => {
            const daysLeft = Math.ceil((new Date(lot.expiryDate).getTime() - todayTimestamp) / 86400000);
            const lotClass = daysLeft <= 0 ? 'status-pill-error' : daysLeft <= 30 ? 'status-pill-warning' : 'status-pill-success';
            const lotLabel = daysLeft <= 0 ? 'Expiré' : daysLeft <= 30 ? 'Expire bientôt' : 'Conforme';

            return (
              <div key={lot.id} className="grid grid-cols-5 items-center gap-3 px-5 py-3 text-sm">
                <div className="font-medium text-[var(--color-text)]">{lot.lotNumber}</div>
                <div className="text-[var(--color-text-secondary)]">{lot.quantity} {item.unit}</div>
                <div className="text-[var(--color-text-secondary)]">{lot.remaining} {item.unit}</div>
                <div className="text-[var(--color-text-secondary)]">{new Date(lot.expiryDate).toLocaleDateString('fr-FR')}</div>
                <div className="flex justify-end">
                  <span className={`status-pill ${lotClass}`}>{lotLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
