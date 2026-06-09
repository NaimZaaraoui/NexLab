'use client';

import type { FinancialData } from '@/components/statistics/types';

interface Props { data: FinancialData; formatCurrency: (v: number) => string; }

const STATUS_LABELS: Record<string, string> = { PAID: 'Payé', PARTIAL: 'Partiel', UNPAID: 'Impayé' };
const METHOD_LABELS: Record<string, string> = { CASH: 'Espèces', CARD: 'Carte', TRANSFER: 'Virement', CHECK: 'Chèque' };

export function FinancialPrintSection({ data, formatCurrency }: Props) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Chiffre d'Affaires", value: formatCurrency(data.kpis.totalRevenue), color: 'text-emerald-700' },
          { label: 'Montant Encaissé', value: formatCurrency(data.kpis.totalPaid), sub: `Taux : ${data.kpis.recoveryRate}%`, color: 'text-indigo-700' },
          { label: 'Montant en Attente', value: formatCurrency(data.kpis.pendingAmount), color: 'text-amber-700' },
          { label: 'Part CNAM', value: formatCurrency(data.kpis.totalInsuranceShare), sub: `${data.kpis.cnamAnalysesCount} dossiers`, color: 'text-teal-700' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-4 bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color} print:text-black`}>{k.value}</p>
            {k.sub && <p className="text-xs text-slate-500 mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Statut des Paiements</p>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-3 bg-slate-50 border-b px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <div className="col-span-2">Statut</div><div className="text-right">Dossiers</div>
            </div>
            {data.paymentStatusBreakdown.map(s => (
              <div key={s.status} className="grid grid-cols-3 px-4 py-2.5 border-b text-sm">
                <div className="col-span-2 font-medium">{STATUS_LABELS[s.status] ?? s.status}</div>
                <div className="text-right font-bold">{s.count}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Modes de Paiement</p>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-3 bg-slate-50 border-b px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <div className="col-span-2">Mode</div><div className="text-right">Nombre</div>
            </div>
            {data.paymentMethodBreakdown.map(m => (
              <div key={m.method} className="grid grid-cols-3 px-4 py-2.5 border-b text-sm">
                <div className="col-span-2 font-medium">{METHOD_LABELS[m.method] ?? m.method}</div>
                <div className="text-right font-bold">{m.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.cnamByProvider.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Ventilation par Assureur</p>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-12 bg-teal-50 border-b px-4 py-2 text-[10px] font-black uppercase tracking-widest text-teal-700 print:bg-slate-50 print:text-black/60">
              <div className="col-span-3">Assureur</div><div className="col-span-2 text-center">Dossiers</div>
              <div className="col-span-3 text-right">Total CA</div>
              <div className="col-span-2 text-right">Part CNAM</div><div className="col-span-2 text-right">Part Patient</div>
            </div>
            {data.cnamByProvider.map((p, i) => (
              <div key={p.provider} className={`grid grid-cols-12 items-center px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-teal-50/30 print:bg-slate-50/40'}`}>
                <div className="col-span-3 font-medium">{p.provider}</div>
                <div className="col-span-2 text-center">{p.count}</div>
                <div className="col-span-3 text-right text-slate-500">{formatCurrency(p.totalPrice)}</div>
                <div className="col-span-2 text-right font-bold text-teal-600 print:text-black">{formatCurrency(p.insuranceShare)}</div>
                <div className="col-span-2 text-right text-slate-500">{formatCurrency(p.patientShare)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Tendance CA Mensuel</p>
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-12 bg-slate-50 border-b px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <div className="col-span-3">Mois</div><div className="col-span-3 text-right">CA</div>
            <div className="col-span-3 text-right">Encaissé</div><div className="col-span-3 text-right">Analyses</div>
          </div>
          {data.monthlyRevenue.filter(m => m.revenue > 0 || m.count > 0).map((m, i) => (
            <div key={m.month} className={`grid grid-cols-12 px-4 py-2.5 border-b text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
              <div className="col-span-3 font-medium capitalize">{m.label}</div>
              <div className="col-span-3 text-right font-bold text-emerald-700 print:text-black">{formatCurrency(m.revenue)}</div>
              <div className="col-span-3 text-right text-indigo-600 print:text-black">{formatCurrency(m.paid)}</div>
              <div className="col-span-3 text-right text-slate-500">{m.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
