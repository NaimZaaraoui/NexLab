import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShieldCheck } from 'lucide-react';

import { useAnalysisContext } from './AnalysisContext';
import { getPaymentStatusDisplay } from './resultats-metrics';

export function AnalysisPaymentPanel() {
  const {
    analysis,
    paymentAmountInput,
    setPaymentAmountInput,
    paymentMethod,
    setPaymentMethod,
    handlePayAll,
    handleSavePayment,
    savingPayment,
    role,
    reportSettings,
  } = useAnalysisContext();

  if (!analysis) return null;

  const paymentTotal = analysis.totalPrice || 0;
  const paymentPaid = analysis.amountPaid || 0;
  const paymentRemaining = Math.max(0, paymentTotal - paymentPaid);
  const currencyUnit = reportSettings.amount_unit || 'DA';
  const paymentStatusDisplay = getPaymentStatusDisplay(analysis.paymentStatus);
  const paymentStatusLabel = paymentStatusDisplay.label;
  const paymentStatusClasses = paymentStatusDisplay.classes;

  const paidAt = analysis.paidAt;
  const insuranceProvider = analysis.insuranceProvider;
  const insuranceCoverage = analysis.insuranceCoverage;
  const insuranceShare = analysis.insuranceShare ?? 0;
  const patientShare = analysis.patientShare ?? undefined;
  const hasTierPayant = !!insuranceProvider && insuranceCoverage != null && insuranceCoverage > 0;
  const effectivePatientShare = patientShare ?? paymentTotal;
  const patientRemaining = Math.max(0, effectivePatientShare - paymentPaid);

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="section-label">Paiement</span>
            <span className={paymentStatusClasses}>{paymentStatusLabel}</span>
            {hasTierPayant && (
              <span className="status-pill flex items-center gap-1 bg-emerald-50 border-emerald-200 text-emerald-700">
                <ShieldCheck size={11} />
                {insuranceProvider} — {insuranceCoverage}%
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-2 text-xs">
            {hasTierPayant ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <span className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-medium text-[var(--color-text-secondary)] flex flex-col">
                  <span className="text-[10px] opacity-60 uppercase tracking-wide mb-0.5">Total analyse</span>
                  <span className="font-bold text-slate-700">{paymentTotal.toFixed(2)} {currencyUnit}</span>
                </span>
                <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-medium flex flex-col">
                  <span className="text-[10px] opacity-70 uppercase tracking-wide mb-0.5 text-emerald-700">Prise en charge ({insuranceProvider})</span>
                  <span className="font-bold text-emerald-700">{insuranceShare.toFixed(2)} {currencyUnit}</span>
                </span>
                <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 font-medium flex flex-col">
                  <span className="text-[10px] opacity-70 uppercase tracking-wide mb-0.5 text-indigo-700">Part patient (Ticket modérateur)</span>
                  <span className="font-bold text-indigo-700">{effectivePatientShare.toFixed(2)} {currencyUnit}</span>
                </span>
                <span className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-medium text-[var(--color-text-secondary)] flex flex-col">
                  <span className="text-[10px] opacity-60 uppercase tracking-wide mb-0.5">Payé / Reste</span>
                  <span className="font-bold text-slate-700">{paymentPaid.toFixed(2)} / <span className={patientRemaining > 0 ? 'text-rose-600' : 'text-emerald-600'}>{patientRemaining.toFixed(2)}</span> {currencyUnit}</span>
                </span>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                  Total: {paymentTotal.toFixed(2)} {currencyUnit}
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                  Payé: {paymentPaid.toFixed(2)} {currencyUnit}
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-[var(--color-text-secondary)]">
                  Reste: {paymentRemaining.toFixed(2)} {currencyUnit}
                </span>
              </div>
            )}

            {paidAt && (
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-[var(--color-text-secondary)] w-fit mt-1">
                Soldé le {format(new Date(paidAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </span>
            )}
          </div>
        </div>

        {role !== 'MEDECIN' && (
          <div className="grid gap-3 sm:grid-cols-[160px_160px_auto]">
            <input
              type="number"
              min="0"
              step="0.01"
              value={paymentAmountInput}
              onChange={(e) => setPaymentAmountInput(e.target.value)}
              className="input-premium h-11"
              placeholder={hasTierPayant ? `Part patient: ${effectivePatientShare.toFixed(2)}` : 'Montant payé'}
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-premium h-11"
            >
              <option value="cash">Espèces</option>
              <option value="card">Carte</option>
              <option value="transfer">Virement</option>
              <option value="check">Chèque</option>
              <option value="other">Autre</option>
            </select>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePayAll}
                disabled={savingPayment}
                className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasTierPayant ? 'Solder patient' : 'Tout payer maintenant'}
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                disabled={savingPayment}
                className="btn-primary-md"
              >
                {savingPayment ? '...' : 'Enregistrer paiement'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
