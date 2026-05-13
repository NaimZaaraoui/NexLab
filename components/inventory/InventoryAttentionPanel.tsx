'use client';

import Link from 'next/link';
import type { InventoryItemSummary } from '@/components/inventory/types';

interface InventoryAttentionPanelProps {
  items: InventoryItemSummary[];
  formatReason: (item: InventoryItemSummary) => string;
}

export function InventoryAttentionPanel({ items, formatReason }: InventoryAttentionPanelProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-[2rem] border border-amber-100/50 bg-amber-50/30 px-6 py-6 shadow-sm ring-1 ring-amber-900/5 transition-all">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Priorités du jour</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Vue rapide des articles qui demandent une action avant impact paillasse.</p>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/inventory/${item.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/60 bg-[var(--color-surface)] px-4 py-3 shadow-sm ring-1 ring-slate-900/5 transition-all hover:border-amber-100 hover:bg-amber-50/50 hover:shadow-md"
          >
            <span className="text-sm font-medium text-[var(--color-text)]">{item.name}</span>
            <span className="text-xs text-[var(--color-text-soft)]">{formatReason(item)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
