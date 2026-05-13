'use client';

import { Calendar, Download } from 'lucide-react';
import { PageBackLink } from '@/components/ui/PageBackLink';

interface TemperatureHistoryHeaderProps {
  instrumentName?: string;
  month: string;
  csvHref: string;
  onMonthChange: (value: string) => void;
  onRefresh: () => void;
  onPrint: () => void;
}

export function TemperatureHistoryHeader({
  instrumentName,
  month,
  csvHref,
  onMonthChange,
  onRefresh,
  onPrint,
}: TemperatureHistoryHeaderProps) {
  return (
    <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <PageBackLink href="/dashboard/temperature" />
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Historique des températures</h1>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">{instrumentName || 'Instrument'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="input-premium flex h-11 items-center gap-2 rounded-md px-3">
            <Calendar className="h-4 w-4 text-[var(--color-text-soft)]" />
            <input
              type="month"
              value={month}
              onChange={(event) => onMonthChange(event.target.value)}
              className="border-none bg-transparent text-sm outline-none"
            />
          </div>
          <button onClick={onRefresh} className="btn-secondary-sm">
            Actualiser
          </button>
          <button onClick={onPrint} className="btn-secondary-sm">
            Imprimer
          </button>
          <a href={csvHref} className="btn-secondary-sm">
            <Download size={16} />
            Export mensuel
          </a>
        </div>
      </div>
    </section>
  );
}
