'use client';

import { ShieldCheck } from 'lucide-react';
import type { HeaderQcSummary } from '@/components/layout/types';

interface QcStatusChipProps {
  qcSummary: HeaderQcSummary | null;
  onClick: () => void;
}

export function QcStatusChip({ qcSummary, onClick }: QcStatusChipProps) {
  return (
    <button
      onClick={onClick}
      title={
        !qcSummary
          ? 'Chargement du contrôle qualité'
          : qcSummary.allPass && qcSummary.missing === 0
            ? 'Tous les contrôles sont conformes'
            : qcSummary.fail > 0
              ? `${qcSummary.fail} contrôle(s) en échec`
              : qcSummary.missing > 0
                ? `${qcSummary.missing} contrôle(s) non effectué(s) aujourd'hui`
                : `${qcSummary.warn} contrôle(s) en avertissement`
      }
      className={`hidden rounded-lg border px-3 py-2 text-sm font-semibold transition-colors md:inline-flex md:items-center md:gap-2 ${
        !qcSummary || (qcSummary.allPass && qcSummary.missing === 0)
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : qcSummary.fail > 0
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      <ShieldCheck className="h-4 w-4" />
      <span>
        {!qcSummary
          ? 'QC...'
          : qcSummary.fail > 0
            ? `QC ${qcSummary.fail} échec(s)`
            : qcSummary.missing > 0
              ? `QC ${qcSummary.missing} manquant(s)`
              : qcSummary.warn > 0
                ? `QC ${qcSummary.warn} avert.`
                : 'QC conforme'}
      </span>
    </button>
  );
}
