// components/analyses/AnalysisChartsTab.tsx
import React from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { HistogramView } from './HistogramView';
import { getHematologyFlags } from '@/lib/calculations';
import type { Analysis } from '@/lib/types';

interface AnalysisChartsTabProps {
  analysis: Analysis;
  results: Record<string, string>;
}

export function AnalysisChartsTab({ analysis, results }: AnalysisChartsTabProps) {
  if (!analysis.histogramData) return null;

  try {
    const data = JSON.parse(analysis.histogramData);
    const pltData = {
      bins: data.rbc.bins.slice(0, 60),
      markers: data.rbc.markers.filter((m: number) => m < 60),
    };

    const interpretations = getHematologyFlags(analysis, results);

    return (
      <div className="flex flex-col gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HistogramView data={data.wbc} title="WBC (LEUCOCYTES)" color="#6366f1" width={350} height={200} xAxisMax={400} />
          <HistogramView data={data.rbc} title="RBC (ÉRYTHROCYTES)" color="#ef4444" width={350} height={200} xAxisMax={250} />
          <HistogramView data={pltData} title="PLT (PLAQUETTES)" color="#10b981" width={350} height={200} xAxisMax={60} />
        </div>

        {interpretations.length === 0 ? (
          <div className="p-5 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center gap-2">
            <Sparkles className="text-indigo-500" size={16} />
            <p className="text-sm font-semibold text-[var(--color-text-soft)]">Aucune anomalie morphologique majeure détectée</p>
          </div>
        ) : (
          <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
            <h4 className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity size={12} /> Interprétations Diagnostiques
            </h4>
            <div className="flex flex-wrap gap-2">
              {interpretations.map((flag: string) => (
                <span key={flag} className="status-pill bg-[var(--color-surface)] border border-indigo-200 text-indigo-700 shadow-sm">
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch {
    return <div className="p-8 text-center text-slate-400">Erreur lors de l&apos;affichage des graphiques.</div>;
  }
}
