'use client';

import Link from 'next/link';
import type { InventoryAnalytics } from '@/components/inventory/types';
import type { InventoryCategoryConfig } from '@/lib/inventory-categories';

interface InventoryAnalyticsPanelProps {
  analytics: InventoryAnalytics;
  categories: InventoryCategoryConfig[];
}

export function InventoryAnalyticsPanel({ analytics, categories }: InventoryAnalyticsPanelProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <article className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Consommation des 30 derniers jours
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Vue consolidée de la consommation réelle et des pertes enregistrées.
            </p>
          </div>
          <span className="status-pill rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[var(--color-text-secondary)]">{analytics.windowDays} jours</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border bg-[var(--color-surface-muted)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Consommé</div>
            <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">{analytics.totals.consumption30d}</div>
          </div>
          <div className="rounded-md border bg-[var(--color-surface-muted)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Rebut</div>
            <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">{analytics.totals.waste30d}</div>
          </div>
          <div className="rounded-md border bg-[var(--color-surface-muted)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Moyenne / jour</div>
            <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">{analytics.totals.avgDailyConsumption30d}</div>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {analytics.topConsumedItems.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-6 text-sm text-[var(--color-text-soft)]">
              Pas encore assez de mouvements pour afficher une tendance.
            </div>
          ) : (
            analytics.topConsumedItems.map((entry) => (
              <Link
                key={entry.itemId}
                href={`/dashboard/inventory/${entry.itemId}`}
                className="flex items-center justify-between gap-3 rounded-md border bg-[var(--color-surface-muted)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">{entry.name}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                    {entry.category} · {entry.avgDailyConsumption30d} / jour
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[var(--color-text)]">{entry.consumption30d}</div>
                  <div className="text-[11px] text-[var(--color-text-soft)]">{entry.unit}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </article>

      <article className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Catégories configurables
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Organisation actuelle des articles inventaire.</p>
          </div>
          <span className="text-xs text-[var(--color-text-soft)]">{categories.filter((c) => c.isActive).length} active(s)</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.filter((category) => category.isActive).map((category) => (
            <span key={category.id} className="status-pill rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[var(--color-text-secondary)]">
              {category.name}
            </span>
          ))}
        </div>
        {analytics.topWastedItems.length > 0 && (
          <div className="mt-5 border-t border-[var(--color-border)] pt-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Articles les plus rebutés</div>
            <div className="mt-3 space-y-2">
              {analytics.topWastedItems.map((entry) => (
                <Link
                  key={entry.itemId}
                  href={`/dashboard/inventory/${entry.itemId}`}
                  className="flex items-center justify-between rounded-md border bg-[var(--color-surface-muted)] px-3 py-2 text-sm hover:bg-[var(--color-surface-muted)]"
                >
                  <span className="font-medium text-[var(--color-text)]">{entry.name}</span>
                  <span className="text-[var(--color-text-soft)]">
                    {entry.waste30d} {entry.unit}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
