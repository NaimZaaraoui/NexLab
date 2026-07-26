// components/analyses/EditAnalysisDialog.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { CheckCircle, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { AvailableTestOption, EditAnalysisForm } from './types';

interface EditAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editForm: EditAnalysisForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditAnalysisForm>>;
  selectedTestIds: string[];
  toggleSelectedTest: (testId: string) => void;
  testSearch: string;
  setTestSearch: (val: string) => void;
  availableTests: AvailableTestOption[];
  provenanceOptions: string[];
  prescriberOptions: string[];
  saveAnalysisMeta: () => void;
  savingMeta: boolean;
}

export function EditAnalysisDialog({
  open,
  onOpenChange,
  editForm,
  setEditForm,
  selectedTestIds,
  toggleSelectedTest,
  testSearch,
  setTestSearch,
  availableTests,
  provenanceOptions,
  prescriberOptions,
  saveAnalysisMeta,
  savingMeta,
}: EditAnalysisDialogProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const updateEditForm = <K extends keyof EditAnalysisForm>(key: K, value: EditAnalysisForm[K]) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const normalizedSearch = testSearch.toLowerCase().trim();
  const selectedTests = useMemo(() => (
    availableTests.filter((test) => selectedTestIds.includes(test.id))
  ), [availableTests, selectedTestIds]);
  const filteredTests = useMemo(() => (
    availableTests.filter((test) => (
      !normalizedSearch ||
      test.code.toLowerCase().includes(normalizedSearch) ||
      test.name.toLowerCase().includes(normalizedSearch)
    ))
  ), [availableTests, normalizedSearch]);
  const categoryTabs = useMemo(() => {
    const categories = new Map<string, { name: string; rank: number; count: number; selectedCount: number }>();

    filteredTests.forEach((test) => {
      const name = test.categoryName || 'Autres';
      const current = categories.get(name) || {
        name,
        rank: test.categoryRank ?? 999,
        count: 0,
        selectedCount: 0,
      };

      current.count += 1;
      if (selectedTestIds.includes(test.id)) current.selectedCount += 1;
      categories.set(name, current);
    });

    return Array.from(categories.values()).sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.name.localeCompare(b.name);
    });
  }, [filteredTests, selectedTestIds]);
  const selectedCategory = activeCategory === 'all' || categoryTabs.some((category) => category.name === activeCategory)
    ? activeCategory
    : 'all';
  const visibleTests = selectedCategory === 'all'
    ? filteredTests
    : filteredTests.filter((test) => (test.categoryName || 'Autres') === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,31,51,0.10)] sm:max-w-2xl">
        <DialogHeader className="border-b border-[var(--color-border)] px-6 py-5">
          <DialogTitle>Modifier le dossier d&apos;analyse</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <input className="input-premium h-10 text-sm" placeholder="N° Paillasse" value={editForm.dailyId} onChange={(e) => updateEditForm('dailyId', e.target.value)} />
            <input className="input-premium h-10 text-sm" placeholder="Quittance" value={editForm.receiptNumber} onChange={(e) => updateEditForm('receiptNumber', e.target.value)} />
            <input list="edit-provenance-options" className="input-premium h-10 text-sm col-span-2" placeholder="Provenance" value={editForm.provenance} onChange={(e) => updateEditForm('provenance', e.target.value)} />
            <datalist id="edit-provenance-options">
              {provenanceOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <input list="edit-prescriber-options" className="input-premium h-10 text-sm col-span-2" placeholder="Médecin prescripteur" value={editForm.medecinPrescripteur} onChange={(e) => updateEditForm('medecinPrescripteur', e.target.value)} />
            <datalist id="edit-prescriber-options">
              {prescriberOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <div className="col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateEditForm('isUrgent', false)}
                className={`h-10 px-4 rounded-xl text-xs font-bold border ${!editForm.isUrgent ? 'bg-[var(--color-surface-muted)] border-slate-300 text-slate-700' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
              >
                Non urgent
              </button>
              <button
                type="button"
                onClick={() => updateEditForm('isUrgent', true)}
                className={`h-10 px-4 rounded-xl text-xs font-bold border ${editForm.isUrgent ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
              >
                Urgent
              </button>
            </div>
            <div className="col-span-2 pt-3 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.08em]">Tests sélectionnés</span>
                <span className="text-xs font-semibold text-[var(--color-accent)]">{selectedTestIds.length} test(s)</span>
              </div>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  placeholder="Rechercher un test (code ou nom)..."
                  className="input-premium h-10 w-full pl-10 text-sm"
                />
              </div>
              {selectedTests.length > 0 && (
                <div className="mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[var(--color-text)]">Demandés dans ce dossier</span>
                    <span className="rounded-md bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                      {selectedTests.length}
                    </span>
                  </div>
                  <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto pr-1">
                    {selectedTests.map((test) => (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => toggleSelectedTest(test.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        title="Retirer cet examen"
                      >
                        <span>{test.code}</span>
                        <X size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {categoryTabs.length > 1 && (
                <div className="mb-3 flex gap-2 overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    Tous ({filteredTests.length})
                  </button>
                  {categoryTabs.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => setActiveCategory(category.name)}
                      className={`shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                        selectedCategory === category.name
                          ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {category.name} ({category.selectedCount}/{category.count})
                    </button>
                  ))}
                </div>
              )}
              <div className="max-h-56 overflow-y-auto border border-[var(--color-border)] rounded-xl p-2 space-y-1">
                {visibleTests
                  .map((test) => {
                    const isSelected = selectedTestIds.includes(test.id);

                    return (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => toggleSelectedTest(test.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{test.code} - {test.name}</span>
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {isSelected && <CheckCircle size={10} className="text-white" />}
                      </span>
                    </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
          <button onClick={() => onOpenChange(false)} className="btn-secondary">Annuler</button>
          <button onClick={saveAnalysisMeta} disabled={savingMeta} className="btn-primary">
            {savingMeta ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
