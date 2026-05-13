'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Edit2, PlusCircle, Save } from 'lucide-react';
import { AVAILABLE_ICONS } from './ordering-helpers';
import type { Category } from './types';

interface Props {
  mounted: boolean;
  showCreateModal: boolean;
  showEditModal: boolean;
  editingCategory: Category | null;
  newCategoryName: string;
  newCategoryIcon: string;
  newCategoryParent: string;
  categories: Category[];
  onNameChange: (v: string) => void;
  onIconChange: (v: string) => void;
  onParentChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function CategoryFormModal({
  showCreateModal,
  showEditModal,
  editingCategory,
  newCategoryName,
  newCategoryIcon,
  newCategoryParent,
  categories,
  onNameChange,
  onIconChange,
  onParentChange,
  onClose,
  onSubmit,
  }: Props) {
  const isOpen = showCreateModal || showEditModal;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-md flex-col p-6 overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              {showEditModal ? <Edit2 size={20} /> : <PlusCircle size={20} />}
            </div>
            <DialogTitle className="text-xl font-semibold text-[var(--color-text)] tracking-tight">
              {showEditModal ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">
              Nom de la catégorie
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ex: Sérologie, Biochimie..."
              className="input-premium h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">
              Icône
            </label>
            <div className="grid grid-cols-4 gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
              {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  onClick={() => onIconChange(name)}
                  className={`p-3 rounded-xl transition-all ${
                    newCategoryIcon === name
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]'
                  }`}
                  title={name}
                >
                  <Icon size={20} className="mx-auto" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">
              Hiérarchie (Parent)
            </label>
            <select
              value={newCategoryParent}
              onChange={(e) => onParentChange(e.target.value)}
              className="input-premium h-11 bg-[var(--color-surface)] appearance-none cursor-pointer"
            >
              <option value="">📂 Catégorie principale (Racine)</option>
              {categories
                .filter((cat) => !showEditModal || cat.id !== editingCategory?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? '   ' : ''}• {cat.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="btn-secondary-md flex-1">
            Annuler
          </button>
          <button onClick={onSubmit} className="btn-primary-md flex-1 justify-center">
            {showEditModal ? <Save size={16} /> : <PlusCircle size={16} />}
            {showEditModal ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
