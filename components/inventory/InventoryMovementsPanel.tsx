'use client';

import { ArrowDownCircle, ArrowUpCircle, Settings2, Trash2 } from 'lucide-react';
import type { InventoryDetailItem } from '@/components/inventory/types';

interface InventoryMovementsPanelProps {
  item: InventoryDetailItem;
}

export function InventoryMovementsPanel({ item }: InventoryMovementsPanelProps) {
  return (
    <article className="bento-panel overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
          Historique des mouvements
        </h2>
        <span className="text-xs text-[var(--color-text-soft)]">50 derniers mouvements</span>
      </div>
      {item.movements.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">Aucun mouvement enregistré.</div>
      ) : (
        <div className="divide-y">
          {item.movements.map((movement) => (
            <div key={movement.id} className="grid grid-cols-[1.1fr_0.9fr_0.8fr_1fr_1fr] gap-3 px-5 py-3 text-sm">
              <div className="text-[var(--color-text-secondary)]">{new Date(movement.performedAt).toLocaleString('fr-FR')}</div>
              <div className="flex items-center gap-2 font-medium text-[var(--color-text)]">
                {movement.type === 'reception' ? (
                  <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                ) : movement.type === 'consumption' ? (
                  <ArrowDownCircle className="h-4 w-4 text-rose-600" />
                ) : movement.type === 'waste' ? (
                  <Trash2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
                ) : (
                  <Settings2 className="h-4 w-4 text-sky-600" />
                )}
                <span className="capitalize">{movement.type}</span>
              </div>
              <div className={`font-semibold ${movement.quantity < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {movement.quantity > 0 ? '+' : ''}{movement.quantity} {item.unit}
              </div>
              <div className="text-[var(--color-text-soft)]">{movement.lotNumber || '—'}</div>
              <div className="text-[var(--color-text-soft)]">{movement.performedBy}</div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
