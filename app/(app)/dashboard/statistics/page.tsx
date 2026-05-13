'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart as LucideLineChart, 
  Activity, 
  Banknote, 
  Clock, 
  AlertCircle,
  ShieldCheck,
  Download,
  Users,
  Printer,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { useDirectPrint } from '@/lib/hooks/useDirectPrint';

interface Kpis {
  totalRevenue: number;
  totalAnalyses: number;
  urgentPercentage: number;
  averageTatMinutes: number;
  totalInsuranceShare: number;
  totalPatientShare: number;
  cnamAnalysesCount: number;
}

interface CnamProvider {
  provider: string;
  count: number;
  totalPrice: number;
  insuranceShare: number;
  patientShare: number;
}

interface TimelineEntry {
  date: string;
  revenue: number;
  volume: number;
}

interface TopTest {
  id: string;
  name: string;
  category: string;
  count: number;
}

interface StatsData {
  kpis: Kpis;
  cnamByProvider: CnamProvider[];
  timeline: TimelineEntry[];
  topTests: TopTest[];
}

type RangeOption = '7d' | '30d' | 'ytd' | 'all';

type TooltipPayloadEntry<T> = {
  value: number | string;
  payload: T;
};

type ChartTooltipProps<T> = {
  active?: boolean;
  payload?: TooltipPayloadEntry<T>[];
  label?: string;
};

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  tone: keyof typeof toneClasses;
}

const toneClasses = {
  default: 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-rose-50 text-rose-700',
  success: 'bg-emerald-50 text-emerald-700',
} as const;

