'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Check, Filter, Save, Search, FolderKanban } from 'lucide-react';
import type { BilanItem, BilanTest } from '@/components/bilans/types';

interface BilanEditorModalProps {
  mounted: boolean;
  open: boolean;
  editingBilan: BilanItem | null;
  formData: { name: string; code: string };
  selectedTests: string[];
  searchQuery: string;
  filteredTests: BilanTest[];
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (value: { name: string; code: string }) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleTest: (testId: string) => void;
}

export function BilanEditorModal({
  open,
  editingBilan,
  formData,
  selectedTests,
  searchQuery,
  filteredTests,
  onClose,
  onSubmit,
  onFormDataChange,
  onSearchQueryChange,
  onToggleTest,
}: BilanEditorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col p-0 overflow-hidden">
        <DialogHeader className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              <FolderKanban size={18} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-[var(--color-text)] sm:text-2xl">
                {editingBilan ? 'Modifier le Bilan' : 'Nouveau Bilan'}
              </DialogTitle>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Gerez vos raccourcis d&apos;analyses pour une saisie rapide.</p>
            </div>
          </div>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-[var(--color-surface)] p-6">
          <div className="grid grid-cols-1 gap-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 md:grid-cols-2">
            <div className="space-y-3">
              <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Nom du bilan</label>
              <input
                value={formData.name}
                onChange={(event) => onFormDataChange({ ...formData, name: event.target.value })}
                placeholder="Ex: Bilan Pre-operatoire"
                className="input-premium h-11 bg-[var(--color-surface)]"
              />
            </div>
            <div className="space-y-3">
              <label className="ml-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Code raccourci</label>
              <input
                value={formData.code}
                onChange={(event) => onFormDataChange({ ...formData, code: event.target.value })}
                placeholder="Ex: PREOP"
                className="input-premium h-11 bg-[var(--color-surface)] uppercase"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
                  <Filter size={16} />
                </div>
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text)]">
                  Analyses incluses ({selectedTests.length})
                </label>
              </div>

              <div className="group relative w-full md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)] transition-colors group-focus-within:text-[var(--color-text)]" />
                <input
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  placeholder="Chercher une analyse..."
                  className="input-premium h-11 bg-[var(--color-surface)] pl-12"
                />
              </div>
            </div>

            <div className="grid max-h-[300px] grid-cols-2 gap-3 overflow-y-auto scroll-smooth p-2 lg:grid-cols-3">
              {filteredTests.map((test) => {
                const isSelected = selectedTests.includes(test.id);
                return (
                  <button
                    key={test.id}
                    onClick={() => onToggleTest(test.id)}
                    className={`flex h-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-soft)]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <span className={`mb-1 block truncate text-sm font-semibold leading-none ${isSelected ? 'text-white' : 'text-[var(--color-text)]'}`}>{test.code}</span>
                      <span className={`block truncate text-[10px] font-medium italic opacity-70 ${isSelected ? 'text-slate-200' : 'text-[var(--color-text-soft)]'}`}>{test.name}</span>
                    </div>

                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all ${isSelected ? 'bg-white/15 text-white' : 'bg-[var(--color-surface-muted)] text-transparent'}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </button>
                );
              })}
              {filteredTests.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-slate-200">
                    <Search size={32} />
                  </div>
                  <p className="text-sm font-medium italic text-slate-400">Aucune analyse trouvee pour &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <button onClick={onClose} className="btn-secondary-md">
            Annuler
          </button>
          <button onClick={onSubmit} className="btn-primary-md min-w-[180px] justify-center">
            <Save size={16} />
            <span>Enregistrer</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
