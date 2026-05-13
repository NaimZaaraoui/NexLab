import React from 'react';
import Link from 'next/link';
import { Activity, CalendarDays, Plus, Search } from 'lucide-react';
import { DATE_OPTIONS, DateFilter, STATUS_OPTIONS, StatusFilter } from './useAnalysesList';

interface Props {
  role: string;
  searchValue: string;
  setSearchValue: (val: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (val: DateFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (val: StatusFilter) => void;
  customDate: string;
  setCustomDate: (val: string) => void;
}

export function AnalysesFiltersBar({
  role,
  searchValue,
  setSearchValue,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
  customDate,
  setCustomDate,
}: Props) {
  return (
    <section className="rounded-xl border bg-[var(--color-surface)] p-3 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(280px,1.4fr)_210px_210px_auto]">
        <div className="flex h-11 items-center gap-2 rounded-md border bg-[var(--color-surface)] px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Rechercher patient, ID ou n° commande..."
            aria-label="Rechercher une analyse"
            autoFocus
            className="h-full w-full border-0 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
          />
        </div>

        <div className="flex h-11 items-center gap-2 rounded-md border bg-[var(--color-surface)] px-3">
          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value as DateFilter)}
            aria-label="Filtrer par date"
            className="h-full w-full appearance-none border-0 bg-transparent pr-2 text-sm text-[var(--color-text)] outline-none"
          >
            {DATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex h-11 items-center gap-2 rounded-md border bg-[var(--color-surface)] px-3">
          <Activity className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            aria-label="Filtrer par statut"
            className="h-full w-full appearance-none border-0 bg-transparent pr-2 text-sm text-[var(--color-text)] outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {role !== 'MEDECIN' && (
          <Link href="/analyses/nouvelle" className="btn-primary-md px-4" title="">
            <Plus className="h-4 w-4" />
            Nouvelle analyse
          </Link>
        )}
      </div>

      {dateFilter === 'custom' && (
        <div className="mt-3 max-w-[260px]">
          <input
            type="date"
            value={customDate}
            onChange={(event) => setCustomDate(event.target.value)}
            className="input-premium h-10 rounded-md"
          />
        </div>
      )}
    </section>
  );
}
