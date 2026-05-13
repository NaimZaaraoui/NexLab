'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { InventoryDetailItem } from '@/components/inventory/types';

interface InventoryRulesPanelProps {
  item: InventoryDetailItem;
  isAdmin: boolean;
  onAdd: () => void;
  onDelete: (ruleId: string) => void;
}

export function InventoryRulesPanel({ item, isAdmin, onAdd, onDelete }: InventoryRulesPanelProps) {
  return (
    <article className="bento-panel overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
          Règles de consommation
        </h2>
        {isAdmin && (
          <button onClick={onAdd} className="btn-secondary-sm">
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>
      {item.rules.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">Aucun test lié pour l’instant.</div>
      ) : (
        <div className="divide-y">
          {item.rules.map((rule) => (
            <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div>
                <div className="text-sm font-medium text-[var(--color-text)]">{rule.test.name}</div>
                <div className="text-xs text-[var(--color-text-soft)]">{rule.test.code}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  {rule.quantityPerTest} {item.unit} / analyse
                </span>
                {isAdmin && (
                  <button
                    onClick={() => onDelete(rule.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
