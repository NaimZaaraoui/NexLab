'use client';

import Link from 'next/link';
import { computeReorderSuggestion } from '@/lib/inventory-shared';
import type { InventoryItemSummary } from '@/components/inventory/types';

export type InventoryReorderItem = InventoryItemSummary & {
  reorder: ReturnType<typeof computeReorderSuggestion>;
};

interface InventoryReorderPanelProps {
  items: InventoryReorderItem[];
}

export function InventoryReorderPanel({ items }: InventoryReorderPanelProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
          Réapprovisionnement conseillé
        </h2>
        <p className="text-sm text-[var(--color-text-soft)]">
          Suggestions calculées à partir du seuil minimum, du stock courant et des expirations proches. Les usages récents sur 30 jours sont pris en compte pour mieux estimer la cible.
        </p>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/inventory/${item.id}`}
            className="rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface-muted)]/50 px-5 py-5 transition-all hover:bg-[var(--color-surface)] hover:shadow-md hover:ring-1 hover:ring-slate-900/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">{item.name}</div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                  {item.category} · {item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'}
                </div>
              </div>
              <span
                className={`status-pill ${
                  item.reorder.urgency === 'critical'
                    ? 'status-pill-error'
                    : item.reorder.urgency === 'warning'
                      ? 'status-pill-warning'
                      : 'status-pill-info'
                }`}
              >
                {item.reorder.urgency === 'critical' ? 'Urgent' : item.reorder.urgency === 'warning' ? 'À prévoir' : 'Suivi'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] px-3 py-2 shadow-sm ring-1 ring-slate-900/5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Stock</div>
                <div className="mt-1 text-sm font-semibold text-[var(--color-text)]">{item.currentStock}</div>
              </div>
              <div className="rounded-xl border bg-[var(--color-surface)] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Commander</div>
                <div className="mt-1 text-sm font-semibold text-[var(--color-accent)]">+{item.reorder.suggestedQuantity}</div>
              </div>
              <div className="rounded-xl border bg-[var(--color-surface)] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Cible</div>
                <div className="mt-1 text-sm font-semibold text-[var(--color-text)]">{item.reorder.targetStock}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-[var(--color-text-soft)]">
              {item.reorder.reason} · Usage moyen: {item.avgDailyConsumption30d || 0} / jour · Unité: {item.unit}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
