'use client';

import { Beaker, Plus, Settings2, Trash2 } from 'lucide-react';
import type { InventoryDetailItem } from '@/components/inventory/types';

interface InventorySidebarProps {
  item: InventoryDetailItem;
  statusClass: string;
  statusLabel: string;
  ratio: number;
  canWrite: boolean;
  isAdmin: boolean;
  onReceive: () => void;
  onConsume: () => void;
  onWaste: () => void;
  onAdjust: () => void;
}

export function InventorySidebar({
  item,
  statusClass,
  statusLabel,
  ratio,
  canWrite,
  isAdmin,
  onReceive,
  onConsume,
  onWaste,
  onAdjust,
}: InventorySidebarProps) {
  return (
    <aside className="space-y-4">
      <article className="bento-panel p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Stock actuel</h2>
        <div className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-text)]">
          {item.currentStock}
          <span className="ml-2 text-base font-medium text-[var(--color-text-soft)]">{item.unit}</span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
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
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-soft)]">Seuil</span>
          <span className="text-sm font-medium text-[var(--color-text)]">{item.minThreshold} {item.unit}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-soft)]">Prochaine expiration</span>
          <span className="text-sm font-medium text-[var(--color-text)]">
            {item.nearestExpiry ? new Date(item.nearestExpiry).toLocaleDateString('fr-FR') : '—'}
          </span>
        </div>
        <div className="mt-4">
          <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
        </div>
      </article>

      <article className="bento-panel p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Actions</h2>
        <div className="mt-4 grid gap-2">
          {canWrite && (
            <button onClick={onReceive} className="btn-secondary-md justify-start px-4">
              <Plus className="h-4 w-4" />
              Réceptionner un lot
            </button>
          )}
          {canWrite && (
            <button onClick={onConsume} className="btn-secondary-md justify-start px-4">
              <Beaker className="h-4 w-4" />
              Enregistrer consommation
            </button>
          )}
          {canWrite && (
            <button onClick={onWaste} className="btn-secondary-md justify-start px-4">
              <Trash2 className="h-4 w-4" />
              Mise au rebut
            </button>
          )}
          {isAdmin && (
            <button onClick={onAdjust} className="btn-secondary-md justify-start px-4">
              <Settings2 className="h-4 w-4" />
              Ajustement manuel
            </button>
          )}
        </div>
      </article>

      <article className="bento-panel p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Raccourci règle</h2>
        <p className="mt-3 text-sm text-[var(--color-text-soft)]">
          Les règles configurées ici seront déduites automatiquement lors de la validation technique des analyses.
        </p>
      </article>
    </aside>
  );
}
