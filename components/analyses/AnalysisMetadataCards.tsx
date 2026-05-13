// components/analyses/AnalysisMetadataCards.tsx
import React from 'react';

import { useAnalysisContext } from './AnalysisContext';

interface AnalysisMetadataCardsProps {
  dailyId: string;
  patientAge: string;
  patientGender: string;
}

export function AnalysisMetadataCards({
  dailyId,
  patientAge,
  patientGender,
}: AnalysisMetadataCardsProps) {
  const { progressPct, abnormalCount } = useAnalysisContext();
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 border-t pt-6 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Paillasse</div>
        <div className="font-mono font-bold text-lg text-[var(--color-text)]">{dailyId}</div>
      </div>
      <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Âge / Sexe</div>
        <div className="font-bold text-lg text-[var(--color-text)]">
          {patientAge || '?'} ans • {patientGender}
        </div>
      </div>
      <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Progression</div>
        <div className="flex items-center gap-3">
          <span className={`font-bold text-lg ${progressPct === 100 ? 'text-emerald-600' : 'text-[var(--color-accent)]'}`}>
            {progressPct}%
          </span>
          <div className="w-20 h-1.5 bg-[var(--color-surface-muted)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Anomalies</div>
        <div className={`font-bold text-lg ${abnormalCount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
          {abnormalCount} Détectée{abnormalCount > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
