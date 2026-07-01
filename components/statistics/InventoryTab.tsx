'use client';

import { useEffect, useState } from 'react';
import { Package, ArrowDownCircle, ArrowUpCircle, Trash2, AlertTriangle } from 'lucide-react';
import { KpiCard, KpiGrid } from './KpiGrid';
import { DonutChart } from './charts/DonutChart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { InventoryData, PeriodConfig } from './types';

interface InventoryTabProps {
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

const MOV_LABELS: Record<string, { label: string; color: string }> = {
  RECEIVE: { label: 'Réceptions',  color: '#10B981' },
  CONSUME: { label: 'Consommations', color: '#6366F1' },
  WASTE:   { label: 'Rebuts',      color: '#EF4444' },
  ADJUST:  { label: 'Ajustements', color: '#F59E0B' },
};

export function InventoryTab({ period }: InventoryTabProps) {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range: period.range });
    if (period.from) params.set('from', period.from);
    if (period.to) params.set('to', period.to);
    fetch(`/api/statistics/inventory?${params}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-secondary)]">Chargement…</div>;
  if (!data) return null;

  return (
    <div className="space-y-5">
      {data.kpis.criticalItemsCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm font-medium text-amber-800">
            <strong>{data.kpis.criticalItemsCount} article(s)</strong> en stock critique ou inférieur au seuil minimum.
          </p>
        </div>
      )}

      <KpiGrid cols={4}>
        <KpiCard title="Réceptions"       value={`${data.kpis.totalReceived.toLocaleString('fr-FR')} u.`}  icon={ArrowDownCircle} color="emerald" />
        <KpiCard title="Consommé"         value={`${data.kpis.totalConsumed.toLocaleString('fr-FR')} u.`}  icon={Package}         color="indigo" />
        <KpiCard title="Rebuts"           value={`${data.kpis.totalWasted.toLocaleString('fr-FR')} u.`}    icon={Trash2}          color="rose" />
        <KpiCard title="Articles Critiques" value={data.kpis.criticalItemsCount.toLocaleString('fr-FR')}  icon={AlertTriangle}   color="amber" />
      </KpiGrid>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Répartition des Mouvements">
          <div className="h-56">
            {data.movementTypeBreakdown.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucun mouvement.</div>
              : <DonutChart
                  data={data.movementTypeBreakdown.map(m => ({
                    name: MOV_LABELS[m.type]?.label ?? m.type,
                    value: m.quantity,
                  }))}
                />}
          </div>
        </Panel>

        <Panel title="Consommation par Catégorie" className="xl:col-span-2">
          <div className="h-56">
            {data.consumptionByCategory.length === 0
              ? <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune donnée.</div>
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.consumptionByCategory.sort((a, b) => b.quantity - a.quantity)}
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                    barSize={16}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: 12 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={((v: number) => [`${v} unités`, 'Consommé']) as any} />
                    <Bar dataKey="quantity" name="Consommé" fill="#6366F1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </Panel>
      </div>

      <Panel title="Top Réactifs Consommés">
        {data.consumptionRanking.length === 0
          ? <div className="flex h-24 items-center justify-center text-sm text-[var(--color-text-secondary)]">Aucune consommation enregistrée.</div>
          : (
            <div className="overflow-hidden rounded-xl border">
              <div className="grid grid-cols-12 border-b bg-[var(--color-surface-muted)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Réactif</div>
                <div className="col-span-3">Catégorie</div>
                <div className="col-span-2 text-right">Quantité</div>
                <div className="col-span-2 text-right">Utilisations</div>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto">
                {data.consumptionRanking.map((item, i) => (
                  <div key={item.id} className="grid grid-cols-12 items-center px-4 py-2.5 text-sm even:bg-[var(--color-surface-muted)]/30">
                    <div className="col-span-1">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{i + 1}</span>
                    </div>
                    <div className="col-span-4 font-medium text-[var(--color-text)] truncate">{item.name}</div>
                    <div className="col-span-3 text-[var(--color-text-secondary)] truncate">{item.category}</div>
                    <div className="col-span-2 text-right font-semibold text-[var(--color-accent)]">
                      {item.totalQty.toLocaleString('fr-FR')} {item.unit}
                    </div>
                    <div className="col-span-2 text-right text-[var(--color-text-secondary)]">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </Panel>

      {data.criticalItems.length > 0 && (
        <Panel title="Articles en Stock Critique">
          <div className="overflow-hidden rounded-xl border border-amber-100">
            <div className="grid grid-cols-12 border-b bg-amber-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">
              <div className="col-span-4">Réactif</div>
              <div className="col-span-3">Catégorie</div>
              <div className="col-span-2 text-right">Stock</div>
              <div className="col-span-2 text-right">Seuil Min</div>
              <div className="col-span-1 text-right">%</div>
            </div>
            <div className="divide-y divide-amber-100">
              {data.criticalItems.map(item => {
                const pct = item.minThreshold > 0 ? Math.round((item.currentStock / item.minThreshold) * 100) : 0;
                return (
                  <div key={item.id} className="grid grid-cols-12 items-center px-4 py-2.5 text-sm bg-amber-50/30">
                    <div className="col-span-4 font-medium text-[var(--color-text)] truncate">{item.name}</div>
                    <div className="col-span-3 text-[var(--color-text-secondary)] truncate">{item.category}</div>
                    <div className="col-span-2 text-right font-semibold text-rose-600">{item.currentStock} {item.unit}</div>
                    <div className="col-span-2 text-right text-[var(--color-text-secondary)]">{item.minThreshold} {item.unit}</div>
                    <div className="col-span-1 text-right text-xs font-bold text-amber-600">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
