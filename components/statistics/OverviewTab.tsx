'use client';

import { useEffect, useState } from 'react';
import { Activity, Banknote, Clock, AlertCircle, Users } from 'lucide-react';
import { KpiCard, KpiGrid } from './KpiGrid';
import { DualAxisChart } from './charts/DualAxisChart';
import { DonutChart } from './charts/DonutChart';
import type { OverviewData, PeriodConfig } from './types';

interface OverviewTabProps {
  period: PeriodConfig;
  currency: string;
  formatCurrency: (v: number) => string;
}

function ChartPanel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={`rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-5 shadow-sm ${className}`}>
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">{title}</h2>
      {children}
    </article>
  );
}

export function OverviewTab({ period, currency, formatCurrency }: OverviewTabProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range: period.range });
    if (period.from) params.set('from', period.from);
    if (period.to) params.set('to', period.to);
    fetch(`/api/statistics/overview?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  const empty = (
    <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">
      Aucune donnée disponible.
    </div>
  );

  return (
    <div className="space-y-5">
      <KpiGrid cols={5}>
        <KpiCard title="Chiffre d'Affaires"  value={loading || !data ? '…' : formatCurrency(data.kpis.totalRevenue)}       icon={Banknote}     color="emerald" variation={data?.kpis.revenueVariation} />
        <KpiCard title="Analyses Réalisées"  value={loading || !data ? '…' : data.kpis.totalAnalyses.toLocaleString('fr-FR')} icon={Activity}     color="indigo"  variation={data?.kpis.volumeVariation} />
        <KpiCard title="TAT Moyen"           value={loading || !data ? '…' : `${data.kpis.averageTatMinutes} min`}           icon={Clock}        color="amber"   />
        <KpiCard title="Part d'Urgences"     value={loading || !data ? '…' : `${data.kpis.urgentPercentage}%`}              icon={AlertCircle}  color="rose"    />
        <KpiCard title="Total Patients"      value={loading || !data ? '…' : data.kpis.totalPatients.toLocaleString('fr-FR')} icon={Users}       color="sky"     />
      </KpiGrid>

      <div className="grid gap-5 xl:grid-cols-3">
        <ChartPanel title={`Évolution CA & Volume`} className="xl:col-span-2">
          <div className="h-72">
            {loading ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">Chargement…</div>
              : !data || data.timeline.length === 0 ? empty
              : <DualAxisChart data={data.timeline} formatRevenue={formatCurrency} />}
          </div>
        </ChartPanel>

        <ChartPanel title="Répartition par Sexe">
          <div className="h-72">
            {loading ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">Chargement…</div>
              : !data || data.genderDistribution.length === 0 ? empty
              : <DonutChart data={data.genderDistribution.map(g => ({ name: g.gender, value: g.count }))} />}
          </div>
        </ChartPanel>
      </div>

      <ChartPanel title="Top 10 Analyses Prescrites">
        {loading || !data ? (
          <div className="flex h-40 items-center justify-center text-sm text-[var(--color-text-secondary)]">Chargement…</div>
        ) : data.topTests.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée.</div>
        ) : (
          <div className="space-y-2">
            {data.topTests.map((t, i) => {
              const max = data.topTests[0].count;
              const pct = Math.round((t.count / max) * 100);
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs font-bold text-[var(--color-text-secondary)]">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-[var(--color-text)] truncate max-w-[60%]">{t.name}</span>
                      <span className="text-xs font-semibold text-[var(--color-accent)]">{t.count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-muted)]">
                      <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-20 text-right text-xs text-[var(--color-text-secondary)]">{t.category}</span>
                </div>
              );
            })}
          </div>
        )}
      </ChartPanel>
    </div>
  );
}
