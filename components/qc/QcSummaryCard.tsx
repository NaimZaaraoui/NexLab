'use client';

import { ShieldCheck } from 'lucide-react';

interface QcSummaryCardProps {
  label: string;
  value: string;
  icon: typeof ShieldCheck;
  tone: 'success' | 'warning' | 'critical';
}

export function QcSummaryCard({ label, value, icon: Icon, tone }: QcSummaryCardProps) {
  const classes =
    tone === 'critical'
      ? 'bg-rose-50 text-rose-700'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-emerald-50 text-emerald-700';

  return (
    <div className="rounded-3xl border bg-[var(--color-surface)] p-5 shadow-[0_8px_26px_rgba(15,31,51,0.05)]">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${classes}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{value}</div>
    </div>
  );
}
