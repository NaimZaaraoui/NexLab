'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DatabaseHealthCardProps {
  title: string;
  value: string;
  meta: string;
  status: 'ok' | 'alert';
}

export function DatabaseHealthCard({ title, value, meta, status }: DatabaseHealthCardProps) {
  return (
    <article className="rounded-2xl border bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">{title}</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">{value}</p>
          <p className="mt-1 text-xs text-[var(--color-text-soft)]">{meta}</p>
        </div>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
            status === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {status === 'ok' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        </span>
      </div>
    </article>
  );
}
