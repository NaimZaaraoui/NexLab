'use client';

import { Edit3, Printer, Thermometer } from 'lucide-react';
import { ReadingSlot } from '@/components/temperature/ReadingSlot';
import type { Instrument, TemperaturePeriod } from '@/components/temperature/types';

interface InstrumentCardProps {
  instrument: Instrument;
  canManage: boolean;
  onOpenRecord: (instrument: Instrument, period: TemperaturePeriod) => void;
  onOpenHistory: (instrumentId: string) => void;
  onOpenEdit: (instrument: Instrument) => void;
  onPrint: (instrumentId: string) => void;
}

export function InstrumentCard({
  instrument,
  canManage,
  onOpenRecord,
  onOpenHistory,
  onOpenEdit,
  onPrint,
}: InstrumentCardProps) {
  const morningReading = instrument.todayReadings.find((reading) => reading.period === 'matin') || null;
  const eveningReading = instrument.todayReadings.find((reading) => reading.period === 'soir') || null;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)] transition-colors hover:bg-[var(--color-surface-muted)] ${
        instrument.isActive === false ? 'opacity-70 grayscale' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-[var(--color-text)]">{instrument.name}</h3>
            {instrument.todayStatus === 'alert' && <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              {instrument.type}
            </span>
            {instrument.isActive === false && (
              <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">
                Inactif
              </span>
            )}
            {instrument.location && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{instrument.location}</span>
            )}
          </div>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] ${
            instrument.todayStatus === 'alert'
              ? 'border-slate-300 bg-[var(--color-surface-muted)] text-slate-700'
              : instrument.todayStatus === 'missing' || instrument.todayStatus === 'empty'
                ? 'border-slate-300 bg-[var(--color-surface-muted)] text-slate-700'
                : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
          }`}
        >
          <Thermometer className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-soft)]">Plage de sécurité</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {instrument.targetMin}
              {instrument.unit}
            </span>
            <span className="h-px w-3 bg-slate-300" />
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {instrument.targetMax}
              {instrument.unit}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ReadingSlot
            label="Matin"
            reading={morningReading}
            unit={instrument.unit}
            onClick={() => !instrument.morningDone && instrument.isActive !== false && onOpenRecord(instrument, 'matin')}
          />
          <ReadingSlot
            label="Soir"
            reading={eveningReading}
            unit={instrument.unit}
            onClick={() => !instrument.eveningDone && instrument.isActive !== false && onOpenRecord(instrument, 'soir')}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-[var(--color-border)] pt-4 text-sm">
        <button
          className="btn-secondary flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          onClick={() => onOpenHistory(instrument.id)}
        >
          Voir l&apos;historique
        </button>
        {canManage && (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            onClick={() => onOpenEdit(instrument)}
            title="Modifier"
          >
            <Edit3 size={18} />
          </button>
        )}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          onClick={() => onPrint(instrument.id)}
          title="Imprimer rapport mensuel"
        >
          <Printer size={18} />
        </button>
      </div>
    </article>
  );
}