export default function StatisticsPage() {
  const [range, setRange] = useState<RangeOption>('30d');
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cnamDateFrom, setCnamDateFrom] = useState('');
  const [cnamDateTo, setCnamDateTo] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const { printUrl } = useDirectPrint();
  const [currency, setCurrency] = useState('DA');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setCurrency(data.amount_unit || 'DA');
        }
      } catch (error) {
        console.error('Failed to load settings', error);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/statistics?range=${range}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [range]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })
      .format(val)
      .replace('DZD', currency);
  };

  const CustomTooltipRevenue = ({ active, payload, label }: ChartTooltipProps<TimelineEntry>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg">
          <p className="font-semibold text-slate-700">{label}</p>
          <p className="text-sm font-medium text-[var(--color-accent)]">
            Chiffre d'Affaires : {formatCurrency(Number(payload[0].value))}
          </p>
          {payload[1] && (
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              Volume : {payload[1].value} analyses
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipTests = ({ active, payload }: ChartTooltipProps<TopTest>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg max-w-[200px]">
          <p className="font-semibold text-slate-700 truncate">{data.name}</p>
          <p className="text-xs text-[var(--color-text-soft)] mb-1">{data.category}</p>
          <p className="text-sm font-medium text-[var(--color-accent)]">
            {payload[0].value} prescriptions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] px-6 py-5 shadow-sm ring-1 ring-slate-900/5 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-[var(--color-accent)]">
              <LucideLineChart size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">Statistiques Globales</h1>
              <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                Analyse financière et volume opérationnel du laboratoire.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
              {[
                { id: '7d' as const, label: '7 Jours' },
                { id: '30d' as const, label: '30 Jours' },
                { id: 'ytd' as const, label: 'Cette année' },
                { id: 'all' as const, label: 'Tout' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                    range === r.id
                      ? 'bg-[var(--color-surface)] text-indigo-700 shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-slate-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNotesPanel(v => !v)}
              className="btn-secondary h-9 px-4 text-sm gap-2"
            >
              <FileText size={15} />
              {showNotesPanel ? 'Masquer les notes' : 'Ajouter des notes'}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  range,
                  autoprint: '1',
                  _t: Date.now().toString(),
                  ...(notes.trim() ? { notes: notes.trim() } : {})
                });
                printUrl(`/print/statistics/report?${params.toString()}`);
              }}
              className="btn-primary h-9 px-5 text-sm gap-2 shadow-[0_6px_14px_rgba(31,95,191,0.18)] hover:scale-[1.02] transition-all"
            >
              <Printer size={15} />
              Imprimer le Rapport
            </button>
          </div>
        </div>
      </section>

      {/* Notes Panel */}
      {showNotesPanel && (
        <section className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Notes du Biologiste</h2>
            <span className="text-xs text-[var(--color-text-soft)] ml-1">(intégrées dans le rapport imprimé)</span>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Saisissez vos observations, commentaires ou recommandations pour ce rapport de performance..."
            className="w-full h-32 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-medium text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] outline-none focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] resize-none transition-colors"
          />
        </section>
      )}

      {/* KPI GRID */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard 
          title="Chiffre d'Affaires" 
          value={loading || !data ? '...' : formatCurrency(data.kpis.totalRevenue)} 
          icon={Banknote} 
          tone="success" 
        />
        <KpiCard 
          title="Analyses Réalisées" 
          value={loading || !data ? '...' : data.kpis.totalAnalyses.toString()} 
          icon={Activity} 
          tone="default" 
        />
        <KpiCard 
          title="TAT Moyen" 
          value={loading || !data ? '...' : `${data.kpis.averageTatMinutes} min`} 
          icon={Clock} 
          tone="warning" 
        />
        <KpiCard 
          title="Part d'Urgences" 
          value={loading || !data ? '...' : `${data.kpis.urgentPercentage.toFixed(1)}%`} 
          icon={AlertCircle} 
          tone="critical" 
        />
      </section>

      {/* CHARTS GRID */}
      <section className="grid gap-6 xl:grid-cols-3">
        {/* REVENUE TIMELINE */}
        <article className="xl:col-span-2 rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5">
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Évolution du Chiffre d'Affaires
            </h2>
          </div>
          <div className="h-[350px] w-full">
            {loading || !data ? (
              <div className="flex h-full items-center justify-center text-slate-400">Chargement...</div>
            ) : data.timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">Aucune donnée pour cette période.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748B' }} 
                    dy={10} 
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return range === 'ytd' || range === 'all' 
                        ? `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().slice(-2)}`
                        : `${d.getDate()}/${d.getMonth()+1}`;
                    }}
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    tickFormatter={(val) => 
                      val >= 1000 ? `${(val/1000).toFixed(0)}k` : val
                    }
                  />
                  <RechartsTooltip content={<CustomTooltipRevenue />} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4F46E5" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        {/* TOP TESTS */}
        <article className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Top Prescriptions
            </h2>
          </div>
          <div className="h-[350px] w-full">
            {loading || !data ? (
              <div className="flex h-full items-center justify-center text-slate-400">Chargement...</div>
            ) : data.topTests.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">Aucune donnée pour cette période.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={data.topTests} 
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    width={90}
                  />
                  <RechartsTooltip content={<CustomTooltipTests />} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {data.topTests.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={'#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      {/* CNAM / ASSURANCE SECTION */}
      <section className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                Ventilation CNAM / Tier-Payant
              </h2>
              <p className="text-xs text-[var(--color-text-soft)] mt-0.5">
                {loading || !data ? '...' : `${data.kpis.cnamAnalysesCount} dossiers assurés sur la période`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--color-text-soft)] whitespace-nowrap">Du</label>
              <input type="date" value={cnamDateFrom} onChange={e => setCnamDateFrom(e.target.value)} className="input-premium h-9 w-36 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--color-text-soft)] whitespace-nowrap">Au</label>
              <input type="date" value={cnamDateTo} onChange={e => setCnamDateTo(e.target.value)} className="input-premium h-9 w-36 text-sm" />
            </div>
            <a
              href={`/api/cnam-export?format=csv${cnamDateFrom ? `&start=${cnamDateFrom}` : ''}${cnamDateTo ? `&end=${cnamDateTo}` : ''}`}
              download
              className="btn-secondary h-9 gap-1.5 text-sm"
            >
              <Download size={14} />
              Export CSV
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="rounded-2xl border bg-teal-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-600">Part Assurance (CNAM)</p>
            <p className="mt-1 text-2xl font-semibold text-teal-700">
              {loading || !data ? '...' : formatCurrency(data.kpis.totalInsuranceShare)}
            </p>
          </div>
          <div className="rounded-2xl border bg-[var(--color-surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Part Patient</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
              {loading || !data ? '...' : formatCurrency(data.kpis.totalPatientShare)}
            </p>
          </div>
          <div className="rounded-2xl border bg-indigo-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)]">Dossiers Assurés</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-700">
              {loading || !data ? '...' : data.kpis.cnamAnalysesCount}
            </p>
          </div>
        </div>

        {/* Provider breakdown table */}
        {!loading && data && data.cnamByProvider.length > 0 && (
          <div className="overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-12 border-b bg-[var(--color-surface-muted)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">
              <div className="col-span-4">Assureur</div>
              <div className="col-span-2 text-center">Dossiers</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-2 text-right">Part CNAM</div>
              <div className="col-span-2 text-right">Part Patient</div>
            </div>
            <div className="divide-y">
              {data.cnamByProvider.map(p => (
                <div key={p.provider} className="grid grid-cols-12 items-center px-4 py-3">
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                        <Users size={14} />
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text)]">{p.provider}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-sm font-medium text-[var(--color-text-secondary)]">{p.count}</div>
                  <div className="col-span-2 text-right text-sm text-[var(--color-text-secondary)]">{formatCurrency(p.totalPrice)}</div>
                  <div className="col-span-2 text-right text-sm font-semibold text-teal-600">{formatCurrency(p.insuranceShare)}</div>
                  <div className="col-span-2 text-right text-sm text-[var(--color-text-secondary)]">{formatCurrency(p.patientShare)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && data && data.cnamByProvider.length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-[var(--color-text-soft)]">
            Aucun dossier assuré sur cette période.
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, tone }: KpiCardProps) {
  return (
    <article className="flex flex-col justify-center rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">{title}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </article>
  );
}
