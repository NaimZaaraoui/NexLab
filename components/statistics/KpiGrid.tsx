'use client';

import { type LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  variation?: number | null;
  subtitle?: string;
}

const colorMap = {
  indigo:  { bg: 'bg-indigo-50',  icon: 'text-indigo-600',  value: 'text-indigo-700' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   value: 'text-amber-700' },
  rose:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    value: 'text-rose-700' },
  sky:     { bg: 'bg-sky-50',     icon: 'text-sky-600',     value: 'text-sky-700' },
  violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  value: 'text-violet-700' },
};

function VariationBadge({ variation }: { variation: number }) {
  const isPositive = variation > 0;
  const isNeutral = variation === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const cls = isNeutral
    ? 'bg-slate-100 text-slate-500'
    : isPositive
    ? 'bg-emerald-50 text-emerald-600'
    : 'bg-rose-50 text-rose-600';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(variation).toFixed(1)}%
    </span>
  );
}

export function KpiCard({ title, value, icon: Icon, color, variation, subtitle }: KpiCardProps) {
  const c = colorMap[color];
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-5 shadow-sm ring-1 ring-slate-900/[0.04] transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
        {variation != null && <VariationBadge variation={variation} />}
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">{title}</p>
        <p className={`mt-1 text-2xl font-bold tracking-tight ${c.value}`}>{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{subtitle}</p>}
      </div>
    </article>
  );
}

interface KpiGridProps {
  children: React.ReactNode;
  cols?: 3 | 4 | 5 | 6;
}

export function KpiGrid({ children, cols = 4 }: KpiGridProps) {
  const colMap = { 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 xl:grid-cols-4', 5: 'md:grid-cols-3 xl:grid-cols-5', 6: 'md:grid-cols-3 xl:grid-cols-6' };
  return <div className={`grid gap-4 ${colMap[cols]}`}>{children}</div>;
}
