'use client';

import Link from 'next/link';
import { CalendarClock, FlaskConical, Plus } from 'lucide-react';
import type { InventoryItemSummary } from '@/components/inventory/types';

interface InventoryItemsTableProps {
  items: InventoryItemSummary[];
  loading: boolean;
  isAdmin: boolean;
  onCreate: () => void;
}

export function InventoryItemsTable({ items, loading, isAdmin, onCreate }: InventoryItemsTableProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] shadow-sm ring-1 ring-slate-900/5">
      <div className="grid grid-cols-12 border-b bg-[var(--color-surface-muted)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">
        <div className="col-span-3">Réactif</div>
        <div className="col-span-2">Catégorie</div>
        <div className="col-span-2 text-center">Stock actuel</div>
        <div className="col-span-1 text-center">Seuil</div>
        <div className="col-span-2 text-center">Statut</div>
        <div className="col-span-2 text-right">Prochaine expiration</div>
      </div>

      {loading && (
        <div className="space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 w-full animate-pulse rounded-md bg-[var(--color-surface-muted)]" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state m-5">
          <div className="empty-state-icon">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div className="empty-state-title">Aucun réactif configuré</div>
          <div className="empty-state-text">Ajoutez le premier réactif pour suivre le stock.</div>
          {isAdmin && (
            <button onClick={onCreate} className="btn-primary-sm mt-4">
              <Plus className="h-4 w-4" />
              Ajouter un réactif
            </button>
          )}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="divide-y">
          {items.map((item) => {
            const ratio = item.minThreshold > 0 ? Math.min((item.currentStock / item.minThreshold) * 100, 100) : 0;
            const statusLabel =
              item.status === 'expired'
                ? 'Périmé'
                : item.status === 'critical'
                  ? 'Stock critique'
                  : item.status === 'low'
                    ? 'Stock faible'
                    : 'Conforme';
            const statusClass =
              item.status === 'expired'
                ? 'status-pill-error'
                : item.status === 'critical'
                  ? 'status-pill-error'
                  : item.status === 'low'
                    ? 'status-pill-warning'
                    : 'status-pill-success';

            return (
              <Link
                key={item.id}
                href={`/dashboard/inventory/${item.id}`}
                className="grid grid-cols-12 items-center px-5 py-3 text-sm transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                <div className="col-span-3">
                  <div className="font-semibold text-[var(--color-text)]">{item.name}</div>
                  <div className="text-xs text-[var(--color-text-soft)]">
                    {item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'}
                  </div>
                </div>
                <div className="col-span-2 text-xs text-[var(--color-text-secondary)]">{item.category}</div>
                <div className="col-span-2 text-center">
                  <div className="text-sm font-semibold text-[var(--color-text)]">
                    {item.currentStock} {item.unit}
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                    <div
                      className={`h-full ${
                        item.status === 'critical' || item.status === 'expired'
                            ? 'bg-slate-700'
                          : item.status === 'low'
                              ? 'bg-slate-500'
                              : 'bg-slate-300'
                      }`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-1 text-center text-xs text-[var(--color-text-secondary)]">{item.minThreshold}</div>
                <div className="col-span-2 flex justify-center">
                  <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
                </div>
                <div className="col-span-2 text-right text-xs text-[var(--color-text-secondary)]">
                  {item.nearestExpiry ? (
                    <span
                      className={`inline-flex items-center gap-1 ${
                        item.daysUntilExpiry !== null && item.daysUntilExpiry <= 0
                          ? 'font-semibold text-[var(--color-critical)]'
                          : item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30
                            ? 'font-semibold text-[var(--color-warning)]'
                            : 'text-[var(--color-text-soft)]'
                      }`}
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      {new Date(item.nearestExpiry).toLocaleDateString('fr-FR')}
                    </span>
                  ) : (
                    '—'
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
