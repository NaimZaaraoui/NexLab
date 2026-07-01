'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { KpiCard, KpiGrid } from './KpiGrid';
import { DonutChart } from './charts/DonutChart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { AnalysesData, PeriodConfig } from './types';

interface AnalysesTabProps {
  period: PeriodConfig;
}

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={`rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-5 shadow-sm ${className}`}>
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">{title}</h2>
      {children}
    </article>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', validated: 'Validé', cancelled: 'Annulé',
};

const ANOMALY_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#6366F1'];

export function AnalysesTab({ period }: AnalysesTabProps) {
  const [data, setData] = useState<AnalysesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range: period.range });
    if (period.from) params.set('from', period.from);
    if (period.to) params.set('to', period.to);
    fetch(`/api/statistics/analyses?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-secondary)]">Chargement…</div>;
  if (!data) return null;

  const validationRate = data.kpis.total > 0 ? Math.round((data.kpis.validated / data.kpis.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <KpiGrid cols={4}>
        <KpiCard title="Total Analyses"   value={data.kpis.total.toLocaleString('fr-FR')}     icon={Activity}      color="indigo" />
        <KpiCard title="Validées"         value={`${data.kpis.validated} (${validationRate}%)`} icon={CheckCircle}   color="emerald" />
        <KpiCard title="En Attente"       value={data.kpis.pending.toLocaleString('fr-FR')}   icon={Clock}         color="amber" />
        <KpiCard title="Urgentes"         value={data.kpis.urgent.toLocaleString('fr-FR')}    icon={AlertCircle}   color="rose" />
      </KpiGrid>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Répartition par Statut">
          <div className="h-56">
            {data.statusDistribution.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée.</div>
              : <DonutChart data={data.statusDistribution.map(s => ({ name: STATUS_LABELS[s.status] ?? s.status, value: s.count }))} />}
          </div>
        </Panel>

        <Panel title="Urgentes vs Normales (par semaine)" className="xl:col-span-2">
          <div className="h-56">
            {data.urgentVsNormal.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée.</div>
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.urgentVsNormal} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }}
                      tickFormatter={v => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: 12 }} />
                    <Bar dataKey="normal" name="Normales" fill="#E0E7FF" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="urgent" name="Urgentes" fill="#EF4444" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="TAT Moyen par Catégorie (minutes)">
          {data.tatByCategory.length === 0
            ? <div className="flex h-40 items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée.</div>
            : (
              <div className="overflow-hidden rounded-xl border">
                <div className="grid grid-cols-12 border-b bg-[var(--color-surface-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                  <div className="col-span-4">Catégorie</div>
                  <div className="col-span-2 text-right">Moy.</div>
                  <div className="col-span-2 text-right">Min</div>
                  <div className="col-span-2 text-right">Max</div>
                  <div className="col-span-2 text-right">N</div>
                </div>
                <div className="divide-y max-h-64 overflow-y-auto">
                  {data.tatByCategory.map(c => (
                    <div key={c.name} className="grid grid-cols-12 items-center px-4 py-2.5 text-sm">
                      <div className="col-span-4 font-medium text-[var(--color-text)] truncate">{c.name}</div>
                      <div className="col-span-2 text-right font-semibold text-[var(--color-accent)]">{c.avgMin}m</div>
                      <div className="col-span-2 text-right text-[var(--color-text-secondary)]">{c.minMin}m</div>
                      <div className="col-span-2 text-right text-[var(--color-text-secondary)]">{c.maxMin}m</div>
                      <div className="col-span-2 text-right text-[var(--color-text-secondary)]">{c.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </Panel>

        <Panel title="Taux d'Anomalie par Test (Top 15)">
          {data.abnormalRates.length === 0
            ? <div className="flex h-40 items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée (min. 5 résultats).</div>
            : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {data.abnormalRates.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-right text-xs font-bold text-[var(--color-text-secondary)]">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-[var(--color-text)] truncate max-w-[65%]">{t.name}</span>
                        <span className="text-xs font-bold" style={{ color: ANOMALY_COLORS[Math.min(Math.floor(t.rate / 20), 4)] }}>
                          {t.rate}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-muted)]">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${t.rate}%`, backgroundColor: ANOMALY_COLORS[Math.min(Math.floor(t.rate / 20), 4)] }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{t.abnormal}/{t.total} résultats</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </Panel>
      </div>

      <Panel title="Top Prescripteurs">
        {data.topPrescripteurs.length === 0
          ? <div className="flex h-20 items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucun prescripteur enregistré.</div>
          : (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.topPrescripteurs.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-muted)] px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{i + 1}</span>
                    <span className="text-sm font-medium text-[var(--color-text)] truncate max-w-[180px]">{p.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-accent)]">{p.count}</span>
                </div>
              ))}
            </div>
          )}
      </Panel>
    </div>
  );
}
