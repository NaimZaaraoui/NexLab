'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, subDays, startOfYear, startOfDay, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LucideMicroscope, Printer, TrendingUp, Activity, Banknote, Clock, ShieldCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';

interface StatsData {
  kpis: {
    totalRevenue: number;
    totalAnalyses: number;
    urgentPercentage: number;
    averageTatMinutes: number;
    totalInsuranceShare: number;
    totalPatientShare: number;
    cnamAnalysesCount: number;
  };
  cnamByProvider: Array<{
    provider: string;
    count: number;
    totalPrice: number;
    insuranceShare: number;
    patientShare: number;
  }>;
  timeline: Array<{ date: string; revenue: number; volume: number }>;
  topTests: Array<{ id: string; name: string; category: string; count: number }>;
}

function generateConclusions(data: StatsData, currencyUnit: string): Array<{ type: 'success' | 'warning' | 'info'; text: string }> {
  const conclusions: Array<{ type: 'success' | 'warning' | 'info'; text: string }> = [];
  const { kpis, topTests, cnamByProvider } = data;

  // Volume
  if (kpis.totalAnalyses === 0) {
    conclusions.push({ type: 'info', text: 'Aucune analyse réalisée sur cette période.' });
    return conclusions;
  }

  // Revenue per analysis
  const avgRevPerAnalysis = kpis.totalRevenue / kpis.totalAnalyses;
  conclusions.push({
    type: 'info',
    text: `Le laboratoire a réalisé ${kpis.totalAnalyses} analyse${kpis.totalAnalyses > 1 ? 's' : ''} pour un chiffre d'affaires total de ${Math.round(kpis.totalRevenue).toLocaleString('fr-FR')} ${currencyUnit}, soit une moyenne de ${Math.round(avgRevPerAnalysis).toLocaleString('fr-FR')} ${currencyUnit} par dossier.`,
  });

  // TAT performance
  if (kpis.averageTatMinutes > 0) {
    if (kpis.averageTatMinutes <= 60) {
      conclusions.push({ type: 'success', text: `Le délai de rendu des résultats (TAT) est excellent : ${kpis.averageTatMinutes} minutes en moyenne, bien en dessous du seuil critique de 60 minutes.` });
    } else if (kpis.averageTatMinutes <= 120) {
      conclusions.push({ type: 'info', text: `Le délai moyen de rendu des résultats est de ${kpis.averageTatMinutes} minutes, dans la norme acceptable. Une optimisation des processus pourrait permettre de descendre sous les 60 min.` });
    } else {
      conclusions.push({ type: 'warning', text: `Le délai moyen de rendu (TAT) est de ${kpis.averageTatMinutes} minutes, au-delà du seuil recommandé de 120 minutes. Il est conseillé d'identifier les goulots d'étranglement dans la chaîne de validation.` });
    }
  }

  // Urgency rate
  if (kpis.urgentPercentage > 30) {
    conclusions.push({ type: 'warning', text: `Le taux d'analyses urgentes est élevé (${kpis.urgentPercentage.toFixed(1)}%). Cela peut impacter la planification des ressources humaines et matérielles.` });
  } else if (kpis.urgentPercentage > 0) {
    conclusions.push({ type: 'info', text: `Les analyses urgentes représentent ${kpis.urgentPercentage.toFixed(1)}% du volume total, soit un niveau maîtrisé.` });
  }

  // CNAM share
  if (kpis.totalInsuranceShare > 0 && kpis.totalRevenue > 0) {
    const cnamRatio = (kpis.totalInsuranceShare / kpis.totalRevenue) * 100;
    if (cnamRatio > 60) {
      conclusions.push({ type: 'warning', text: `La part de l'assurance maladie représente ${cnamRatio.toFixed(1)}% du chiffre d'affaires. Cette forte dépendance au Tier-Payant expose le laboratoire à des risques de trésorerie en cas de retard de remboursement.` });
    } else if (cnamRatio > 0) {
      conclusions.push({ type: 'success', text: `La ventilation financière est équilibrée : ${cnamRatio.toFixed(1)}% pris en charge par l'assurance maladie, ${(100 - cnamRatio).toFixed(1)}% réglés directement par les patients.` });
    }
  }

  // Top test
  if (topTests.length > 0) {
    const top = topTests[0];
    const topPercent = kpis.totalAnalyses > 0 ? ((top.count / kpis.totalAnalyses) * 100).toFixed(1) : '0';
    conclusions.push({ type: 'info', text: `L'examen le plus prescrit est "${top.name}" (${top.category}) avec ${top.count} prescriptions (${topPercent}% des dossiers). Cette dominance est à considérer pour la gestion des stocks de réactifs.` });
  }

  return conclusions;
}

