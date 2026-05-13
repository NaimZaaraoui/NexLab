'use client';

import { Edit2, FolderKanban, Trash2 } from 'lucide-react';
import type { BilanItem } from '@/components/bilans/types';

interface BilanCardProps {
  bilan: BilanItem;
  onEdit: (bilan: BilanItem) => void;
  onDelete: (bilan: BilanItem) => void;
}

export function BilanCard({ bilan, onEdit, onDelete }: BilanCardProps) {
  return (
    <div className="group flex flex-col gap-5 overflow-hidden rounded-2xl border bg-[var(--color-surface)] p-5 shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
            <FolderKanban size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--color-text)]">{bilan.name}</h3>
            {bilan.code && <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">{bilan.code}</span>}
          </div>
        </div>

        <div className="flex gap-1">
          <button onClick={() => onEdit(bilan)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-soft)] transition-all hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(bilan)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-soft)] transition-all hover:bg-[var(--color-surface-muted)] hover:text-rose-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">{bilan.tests.length} Analyses</p>
          <div className="mx-4 h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <div className="flex flex-wrap gap-2">
          {bilan.tests.slice(0, 6).map((test) => (
            <span key={test.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              {test.code}
            </span>
          ))}
          {bilan.tests.length > 6 && (
            <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">
              +{bilan.tests.length - 6}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
