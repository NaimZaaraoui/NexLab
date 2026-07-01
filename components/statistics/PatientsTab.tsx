'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, UserPlus, Repeat2 } from 'lucide-react';
import { KpiCard, KpiGrid } from './KpiGrid';
import { DonutChart } from './charts/DonutChart';
import { AgePyramidChart } from './charts/AgePyramidChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PatientsData, PeriodConfig } from './types';

interface PatientsTabProps {
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

export function PatientsTab({ period }: PatientsTabProps) {
  const [data, setData] = useState<PatientsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range: period.range });
    if (period.from) params.set('from', period.from);
    if (period.to) params.set('to', period.to);
    fetch(`/api/statistics/patients?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-secondary)]">Chargement…</div>;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <KpiGrid cols={4}>
        <KpiCard title="Total Patients"       value={data.kpis.totalPatients.toLocaleString('fr-FR')}         icon={Users}      color="indigo" />
        <KpiCard title="Nouveaux (période)"   value={data.kpis.newPatients.toLocaleString('fr-FR')}           icon={UserPlus}   color="emerald" />
        <KpiCard title="Vus sur la période"   value={data.kpis.uniquePatientsInPeriod.toLocaleString('fr-FR')} icon={UserCheck}  color="sky" />
        <KpiCard title="Récurrents"           value={data.kpis.recurringCount.toLocaleString('fr-FR')}        icon={Repeat2}    color="violet" />
      </KpiGrid>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Répartition par Sexe">
          <div className="h-64">
            {data.genderDistribution.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée.</div>
              : <DonutChart data={data.genderDistribution.map(g => ({ name: g.gender, value: g.count }))} />}
          </div>
        </Panel>

        <Panel title="Pyramide des Âges" className="xl:col-span-2">
          <div className="h-64">
            {data.agePyramid.every(b => b.M === 0 && b.F === 0)
              ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée d'âge disponible.</div>
              : <AgePyramidChart data={data.agePyramid} />}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Top 10 Patients (visites sur la période)">
          {data.topPatients.length === 0
            ? <div className="flex h-32 items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée.</div>
            : (
              <div className="space-y-2">
                {data.topPatients.map((p, i) => {
                  const max = data.topPatients[0].count;
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-5 shrink-0 text-right text-xs font-bold text-[var(--color-text-secondary)]">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-[var(--color-text)]">{p.name}</span>
                          <span className="text-xs font-semibold text-[var(--color-accent)]">{p.count} visites</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-muted)]">
                          <div className="h-1.5 rounded-full bg-sky-400 transition-all" style={{ width: `${Math.round((p.count / max) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </Panel>

        <Panel title="Distribution des Fréquences de Visite">
          {data.frequencyHistogram.length === 0
            ? <div className="flex h-48 items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée.</div>
            : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.frequencyHistogram} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="visits" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }}
                      label={{ value: 'Visites', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94A3B8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: 12 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={((v: number) => [v, 'Patients']) as any}
                      labelFormatter={l => `${l} visite${Number(l) > 1 ? 's' : ''}`}
                    />
                    <Bar dataKey="patients" name="Patients" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
        </Panel>
      </div>
    </div>
  );
}
