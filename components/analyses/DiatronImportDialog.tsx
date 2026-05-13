// components/analyses/DiatronImportDialog.tsx
import React from 'react';
import { Microscope, AlertCircle, History, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { DiatronPreviewItem } from './types';

interface DiatronImportDialogProps {
  preview: DiatronPreviewItem[] | null;
  onCancel: () => void;
  onSelect: (index: number) => void;
}

export function DiatronImportDialog({ preview, onCancel, onSelect }: DiatronImportDialogProps) {
  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="flex flex-col max-h-[85vh] overflow-hidden border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[0_10px_26px_rgba(15,31,51,0.10)] sm:max-w-2xl">
        <DialogHeader className="border-b border-[var(--color-border)] p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              <Microscope size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[var(--color-text)]">Sélectionner un Résultat</DialogTitle>
              <p className="text-sm text-[var(--color-text-soft)]">Fichier importé : Diatron Abacus 380</p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto p-6">
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-[var(--color-text-secondary)]">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-sm font-medium">Plusieurs analyses ont été détectées dans ce fichier. Choisissez celle qui correspond à votre patient.</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {preview?.map((record) => (
              <button
                key={record.index}
                onClick={() => onSelect(record.index)}
                className="group flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-all hover:border-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] transition-colors group-hover:border-[var(--color-text-soft)]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">ID</span>
                    <span className="text-base font-bold text-slate-700">{record.sampleId || '?'}</span>
                  </div>

                  <div>
                    <div className="font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-text)]">
                      Analyse du {record.date}
                    </div>
                    <div className="text-sm text-[var(--color-text-soft)] flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs">
                        <History size={12} /> {record.time}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs">Index #{record.index + 1}</span>
                    </div>
                  </div>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-slate-300 transition-all group-hover:bg-[var(--color-surface)] group-hover:text-[var(--color-text)]">
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}
          </div>
        </div>
        <DialogFooter className="border-t border-[var(--color-border)] p-5">
          <button onClick={onCancel} className="btn-secondary">
            Annuler l&apos;importation
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
