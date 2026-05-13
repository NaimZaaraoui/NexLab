'use client';

import { Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { isAnalysisValidated } from '@/lib/status-flow';
import type { PatientAnalysis } from '@/components/patients/types';
import type { AnalysisStatus } from '@/lib/status-flow';

interface PatientHistoryTabProps {
  analyses: PatientAnalysis[];
}

export function PatientHistoryTab({ analyses }: PatientHistoryTabProps) {
  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <Link
          href={`/analyses/${analysis.id}`}
          key={analysis.id}
          className="group flex items-center justify-between rounded-xl border bg-[var(--color-surface)] p-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)] transition-all hover:bg-[var(--color-surface-muted)]"
        >
          <div className="flex items-center gap-8">
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] transition-colors group-hover:border-indigo-100 group-hover:bg-indigo-50">
              <span className="mb-1 text-[10px] font-semibold uppercase leading-none text-slate-400 group-hover:text-indigo-400">
                {new Date(analysis.creationDate).toLocaleString('fr-FR', { month: 'short' })}
              </span>
              <span className="text-lg font-semibold leading-none text-[var(--color-text)] group-hover:text-indigo-600">
                {new Date(analysis.creationDate).getDate()}
              </span>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-4">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">{analysis.orderNumber}</h3>
                <span
                  className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    isAnalysisValidated(analysis.status as AnalysisStatus)
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-100/50 text-amber-600'
                  }`}
                >
                  {isAnalysisValidated(analysis.status as AnalysisStatus) ? 'Dossier Validé' : 'En cours'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity size={12} /> {analysis.results.length} Paramètres
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-200" />
                <span>Créé à {format(new Date(analysis.creationDate), 'HH:mm')}</span>
              </div>
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-surface-muted)] text-slate-300 transition-all group-hover:bg-indigo-600 group-hover:text-white">
            <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}

      {analyses.length === 0 && (
        <div className="empty-state py-20">
          <div className="empty-state-icon h-16 w-16 rounded-full bg-[var(--color-surface-muted)]">
            <Activity size={32} />
          </div>
          <p className="empty-state-title">Aucune analyse enregistrée</p>
        </div>
      )}
    </div>
  );
}
