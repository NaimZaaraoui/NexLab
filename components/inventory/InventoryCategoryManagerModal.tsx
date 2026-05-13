'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Plus, Trash2 } from 'lucide-react';
import type { InventoryCategoryConfig } from '@/lib/inventory-categories';

interface InventoryCategoryManagerModalProps {
  open: boolean;
  categoryDrafts: InventoryCategoryConfig[];
  newCategoryName: string;
  onClose: () => void;
  onCategoryDraftsChange: React.Dispatch<React.SetStateAction<InventoryCategoryConfig[]>>;
  onNewCategoryNameChange: (value: string) => void;
  onSave: () => void | Promise<void>;
}

export function InventoryCategoryManagerModal({
  open,
  categoryDrafts,
  newCategoryName,
  onClose,
  onCategoryDraftsChange,
  onNewCategoryNameChange,
  onSave,
}: InventoryCategoryManagerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">Catégories d’inventaire</DialogTitle>
          <p className="text-sm text-[var(--color-text-soft)]">Ajoutez, masquez ou réorganisez les familles d’articles.</p>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {categoryDrafts.map((category, index) => (
            <div
              key={category.id}
              className="grid gap-3 rounded-xl border bg-[var(--color-surface-muted)] px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"
            >
              <input
                className="input-premium h-11 bg-[var(--color-surface)]"
                value={category.name}
                onChange={(event) =>
                  onCategoryDraftsChange((prev) =>
                    prev.map((entry) => (entry.id === category.id ? { ...entry, name: event.target.value } : entry))
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  onCategoryDraftsChange((prev) =>
                    prev.map((entry) => (entry.id === category.id ? { ...entry, isActive: !entry.isActive } : entry))
                  )
                }
                className={`rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${
                  category.isActive
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)]'
                }`}
              >
                {category.isActive ? 'Active' : 'Masquée'}
              </button>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() =>
                    onCategoryDraftsChange((prev) => {
                      const next = [...prev];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      return next.map((entry, rank) => ({ ...entry, rank }));
                    })
                  }
                  className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Haut
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onCategoryDraftsChange((prev) =>
                      prev.filter((entry) => entry.id !== category.id).map((entry, rank) => ({ ...entry, rank }))
                    )
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="grid gap-3 rounded-xl border border-dashed px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
            <input
              className="input-premium h-11 bg-[var(--color-surface)]"
              value={newCategoryName}
              onChange={(event) => onNewCategoryNameChange(event.target.value)}
              placeholder="Nouvelle catégorie"
            />
            <button
              type="button"
              onClick={() => {
                const name = newCategoryName.trim();
                if (!name) return;
                onCategoryDraftsChange((prev) => [
                  ...prev,
                  {
                    id: `${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}`,
                    name,
                    rank: prev.length,
                    isActive: true,
                  },
                ]);
                onNewCategoryNameChange('');
              }}
              className="btn-secondary-md"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          <div className="text-xs text-[var(--color-text-soft)]">
            Ces catégories seront proposées dans la création et l’édition des articles.
          </div>
          <button className="btn-primary-md px-6" type="button" onClick={onSave}>
            Enregistrer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
