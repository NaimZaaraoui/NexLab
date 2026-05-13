'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Search, CheckSquare, Square } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { TestOption } from '@/components/qc/config-types';

interface QcTestSelectorModalProps {
  open: boolean;
  onClose: () => void;
  tests: TestOption[];
  onSelect: (selectedTests: TestOption[]) => void;
}

export function QcTestSelectorModal({ open, onClose, tests, onSelect }: QcTestSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredTests = useMemo(() => {
    const q = search.toLowerCase();
    return tests.filter(t => 
      t.code.toLowerCase().includes(q) || 
      t.name.toLowerCase().includes(q)
    );
  }, [tests, search]);

  const toggleTest = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredTests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTests.map(t => t.id)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0 overflow-hidden">
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-5">
          <DialogHeader className="p-0 border-none">
            <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">Importer des paramètres</DialogTitle>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Sélectionnez les tests à ajouter au lot actuel.</p>
          </DialogHeader>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-soft)]" />
            <input
              autoFocus
              className="input-premium h-11 border-[var(--color-border)] bg-[var(--color-surface-muted)] pl-10"
              placeholder="Rechercher par nom ou code (ex: Glucose, NFS...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-text-soft)] px-2">
            <span>Tests disponibles ({filteredTests.length})</span>
            <button type="button" onClick={toggleAll} className="text-[var(--color-accent)] hover:underline">
              {selectedIds.size === filteredTests.length ? 'Désélectionner tout' : 'Tout sélectionner'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {filteredTests.map(test => (
              <button
                key={test.id}
                type="button"
                className={`flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-surface-muted)]`}
                onClick={() => toggleTest(test.id)}
              >
                {selectedIds.has(test.id) ? (
                  <CheckSquare className="h-5 w-5 text-[var(--color-accent)]" />
                ) : (
                  <Square className="h-5 w-5 text-slate-300" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--color-text)]">{test.code}</span>
                    <span className="text-[var(--color-text-soft)] truncate">— {test.name}</span>
                  </div>
                  {test.unit && (
                    <div 
                      className="mt-1 text-xs text-[var(--color-text-soft)] opacity-80"
                      dangerouslySetInnerHTML={{ __html: test.unit }}
                    />
                  )}
                </div>
              </button>
            ))}
            {filteredTests.length === 0 && (
              <div className="p-12 text-center text-sm text-[var(--color-text-soft)]">
                Aucun test trouvé pour votre recherche.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4 bg-[var(--color-surface-muted)]">
          <div className="text-sm font-medium text-[var(--color-text)]">
            {selectedIds.size} test{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary-sm" onClick={onClose}>
              Annuler
            </button>
            <button
              type="button"
              className="btn-primary-sm"
              disabled={selectedIds.size === 0}
              onClick={() => {
                const selected = tests.filter(t => selectedIds.has(t.id));
                onSelect(selected);
                onClose();
              }}
            >
              Importer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
