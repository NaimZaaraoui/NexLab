'use client';

import { use, useState } from 'react';
import { 
  ArrowLeft,
  Printer,
  ChevronDown,
  ChevronUp,
  LineChart,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQcLot } from '@/components/qc/useQcLot';
import { LeveyJenningsChart } from '@/components/qc/LeveyJenningsChart';
import { NotificationToast } from '@/components/ui/notification-toast';
import { useDirectPrint } from '@/lib/hooks/useDirectPrint';

export default function QcLotPage({ params }: { params: Promise<{ lotId: string }> }) {
  const resolvedParams = use(params);
  const state = useQcLot(resolvedParams.lotId);
  const { lot, activeData } = state;
  const { printUrl } = useDirectPrint();
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [showAllDays, setShowAllDays] = useState(false);

  if (state.loading || !lot) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
         <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)]" />
      </div>
    );
  }

  const activeTarget = activeData?.target;
  const visibleDays = !activeData?.activeArray
    ? []
    : showAllDays
      ? activeData.activeArray
      : activeData.activeArray.slice(0, 5);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)] print:hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Link
              href="/dashboard/qc"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]"
            >
              <ArrowLeft size={16} />
              Retour
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">
                {lot.material.name}
                <span className="ml-2 inline-flex rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">
                  Niveau {lot.material.level}
                </span>
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                Lot {lot.lotNumber}
                {!lot.isActive ? ' · Archivé' : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row flex-wrap sm:items-center">
            <div className="relative">
              <select
                value={state.selectedTestCode || ''}
                onChange={(e) => state.setSelectedTestCode(e.target.value)}
                className="h-11 min-w-[260px] appearance-none rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] pl-4 pr-11 text-sm font-medium text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
              >
                {lot.targets.map((target) => (
                  <option key={target.testCode} value={target.testCode}>
                    {target.testCode} — {target.testName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                printUrl(
                  `/dashboard/qc/${lot.id}/print?autoprint=1&closeAfterPrint=1&testCode=${encodeURIComponent(
                    state.selectedTestCode || ''
                  )}&_t=${Date.now()}`
                )
              }
              className="btn-primary h-11 px-5"
            >
              <Printer size={16} />
              <span>Imprimer le rapport mensuel</span>
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-[var(--color-surface)] p-2 shadow-[0_2px_8px_rgba(15,31,51,0.03)] print:hidden">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]'
            }`}
          >
            Résumé & graphique
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'history'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]'
            }`}
          >
            Historique
          </button>
        </div>
      </section>

      {activeTab === 'overview' && (
        <>
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4 print:hidden">
            <div className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Cible</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                {activeTarget?.mean.toFixed(2) || '0.00'}
                <span className="ml-2 text-sm font-medium text-[var(--color-text-soft)]">{activeTarget?.unit}</span>
              </p>
            </div>
            <div className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">
                {activeTarget?.controlMode === 'STATISTICAL' ? 'Écart-type' : 'Plage'}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                {activeTarget?.controlMode === 'STATISTICAL' ? (activeTarget.sd?.toFixed(3) || '0.000') : 'Acceptation'}
              </p>
            </div>
            <div className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Précision</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-text)] tabular-nums">
                {activeTarget?.mean && activeTarget?.sd ? ((activeTarget.sd / activeTarget.mean) * 100).toFixed(2) : '0.00'}%
              </p>
            </div>
            <div className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Mesures</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-text)] tabular-nums">{activeData?.points.length || 0}</p>
            </div>
          </section>

          <section className="bento-panel p-5 print:hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-[var(--color-accent)]" />
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">
                    Graphe QC : {activeTarget?.testName}
                  </h2>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Lecture recentrée sur le test sélectionné pour une revue mensuelle plus claire.
                </p>
              </div>
              <div className="rounded-2xl border bg-[var(--color-surface)] px-4 py-3 text-xs text-[var(--color-text-soft)]">
                {format(new Date(), 'MMMM yyyy', { locale: fr })}
              </div>
            </div>

            <div className="mt-5 rounded-md border bg-[var(--color-surface)] p-4">
              {activeData && activeData.points.length > 0 ? (
                <LeveyJenningsChart
                  title=""
                  points={activeData.points.map((point) => ({
                    id: point.id,
                    performedAt: point.performedAt,
                    performedByName: point.performedByName || 'Utilisateur',
                    measured: point.measured,
                    zScore: point.zScore || 0,
                    flag: point.flag || 'pass',
                    rule: null,
                    inAcceptanceRange: true,
                  }))}
                  mean={activeTarget?.mean || 0}
                  sd={activeTarget?.sd || 0}
                  controlMode={activeTarget?.controlMode || 'STATISTICAL'}
                  unit={activeTarget?.unit || null}
                  minAcceptable={activeTarget?.minAcceptable || null}
                  maxAcceptable={activeTarget?.maxAcceptable || null}
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-center text-sm text-[var(--color-text-soft)]">
                  Aucun résultat QC enregistré pour ce test.
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === 'history' && (
        <section className="space-y-4 print:hidden">
          <div className="px-1">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Historique des relevés</h3>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Détail chronologique des mesures du test sélectionné, limité par défaut pour garder une lecture légère.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
            {!activeData || activeData.activeArray.length === 0 ? (
              <div className="py-20 text-center text-sm text-[var(--color-text-soft)]">
                Données manquantes
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleDays.map((day) => {
                  const isExpanded = expandedDays[day.date] ?? false;

                  return (
                    <div key={day.date}>
                      <button
                        type="button"
                        onClick={() => setExpandedDays((prev) => ({ ...prev, [day.date]: !isExpanded }))}
                        className="flex w-full items-center justify-between bg-[var(--color-surface-muted)]/70 px-6 py-4 text-left transition hover:bg-[var(--color-surface-muted)]"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[var(--color-text)]">
                            {format(new Date(day.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                          </div>
                          <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                            {day.points.length} mesure(s) · Moyenne {day.mean.toFixed(2)} {activeTarget?.unit || ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] font-medium text-[var(--color-text)]">
                            {isExpanded ? 'Réduire' : 'Voir'}
                          </span>
                          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="space-y-1 px-3 py-3">
                          {day.points.map((point) => {
                            let statusColor = 'text-slate-700 bg-[var(--color-surface-muted)] border-[var(--color-border)]';
                            let icon = <CheckCircle2 size={10} className="text-[var(--color-text-soft)]" />;

                            if (point.flag === 'fail') {
                              statusColor = 'text-red-700 bg-red-50 border-red-100';
                              icon = <AlertTriangle size={10} className="text-red-600" />;
                            } else if (point.flag === 'warn') {
                              statusColor = 'text-amber-700 bg-amber-50 border-amber-100';
                              icon = <AlertTriangle size={10} className="text-amber-600" />;
                            }

                            return (
                              <div
                                key={point.id}
                                className="group/row flex items-center justify-between rounded-md border border-transparent px-4 py-3 transition-all hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]/80"
                              >
                                <div className="flex items-center gap-8">
                                  <div className="w-12 text-xs font-medium text-[var(--color-text-soft)] tabular-nums">
                                    {format(new Date(point.performedAt), 'HH:mm:ss')}
                                  </div>
                                  <div className={`status-pill h-9 !rounded-xl border px-5 text-[11px] ${statusColor}`}>
                                    {icon}
                                    <span className="text-sm font-semibold tabular-nums">{point.measured}</span>
                                    <span className="ml-2 text-[9px] font-medium opacity-50">{activeTarget?.unit}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="hidden text-[11px] text-[var(--color-text-soft)] md:block">
                                    {point.performedByName}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {activeData && activeData.activeArray.length > 5 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllDays((prev) => !prev)}
                className="rounded-md border bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
              >
                {showAllDays ? 'Réduire' : `Voir plus (${activeData.activeArray.length - 5} jour(s) de plus)`}
              </button>
            </div>
          )}
        </section>
      )}

      {state.notification && (
        <NotificationToast type={state.notification.type} message={state.notification.message} />
      )}
    </div>
  );
}
