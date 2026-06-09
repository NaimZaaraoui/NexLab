'use client';

import { useEffect, useState } from 'react';
import { Banknote, Wallet, ShieldCheck, Clock, Users } from 'lucide-react';
import { KpiCard, KpiGrid } from './KpiGrid';
import { DonutChart } from './charts/DonutChart';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart, Bar,
} from 'recharts';
import type { FinancialData, PeriodConfig } from './types';

interface FinancialTabProps {
  period: PeriodConfig;
  currency: string;
  formatCurrency: (v: number) => string;
}

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={`rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-5 shadow-sm ${className}`}>
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">{title}</h2>
      {children}
    </article>
  );
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PAID:    { label: 'Payé',      color: '#10B981' },
  PARTIAL: { label: 'Partiel',   color: '#F59E0B' },
  UNPAID:  { label: 'Impayé',    color: '#EF4444' },
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces', CARD: 'Carte', TRANSFER: 'Virement', CHECK: 'Chèque',
};

export function FinancialTab({ period, currency, formatCurrency }: FinancialTabProps) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range: period.range });
    if (period.from) params.set('from', period.from);
    if (period.to) params.set('to', period.to);
    fetch(`/api/statistics/financial?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-soft)]">Chargement…</div>;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <KpiGrid cols={4}>
        <KpiCard title="Chiffre d'Affaires"  value={formatCurrency(data.kpis.totalRevenue)}    icon={Banknote}    color="emerald" />
        <KpiCard title="Montant Encaissé"    value={formatCurrency(data.kpis.totalPaid)}        icon={Wallet}      color="indigo"
          subtitle={`Taux : ${data.kpis.recoveryRate}%`} />
        <KpiCard title="En Attente"          value={formatCurrency(data.kpis.pendingAmount)}    icon={Clock}       color="amber" />
        <KpiCard title="Part CNAM"           value={formatCurrency(data.kpis.totalInsuranceShare)} icon={ShieldCheck} color="sky"
          subtitle={`${data.kpis.cnamAnalysesCount} dossiers assurés`} />
      </KpiGrid>

      {/* Monthly revenue trend */}
      <Panel title="Tendance CA Mensuel (12 derniers mois)" className="">
        <div className="h-72">
          {data.monthlyRevenue.length === 0
            ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-soft)]">Aucune donnée.</div>
            : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: 12 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={((v: number, name: string) => [
                      name === 'count' ? `${v} analyses` : formatCurrency(v),
                      name === 'revenue' ? 'CA' : name === 'paid' ? 'Encaissé' : 'Analyses',
                    ]) as any}
                  />
                  <Bar dataKey="revenue" name="revenue" fill="#E0E7FF" radius={[4, 4, 0, 0]} barSize={18} />
                  <Line type="monotone" dataKey="paid" name="paid" stroke="#10B981" strokeWidth={2.5} dot={false}
                    activeDot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Statut des Paiements">
          <div className="h-56">
            {data.paymentStatusBreakdown.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-soft)]">Aucune donnée.</div>
              : <DonutChart
                  data={data.paymentStatusBreakdown.map(s => ({
                    name: STATUS_LABELS[s.status]?.label ?? s.status,
                    value: s.count,
                  }))}
                />}
          </div>
        </Panel>

        <Panel title="Modes de Paiement">
          <div className="h-56">
            {data.paymentMethodBreakdown.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-soft)]">Aucune donnée.</div>
              : <DonutChart
                  data={data.paymentMethodBreakdown.map(m => ({
                    name: METHOD_LABELS[m.method] ?? m.method,
                    value: m.count,
                  }))}
                />}
          </div>
        </Panel>

        <Panel title="CNAM · Part Assurance vs Patient">
          <div className="h-56">
            {data.kpis.cnamAnalysesCount === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-soft)]">Aucun dossier assuré.</div>
              : <DonutChart
                  data={[
                    { name: 'Part CNAM', value: data.kpis.totalInsuranceShare },
                    { name: 'Part Patient', value: data.kpis.totalPatientShare },
                  ]}
                  formatValue={formatCurrency}
                />}
          </div>
        </Panel>
      </div>

      {/* CNAM by provider table */}
      {data.cnamByProvider.length > 0 && (
        <Panel title="Ventilation par Assureur">
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-12 border-b bg-[var(--color-surface-muted)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-soft)]">
              <div className="col-span-3">Assureur</div>
              <div className="col-span-2 text-center">Dossiers</div>
              <div className="col-span-3 text-right">Total CA</div>
              <div className="col-span-2 text-right">Part CNAM</div>
              <div className="col-span-2 text-right">Part Patient</div>
            </div>
            <div className="divide-y">
              {data.cnamByProvider.map(p => (
                <div key={p.provider} className="grid grid-cols-12 items-center px-4 py-3 text-sm even:bg-[var(--color-surface-muted)]/30">
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium text-[var(--color-text)] truncate">{p.provider}</span>
                  </div>
                  <div className="col-span-2 text-center text-[var(--color-text-secondary)]">{p.count}</div>
                  <div className="col-span-3 text-right text-[var(--color-text-secondary)]">{formatCurrency(p.totalPrice)}</div>
                  <div className="col-span-2 text-right font-semibold text-teal-600">{formatCurrency(p.insuranceShare)}</div>
                  <div className="col-span-2 text-right text-[var(--color-text-secondary)]">{formatCurrency(p.patientShare)}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
