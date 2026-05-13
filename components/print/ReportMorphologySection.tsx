import React from 'react';
import { HistogramView } from '../analyses/HistogramView';
import { getHematologyFlags } from '@/lib/calculations';
import type { Analysis } from '@/lib/types';
import type { HistogramSeries, ParsedHistogramPayload } from '@/components/print/types';

interface ReportMorphologySectionProps {
  analysis: Analysis;
  results: Record<string, string>;
  parsedHistograms: ParsedHistogramPayload | null;
  pltData: HistogramSeries | null;
}

export function ReportMorphologySection({
  analysis,
  results,
  parsedHistograms,
  pltData,
}: ReportMorphologySectionProps) {
  return (
    <tbody>
      <tr>
        <td>
          <div className="mb-8">
            <div className="py-1.75">
              <div className="flex items-center gap-3 px-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] print:text-black/60">
                  Morphologie & Histogrammes
                </span>
                <div className="h-px flex-1 bg-slate-200/50 print:bg-black/10"></div>
              </div>
            </div>

            {parsedHistograms && pltData ? (
              <div className="mt-8 grid grid-cols-3 gap-8">
                <div className="space-y-4">
                  <HistogramView
                    data={parsedHistograms.wbc}
                    title="Distribution leucocytaire (WBC)"
                    color="#000000"
                    width={220}
                    height={140}
                    xAxisMax={400}
                    variant="report"
                  />
                </div>
                <div className="space-y-4">
                  <HistogramView
                    data={parsedHistograms.rbc}
                    title="Distribution érythrocytaire (RBC)"
                    color="#000000"
                    width={220}
                    height={140}
                    xAxisMax={250}
                    variant="report"
                  />
                </div>
                <div className="space-y-4">
                  <HistogramView
                    data={pltData}
                    title="Distribution plaquettaire (PLT)"
                    color="#000000"
                    width={220}
                    height={140}
                    xAxisMax={60}
                    variant="report"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <MorphologyInterpretations analysis={analysis} results={results} />
        </td>
      </tr>
    </tbody>
  );
}

function MorphologyInterpretations({
  analysis,
  results,
}: {
  analysis: Analysis;
  results: Record<string, string>;
}) {
  try {
    const interpretations = getHematologyFlags(analysis, results);

    if (interpretations.length === 0) {
      return (
        <p className="my-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Conclusion Morphologique : Absence d&apos;anomalies majeures détectables
        </p>
      );
    }

    return (
      <div className="p-6">
        <h4 className="text-[11px] font-black text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 print:text-black">
          Interprétations Diagnostiques
        </h4>
        <div className="flex flex-wrap gap-2">
          {interpretations.map((flag) => (
            <span
              key={flag}
              className="px-3 py-1.5 bg-[var(--color-surface)] border border-indigo-100 rounded-lg text-[10px] font-medium text-indigo-700 print:border-black/80 print:text-black"
            >
              {flag}
            </span>
          ))}
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
