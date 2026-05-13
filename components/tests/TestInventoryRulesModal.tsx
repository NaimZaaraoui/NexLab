'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Package, Pencil, Save, Trash2 } from 'lucide-react';
import type { Test } from '@/lib/types';
import type { InventoryFormState, InventoryItemOption, InventoryRule } from '@/components/tests/types';

interface TestInventoryRulesModalProps {
  open: boolean;
  loading: boolean;
  test: Test | null;
  items: InventoryItemOption[];
  rules: InventoryRule[];
  form: InventoryFormState;
  editingRuleId: string | null;
  onClose: () => void;
  onFormChange: (next: InventoryFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onEditRule: (rule: InventoryRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onCancelEdit: () => void;
}

export function TestInventoryRulesModal({
  open,
  loading,
  test,
  items,
  rules,
  form,
  editingRuleId,
  onClose,
  onFormChange,
  onSubmit,
  onEditRule,
  onDeleteRule,
  onCancelEdit,
}: TestInventoryRulesModalProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col p-0 overflow-hidden">
        <DialogHeader className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              <Package size={22} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-[var(--color-text)] tracking-tight">
                Consommation liée au test
              </DialogTitle>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {test ? `${test.code} · ${test.name}` : 'Chargement...'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-[var(--color-surface)] p-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                {editingRuleId ? 'Modifier la règle sélectionnée' : 'Ajouter ou mettre à jour une règle'}
              </h4>
              <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                Cette quantité sera déduite automatiquement lors de la validation technique.
              </p>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_auto] md:items-end">
              <label className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Article inventaire</span>
                <select
                  value={form.itemId}
                  onChange={(event) => onFormChange({ ...form, itemId: event.target.value })}
                  className="input-premium h-11 bg-[var(--color-surface)]"
                  disabled={Boolean(editingRuleId)}
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'} · {item.currentStock} {item.unit}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantité par analyse</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.quantityPerTest}
                  onChange={(event) => onFormChange({ ...form, quantityPerTest: event.target.value })}
                  className="input-premium h-11 bg-[var(--color-surface)]"
                  placeholder="0.5"
                  required
                />
              </label>

              <button type="submit" className="btn-primary-md min-w-[140px] justify-center">
                <Save size={16} />
                {editingRuleId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </form>
            {editingRuleId && (
              <div className="mt-3 flex justify-end">
                <button onClick={onCancelEdit} type="button" className="btn-secondary-sm">
                  Annuler l’édition
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                Règles actives
              </h4>
              <span className="text-xs text-[var(--color-text-soft)]">{rules.length} règle(s)</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl border bg-[var(--color-surface-muted)]" />
                ))}
              </div>
            ) : rules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-10 text-center">
                <div className="text-sm font-medium text-[var(--color-text)]">Aucune consommation configurée</div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                  Liez ici les réactifs ou consommables utilisés par ce test.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="rounded-xl border bg-[var(--color-surface)] px-4 py-4 shadow-[0_4px_12px_rgba(15,31,51,0.04)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-text)]">{rule.item.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-soft)]">
                          <span className="status-pill status-pill-info">
                            {rule.item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'}
                          </span>
                          <span>{rule.item.category}</span>
                          <span>Stock: {rule.item.currentStock} {rule.item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[var(--color-accent)]">
                          {rule.quantityPerTest} {rule.item.unit} / analyse
                        </span>
                        <button onClick={() => onEditRule(rule)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]" title="Modifier">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => onDeleteRule(rule.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-rose-700 transition-colors hover:bg-[var(--color-surface)]" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
