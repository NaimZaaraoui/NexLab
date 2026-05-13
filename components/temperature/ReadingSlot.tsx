'use client';

import { AlertTriangle, Clock } from 'lucide-react';
import type { TemperatureReading } from '@/components/temperature/types';

interface ReadingSlotProps {
  label: string;
  reading: TemperatureReading | null;
  unit: string;
  onClick?: () => void;
}

export function ReadingSlot({ label, reading, unit, onClick }: ReadingSlotProps) {
  const isPending = !reading;

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer flex flex-col p-4 rounded-3xl border transition-all duration-200 ${
        isPending
          ? 'border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 hover:bg-indigo-50/30 hover:border-indigo-200'
          : reading.isOutOfRange
            ? 'border-rose-100 bg-rose-50/50 hover:bg-rose-50'
            : 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50'
      }`}
    >
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
        {label}
      </div>

      {isPending ? (
        <div className="flex flex-col">
          <span className="text-xl font-black text-slate-200 tracking-tighter">-</span>
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-1 group-hover:text-indigo-400 transition-colors">
            Enregistrer
          </span>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className={`text-xl font-black tracking-tighter ${reading.isOutOfRange ? 'text-rose-600' : 'text-emerald-600'}`}>
            {reading.value.toFixed(1)}
            <span className="ml-0.5 text-[10px] font-bold uppercase opacity-60">{unit}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={10} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400">
              {new Date(reading.recordedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {reading.isOutOfRange && (
            <div className="absolute top-3 right-3">
              <AlertTriangle className="h-3 w-3 text-rose-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
