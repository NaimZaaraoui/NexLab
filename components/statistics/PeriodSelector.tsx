'use client';

import { type StatRange, type PeriodConfig } from './types';
import { CalendarDays } from 'lucide-react';

const PRESETS: { id: StatRange; label: string }[] = [
  { id: '7d',    label: '7 jours' },
  { id: '30d',   label: '30 jours' },
  { id: 'month', label: 'Ce mois' },
  { id: 'ytd',   label: 'Cette année' },
  { id: 'all',   label: 'Tout' },
  { id: 'custom',label: 'Personnalisé' },
];

interface PeriodSelectorProps {
  value: PeriodConfig;
  onChange: (config: PeriodConfig) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => onChange({ range: p.id })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              value.range === p.id
                ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value.range === 'custom' && (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            type="date"
            value={value.from || ''}
            onChange={e => onChange({ ...value, from: e.target.value })}
            className="input-premium h-8 w-36 text-xs"
          />
          <span className="text-xs text-[var(--color-text-secondary)]">→</span>
          <input
            type="date"
            value={value.to || ''}
            onChange={e => onChange({ ...value, to: e.target.value })}
            className="input-premium h-8 w-36 text-xs"
          />
        </div>
      )}
    </div>
  );
}