export default function StatisticsReportPage() {
  const searchParams = useSearchParams();
  const range = searchParams.get('range') || '30d';
  const notes = searchParams.get('notes') || '';
  const autoPrint = searchParams.get('autoprint') === '1';

  const [data, setData] = useState<StatsData | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [statsRes, settingsRes] = await Promise.all([
          fetch(`/api/statistics?range=${range}`),
          fetch('/api/settings'),
        ]);
        if (!mounted) return;
        if (statsRes.ok) setData(await statsRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } finally {
        if (mounted) {
          setLoading(false);
          window.setTimeout(() => setReady(true), 400);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, [range]);

  useEffect(() => {
    if (!ready || !autoPrint) return;
    const t = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(t);
  }, [ready, autoPrint]);

  const rangeLabel = useMemo(() => {
    const now = new Date();
    if (range === '7d') return `du ${format(subDays(now, 7), 'dd MMMM yyyy', { locale: fr })} au ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
    if (range === '30d') return `du ${format(subDays(now, 30), 'dd MMMM yyyy', { locale: fr })} au ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
    if (range === 'ytd') return `du 1er janvier ${now.getFullYear()} au ${format(now, 'dd MMMM yyyy', { locale: fr })}`;
    return `Toutes périodes confondues`;
  }, [range]);

  const labName = settings.lab_name || 'Laboratoire';
  const labSubtitle = settings.lab_subtitle || '';
  const labAddress = [settings.lab_address_1, settings.lab_address_2].filter(Boolean).join(', ');
  const labPhone = settings.lab_phone || '';
  const bioName = settings.lab_bio_name ? `${settings.lab_bio_title || 'Dr.'} ${settings.lab_bio_name}` : 'Biologiste Responsable';
  const currencyUnit = settings.amount_unit || 'DA';

  const formatCurrency = (val: number) =>
    `${Math.round(val).toLocaleString('fr-FR')} ${currencyUnit}`;

  const conclusions = useMemo(() => {
    if (!data) return [];
    return generateConclusions(data, currencyUnit);
  }, [data, currencyUnit]);

  const totalTests = useMemo(() => {
    if (!data) return 0;
    return data.topTests.reduce((s, t) => s + t.count, 0);
  }, [data]);

  const editionDate = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm font-medium text-slate-400 animate-pulse">
        Génération du rapport en cours...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center text-sm font-bold text-rose-500">
        Erreur de chargement des données statistiques.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] py-10 px-4 print:p-0 print:bg-white">

      {/* Controls (hidden on print) */}
      <div className="mx-auto max-w-4xl mb-8 animate-fade-in print:hidden">
        <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-sm flex items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight">Rapport de Performance</h1>
            <p className="text-sm font-medium text-[var(--color-text-soft)] mt-1">{rangeLabel}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="btn-primary h-12 px-8 rounded-2xl shadow-[0_10px_20px_rgba(31,95,191,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Printer size={18} />
            <span className="font-bold">Imprimer le Rapport</span>
          </button>
        </div>
      </div>

      {/* ========== RAPPORT DOCUMENT ========== */}
      <div className="mx-auto max-w-4xl bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,31,51,0.10)] border border-[var(--color-border)] overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none">

        {/* ── HEADER ── */}
        <div className="relative px-10 pt-10 pb-8 bg-[linear-gradient(135deg,#0f1f33_0%,#1f5fbf_100%)] text-white print:bg-slate-900">
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[3rem]" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                <LucideMicroscope size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">{labName}</h1>
                {labSubtitle && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-[2px] w-5 bg-blue-300" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">{labSubtitle}</span>
                  </div>
                )}
                {labAddress && <p className="text-xs text-blue-200 mt-1">{labAddress}{labPhone ? ` · Tél: ${labPhone}` : ''}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Rapport de Performance</p>
              <h2 className="text-xl font-black mt-1">Analyse Statistique</h2>
              <p className="text-sm text-blue-200 mt-1 capitalize">{rangeLabel}</p>
              <p className="text-xs text-blue-300 mt-2">Édité le {editionDate}</p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-300">Document à usage administratif · NexLab LIMS</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="px-10 py-8 border-b border-[var(--color-border)] print:border-black/10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-soft)] mb-5">Indicateurs Clés de Performance</p>
          <div className="grid grid-cols-4 gap-4 print:gap-3">
            {[
              { label: "Chiffre d'Affaires", value: formatCurrency(data.kpis.totalRevenue), icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Analyses Réalisées', value: `${data.kpis.totalAnalyses}`, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'TAT Moyen', value: `${data.kpis.averageTatMinutes} min`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Part Urgences', value: `${data.kpis.urgentPercentage.toFixed(1)}%`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-2xl border border-[var(--color-border)] ${bg} p-4 print:rounded-xl print:p-3`}>
                <div className={`flex items-center justify-between mb-3 print:mb-2`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-soft)] print:text-black/60">{label}</p>
                  <Icon size={16} className={color} />
                </div>
                <p className={`text-2xl font-black ${color} tracking-tight print:text-xl print:text-black`}>{value}</p>
              </div>
            ))}
          </div>

          {/* CNAM mini stats if available */}
          {data.kpis.cnamAnalysesCount > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-4 print:gap-3">
              <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 print:rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-teal-600/70 mb-2">Part Assurance (CNAM)</p>
                <p className="text-xl font-black text-teal-700 print:text-black">{formatCurrency(data.kpis.totalInsuranceShare)}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 print:rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-soft)] mb-2">Part Patient</p>
                <p className="text-xl font-black text-[var(--color-text)] print:text-black">{formatCurrency(data.kpis.totalPatientShare)}</p>
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 print:rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600/70 mb-2">Dossiers Assurés</p>
                <p className="text-xl font-black text-indigo-700 print:text-black">{data.kpis.cnamAnalysesCount}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── REVENUE CHART ── */}
        {data.timeline.length > 0 && (
          <div className="px-10 py-8 border-b border-[var(--color-border)] print:border-black/10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-soft)] mb-1">Évolution du Chiffre d&apos;Affaires</p>
            <div className="flex items-end gap-3 mb-6">
              <h3 className="text-lg font-black text-[var(--color-text)]">Courbe de Performance Financière</h3>
              <span className="text-xs font-semibold text-[var(--color-text-soft)] mb-0.5 capitalize">{rangeLabel}</span>
            </div>
            <div className="flex justify-center w-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
                <LineChart width={750} height={260} data={data.timeline} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    dy={8}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val)), "Chiffre d'Affaires"]}
                    labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: fr })}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1f5fbf"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#1f5fbf', stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
            </div>
          </div>
        )}

        {/* ── TOP TESTS TABLE ── */}
        {data.topTests.length > 0 && (
          <div className="px-10 py-8 border-b border-[var(--color-border)] print:border-black/10 print:break-before-page">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-soft)] mb-1">Activité par Examen</p>
            <h3 className="text-lg font-black text-[var(--color-text)] mb-6">Top {data.topTests.length} Examens Prescrits</h3>

            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] print:rounded-none print:border-black/20">
              <div className="grid grid-cols-12 bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-text-soft)] print:border-black/20 print:text-black/60">
                <div className="col-span-1 text-center">Rang</div>
                <div className="col-span-5">Examen</div>
                <div className="col-span-3">Catégorie</div>
                <div className="col-span-2 text-right">Prescriptions</div>
                <div className="col-span-1 text-right">%</div>
              </div>
              <div className="divide-y divide-[var(--color-border)] print:divide-black/10">
                {data.topTests.map((test, i) => {
                  const pct = totalTests > 0 ? ((test.count / totalTests) * 100).toFixed(1) : '0';
                  const barWidth = totalTests > 0 ? (test.count / data.topTests[0].count) * 100 : 0;
                  return (
                    <div key={test.id} className={`grid grid-cols-12 items-center px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-surface-muted)]/30'}`}>
                      <div className="col-span-1 text-center">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${i === 0 ? 'bg-indigo-600 text-white' : i < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                          {i + 1}
                        </span>
                      </div>
                      <div className="col-span-5">
                        <p className="text-sm font-bold text-[var(--color-text)] truncate print:text-black">{test.name}</p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 print:hidden">
                          <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                      <div className="col-span-3">
                        <span className="text-xs font-semibold text-[var(--color-text-soft)] print:text-black/60">{test.category}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-black text-[var(--color-text)] print:text-black">{test.count}</span>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-xs font-bold text-[var(--color-text-soft)] print:text-black/60">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PAGE 3 WRAPPER ── */}
        <div className="print:break-before-page">
          
          {/* ── CNAM TABLE ── */}
          {data.cnamByProvider.length > 0 && (
            <div className="px-10 py-8 border-b border-[var(--color-border)] print:border-black/10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-soft)] mb-1">Assurance Maladie</p>
            <h3 className="text-lg font-black text-[var(--color-text)] mb-6">Ventilation CNAM / Tier-Payant</h3>

            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] print:rounded-none print:border-black/20">
              <div className="grid grid-cols-12 bg-teal-50 border-b border-teal-100 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-teal-700 print:border-black/20 print:text-black/60 print:bg-slate-50">
                <div className="col-span-4">Assureur</div>
                <div className="col-span-2 text-center">Dossiers</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-2 text-right">Part CNAM</div>
                <div className="col-span-2 text-right">Part Patient</div>
              </div>
              <div className="divide-y divide-[var(--color-border)] print:divide-black/10">
                {data.cnamByProvider.map((p, i) => (
                  <div key={p.provider} className={`grid grid-cols-12 items-center px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}`}>
                    <div className="col-span-4 text-sm font-bold text-[var(--color-text)] print:text-black">{p.provider}</div>
                    <div className="col-span-2 text-center text-sm font-medium text-[var(--color-text-secondary)] print:text-black">{p.count}</div>
                    <div className="col-span-2 text-right text-sm text-[var(--color-text-secondary)] print:text-black">{formatCurrency(p.totalPrice)}</div>
                    <div className="col-span-2 text-right text-sm font-black text-teal-600 print:text-black">{formatCurrency(p.insuranceShare)}</div>
                    <div className="col-span-2 text-right text-sm text-[var(--color-text-secondary)] print:text-black">{formatCurrency(p.patientShare)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CONCLUSIONS ── */}
        <div className="px-10 py-8 border-b border-[var(--color-border)] print:border-black/10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-soft)] mb-1">Analyse Qualitative</p>
          <h3 className="text-lg font-black text-[var(--color-text)] mb-6">Conclusions et Observations</h3>

          <div className="space-y-4">
            {conclusions.map((c, i) => {
              const Icon = c.type === 'success' ? CheckCircle2 : c.type === 'warning' ? AlertTriangle : Info;
              const colors = {
                success: 'bg-emerald-50 border-emerald-200 text-emerald-800 print:border-black/20 print:bg-slate-50',
                warning: 'bg-amber-50 border-amber-200 text-amber-800 print:border-black/20 print:bg-slate-50',
                info: 'bg-[var(--color-surface-muted)] border-[var(--color-border)] text-[var(--color-text)] print:border-black/20',
              };
              const iconColors = { success: 'text-emerald-500', warning: 'text-amber-500', info: 'text-indigo-400' };
              return (
                <div key={i} className={`flex items-start gap-3 rounded-2xl border p-4 print:rounded-none print:p-3 ${colors[c.type]}`}>
                  <Icon size={16} className={`mt-0.5 shrink-0 ${iconColors[c.type]} print:text-black/60`} />
                  <p className="text-sm leading-relaxed print:text-black">{c.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BIOLOGISTE NOTES ── */}
        {notes && (
          <div className="px-10 py-8 border-b border-[var(--color-border)] print:border-black/10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-soft)] mb-1">Observations Complémentaires</p>
            <h3 className="text-lg font-black text-[var(--color-text)] mb-4">Notes du Biologiste Responsable</h3>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 p-5 print:rounded-none print:border-black/20 print:bg-transparent">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-text)] print:text-black">{notes}</p>
            </div>
          </div>
        )}

        {/* ── SIGNATURE FOOTER ── */}
        <div className="px-10 py-8">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-soft)] mb-3">Certification du Document</p>
              <p className="text-xs text-[var(--color-text-soft)] leading-relaxed print:text-black/70">
                Ce rapport a été généré automatiquement par le système de gestion NexLab LIMS sur la base des données enregistrées dans la base de données du laboratoire.
                Les informations présentées sont confidentielles et à usage administratif interne exclusivement.
              </p>
            </div>
            <div className="text-center flex flex-col items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-soft)] mb-4">Signature du Biologiste</p>
              <div style={{ position: 'relative', width: '120px', height: '90px', margin: '0 auto 12px auto' }}>
                {settings?.lab_stamp_image && settings?.lab_bio_signature && (
                  <>
                    <img
                      src={settings.lab_stamp_image}
                      alt="Cachet"
                      style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90px', height: '90px', objectFit: 'contain', opacity: 0.9 }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '130px', height: '30px', backgroundColor: 'hsla(0, 0%, 100%, 0.5)', paddingBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2 }}>
                      <img
                        src={settings.lab_bio_signature}
                        alt="Signature"
                        style={{ width: '120px', height: '30px', objectFit: 'contain', objectPosition: 'center bottom', filter: 'contrast(1.15)' }}
                      />
                    </div>
                  </>
                )}

                {settings?.lab_stamp_image && !settings?.lab_bio_signature && (
                  <>
                    <img src={settings.lab_stamp_image} alt="Cachet" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90px', height: '90px', objectFit: 'contain' }} />
                  </>
                )}

                {!settings?.lab_stamp_image && settings?.lab_bio_signature && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <img src={settings.lab_bio_signature} alt="Signature" style={{ width: '130px', height: '30px', objectFit: 'contain', objectPosition: 'center bottom', filter: 'contrast(1.15)' }} />
                    <div style={{ width: '120px', height: '90px', border: '1px dashed #cfd2d7ff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                      <span style={{ fontSize: '7px', color: '#cfd2d7ff', textAlign: 'center', lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.1em', transform: 'rotate(-15deg)' }}>Zone de cachet</span>
                    </div>
                  </div>
                )}

                {!settings?.lab_stamp_image && !settings?.lab_bio_signature && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '90px', border: '2px dashed #cfd2d7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <span style={{ fontSize: '8px', color: '#cfd2d7ff', textAlign: 'center', lineHeight: 1.6, textTransform: 'uppercase', letterSpacing: '0.15em', transform: 'rotate(-15deg)' }}>Zone de cachet</span>
                  </div>
                )}
              </div>
              <p className="text-xs font-black text-[var(--color-accent)] uppercase tracking-widest print:text-black">{bioName}</p>
              {settings.lab_bio_onmpt && (
                <p className="text-[10px] text-[var(--color-text-soft)] mt-1 print:text-black/60">ONMPT: {settings.lab_bio_onmpt}</p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex items-center justify-between text-[9px] font-bold text-[var(--color-text-soft)] uppercase tracking-[0.25em] print:text-black/40 print:border-black/10">
            <span>{labName}{labPhone ? ` · Tél: ${labPhone}` : ''}</span>
            <span>Rapport Statistique · {format(new Date(), 'yyyy')}</span>
            <span>NexLab LIMS</span>
          </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm 10mm;
          }
          body {
            background: white !important;
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html { background: white !important; }
        }
      `}</style>
    </div>
  );
}
