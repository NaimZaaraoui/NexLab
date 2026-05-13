'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tags, Minus, Plus, Printer } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (count: number) => void;
  defaultCount?: number;
}

export function LabelQuantityModal({ open, onOpenChange, onConfirm, defaultCount = 3 }: Props) {
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const count = draftCount ?? defaultCount;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDraftCount(null);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    onConfirm(count);
    setDraftCount(null);
    onOpenChange(false);
  };

  const increment = () => setDraftCount(Math.min(100, count + 1));
  const decrement = () => setDraftCount(Math.max(1, count - 1));
  const handleCountChange = (value: string) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      setDraftCount(1);
      return;
    }

    setDraftCount(Math.min(100, Math.max(1, Math.round(numericValue))));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-md flex-col p-0 overflow-hidden">
        <DialogHeader className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              <Tags size={18} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-[var(--color-text)] sm:text-2xl">
                Impression d&apos;étiquettes
              </DialogTitle>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Choisissez combien d&apos;étiquettes imprimer pour ce dossier.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div
          className="custom-scrollbar space-y-5 overflow-y-auto bg-[var(--color-surface)] p-6"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleConfirm();
            }
          }}
          tabIndex={0}
        >
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4">
            <p className="text-sm font-medium text-[var(--color-text)]">
              L&apos;impression générera autant d&apos;étiquettes que nécessaire pour l&apos;identification des tubes.
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
              Vous pouvez ajuster la quantité avant de lancer l&apos;impression.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="form-label">Quantité</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Entre 1 et 100 étiquettes</p>
              </div>
              <span className="rounded-full border bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-soft)]">
                {count} sélectionnée{count > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decrement}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                <Minus size={18} strokeWidth={2.5} />
              </button>

              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(event) => handleCountChange(event.target.value)}
                className="input-premium h-12 bg-[var(--color-surface)] text-center text-2xl font-semibold tabular-nums text-[var(--color-text)]"
              />

              <button
                type="button"
                onClick={increment}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 sm:flex-row sm:justify-end">
            <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="btn-secondary-md order-2 sm:order-1"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-primary-md order-1 min-w-[190px] justify-center sm:order-2"
          >
            <Printer size={18} />
            Imprimer {count > 1 ? 'étiquettes' : 'étiquette'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
