import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrinterCheck, Trash2, MailCheck } from 'lucide-react';
import type { Analysis } from '@/lib/types';
import { formatTatLabel, getTatMinutes, getTatTextClass } from '@/lib/tat';
import { getAnalysisStatusMeta } from '@/lib/analysis-status';
import { isAnalysisFinalValidated } from '@/lib/status-flow';

const PAYMENT_STATUS_MAP: Record<string, { label: string; classes: string }> = {
  UNPAID: { label: 'Non payé', classes: 'bg-rose-50 text-rose-700 border border-rose-200/70' },
  PARTIAL: { label: 'Partiel', classes: 'bg-amber-50 text-amber-700 border border-amber-200/70' },
  PAID: { label: 'Payé', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' },
};

interface Props {
  analysis: Analysis;
  currencyUnit: string;
  tatThresholds: { warnMinutes: number; alertMinutes: number };
  deletingId: string | null;
  sendingEmailId: string | null;
  onDeleteRequest: (event: React.MouseEvent, id: string) => void;
  onPrintRequest: (event: React.MouseEvent, id: string) => void;
  onEmailRequest: (event: React.MouseEvent, analysis: Analysis) => void;
}

export function AnalysisTableRow({ analysis, currencyUnit, tatThresholds, deletingId, sendingEmailId, onDeleteRequest, onPrintRequest, onEmailRequest }: Props) {
  const testsCount = typeof (analysis as Analysis & { testsCount?: number }).testsCount === 'number'
    ? (analysis as Analysis & { testsCount: number }).testsCount
    : (analysis.results || []).filter((result) => !result.test?.parentId).length;
  
  const status = getAnalysisStatusMeta(analysis.status);
  
  const payment = PAYMENT_STATUS_MAP[analysis.paymentStatus || 'UNPAID'] ?? PAYMENT_STATUS_MAP.UNPAID;
  const isReleased = isAnalysisFinalValidated(analysis.status);
  const patientName = `${analysis.patientLastName || 'ANONYME'} ${analysis.patientFirstName || ''}`.trim();
  const remaining = Math.max(0, (analysis.totalPrice || 0) - (analysis.amountPaid || 0));

  return (
    <Link
      href={`/analyses/${analysis.id}`}
      className={`grid grid-cols-1 gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-muted)] lg:grid-cols-12 lg:items-center ${
        analysis.isUrgent ? 'border-l-4 border-l-rose-500 pl-4' : ''
      }`}
    >
      <div className="hidden text-center text-xs font-medium text-[var(--color-text-soft)] lg:col-span-1 lg:block">
        #{analysis.dailyId || '?'}
      </div>

      <div className="lg:col-span-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
          <span className="truncate">{patientName}</span>
          {analysis.isUrgent && (
            <span className="rounded-full border border-rose-200/70 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
              Urgent
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-[var(--color-text-soft)]">
          {testsCount} analyse{testsCount > 1 ? 's' : ''}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${payment.classes}`}>
            {payment.label}
          </span>
          <span className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
            Reste: {remaining.toFixed(2)} {currencyUnit}
          </span>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="text-sm text-[var(--color-text-secondary)]">
          {format(new Date(analysis.creationDate), 'dd MMM yyyy', { locale: fr })}
        </div>
        <div className="text-xs text-[var(--color-text-soft)]">
          {format(new Date(analysis.creationDate), 'HH:mm')}
        </div>
      </div>

      <div className={`lg:col-span-1 lg:text-center text-xs ${getTatTextClass(getTatMinutes(analysis), tatThresholds)}`}>
        {isReleased ? 'Validé' : formatTatLabel(getTatMinutes(analysis))}
      </div>

      <div className="lg:col-span-1 lg:text-center truncate">
        <span className="inline-flex max-w-full rounded-md border bg-[var(--color-surface-muted)] px-1.5 py-1 font-mono text-[11px] text-[var(--color-text-secondary)] truncate">
          {analysis.orderNumber}
        </span>
      </div>

      <div className="flex items-center gap-2 lg:col-span-1 lg:justify-center">
        <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${status.classes}`}>
          {status.label}
        </span>
        {analysis.printedAt && (
          <div 
            title={`Imprimé le ${format(new Date(analysis.printedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}`}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-600 transition-transform hover:scale-110"
          >
            <PrinterCheck className="h-3.5 w-3.5" />
          </div>
        )}
        {analysis.emailedAt && (
          <div 
            title={`Envoyé le ${format(new Date(analysis.emailedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}`}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-600 transition-transform hover:scale-110"
          >
            <MailCheck className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-1 lg:col-span-2">
        <button
          onClick={(e) => onPrintRequest(e, analysis.id)}
          className="flex h-8 w-8 items-center justify-center rounded-md border text-[var(--color-text-soft)] transition-colors hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
          title="Imprimer le compte-rendu"
        >
          <PrinterCheck className="h-4 w-4" />
        </button>

        <button
          onClick={(e) => onEmailRequest(e, analysis)}
          disabled={sendingEmailId === analysis.id}
          className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
            sendingEmailId === analysis.id
              ? 'bg-blue-50 text-blue-400 border-blue-200 animate-pulse'
              : 'text-[var(--color-text-soft)] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
          }`}
          title="Envoyer par email"
        >
          <MailCheck className="h-4 w-4" />
        </button>

        {!isReleased && (
          <button
            onClick={(event) => onDeleteRequest(event, analysis.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
              deletingId === analysis.id
                ? 'text-slate-400'
                : 'text-[var(--color-text-soft)] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
            }`}
            title="Supprimer analyse"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </Link>
  );
}
