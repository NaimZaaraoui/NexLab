'use client';

import { type ComponentType, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  RefreshCw,
  TestTube,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { differenceInMinutes } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Analysis as SharedAnalysis } from '@/lib/core/types';
import { formatTatLabel, getTatMinutes, getTatTextClass } from '@/lib/analysis/tat';

type Analysis = SharedAnalysis & { isUrgent?: boolean };

interface Stats {
  total: number;
  totalToday?: number;
  pending: number;
  inProgress: number;
  completed: number;
  urgent: number;
  purePending?: number;
  tat?: number;
  tatWarn?: number;
  tatAlert?: number;
}

interface DashboardData {
  analyses: Analysis[];
  stats: Stats;
}

interface InventoryAlertItem {
  id: string;
  name: string;
  status: 'ok' | 'low' | 'critical' | 'expired';
  currentStock: number;
  minThreshold: number;
  unit: string;
  daysUntilExpiry: number | null;
}

interface QcTodaySummary {
  allPass: boolean;
  missing: number;
  warn: number;
  fail: number;
}

interface BackupAlertSummary {
  hasBackups: boolean;
  latestCreatedAt: string | null;
  isStale: boolean;
}

interface TemperatureTodaySummary {
  totalInstruments: number;
  missingCount: number;
  alertCount: number;
}

interface KpiCardProps {
  title: string;
  value: number;
  tone: 'default' | 'warning' | 'critical' | 'success';
  icon: ComponentType<{ className?: string }>;
  loading?: boolean;
}

interface ActionCardProps {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  primary?: boolean;
}

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  pending: { label: 'En attente', classes: 'bg-amber-50 text-amber-700 border border-amber-200/70' },
  in_progress: { label: 'En cours', classes: 'bg-blue-50 text-blue-700 border border-blue-200/70' },
  validated_tech: { label: 'Validé Tech', classes: 'bg-cyan-50 text-cyan-700 border border-cyan-200/70' },
  validated_bio: { label: 'Validé', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' },
  completed: { label: 'Validé', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<DashboardData>({
    analyses: [],
    stats: { total: 0, pending: 0, inProgress: 0, completed: 0, urgent: 0 },
  });
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlertItem[]>([]);
  const [qcToday, setQcToday] = useState<QcTodaySummary | null>(null);
  const [backupAlert, setBackupAlert] = useState<BackupAlertSummary | null>(null);
  const [temperatureToday, setTemperatureToday] = useState<TemperatureTodaySummary | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const requests: Promise<Response>[] = [
        fetch('/api/analyses', { cache: 'no-store' }),
        fetch('/api/stats', { cache: 'no-store' }),
        fetch('/api/inventory', { cache: 'no-store' }),
        fetch('/api/qc/today', { cache: 'no-store' }),
        fetch('/api/temperature/today', { cache: 'no-store' }),
      ];

      if (session?.user?.role === 'ADMIN') {
        requests.push(fetch('/api/database/backups', { cache: 'no-store' }));
      }

      const [analysesRes, statsRes, inventoryRes, qcRes, temperatureRes, backupsRes] = await Promise.all(requests);
      const [analyses, stats] = await Promise.all([analysesRes.json(), statsRes.json()]);
      setState({ analyses, stats });

      if (inventoryRes.ok) {
        const inventory = await inventoryRes.json();
        if (Array.isArray(inventory)) {
          setInventoryAlerts(inventory.filter((item) => item.status && item.status !== 'ok'));
        }
      }

      if (qcRes.ok) {
        const qcData = await qcRes.json();
        setQcToday(qcData);
      }

      if (temperatureRes.ok) {
        const tempData = await temperatureRes.json();
        setTemperatureToday(tempData);
      }

      if (session?.user?.role === 'ADMIN' && backupsRes?.ok) {
        const backupsData = await backupsRes.json();
        const latestCreatedAt = backupsData.items?.[0]?.createdAt ?? null;
        const latestDate = latestCreatedAt ? new Date(latestCreatedAt) : null;
        const daysSinceLatest = latestDate ? differenceInMinutes(new Date(), latestDate) / (60 * 24) : null;

        setBackupAlert({
          hasBackups: Boolean(backupsData.items?.length),
          latestCreatedAt,
          isStale: !latestDate || (daysSinceLatest ?? 999) >= 7,
        });
      } else {
        setBackupAlert(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.role]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeAnalyses = useMemo(
    () => state.analyses.filter((analysis) => !['completed', 'validated_bio'].includes(analysis.status ?? '')).slice(0, 10),
    [state.analyses],
  );

  const role = session?.user?.role ?? 'TECHNICIEN';
  const totalToday = state.stats.totalToday ?? state.stats.total;

  return (
    <div className="space-y-5 pb-8">
      <section className="bento-panel px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">
              Tableau de bord laboratoire
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Bonjour {session?.user?.name || 'Utilisateur'}, suivi opérationnel du laboratoire.
            </p>
          </div>
          <button onClick={loadDashboard} className="btn-secondary">
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Actualiser
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Dossiers du jour" value={totalToday} icon={ClipboardList} tone="default" loading={loading} />
        <KpiCard title="En attente" value={state.stats.pending} icon={Clock} tone="warning" loading={loading} />
        <KpiCard title="Résultats anormaux" value={state.stats.urgent} icon={AlertCircle} tone="critical" loading={loading} />
        <KpiCard title="Validés" value={state.stats.completed} icon={CheckCircle2} tone="success" loading={loading} />
      </section>

      {qcToday && (qcToday.fail > 0 || qcToday.missing > 0) && (
        <section className={`rounded-[28px] px-5 py-4 shadow-[0_14px_35px_rgba(15,31,51,0.045)] ${
          qcToday.fail > 0
            ? 'border border-rose-200/70 bg-rose-50/85'
            : 'border border-amber-200/70 bg-amber-50/85'
        }`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className={`text-sm font-semibold uppercase tracking-[0.08em] ${
                qcToday.fail > 0 ? 'text-rose-800' : 'text-amber-800'
              }`}>
                Contrôle qualité prioritaire
              </h2>
              <p className={`mt-1 text-sm ${
                qcToday.fail > 0 ? 'text-rose-900' : 'text-amber-900'
              }`}>
                {qcToday.fail > 0
                  ? `${qcToday.fail} contrôle(s) qualité en échec — vérifiez l'analyseur avant tout résultat patient.`
                  : `${qcToday.missing} contrôle(s) qualité non effectué(s) aujourd'hui.`}
              </p>
            </div>
            <Link href="/dashboard/qc" className="btn-secondary">
              Voir le QC
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {inventoryAlerts.length > 0 && (
        <section className="rounded-[28px] border border-amber-200/70 bg-amber-50/80 px-5 py-4 shadow-[0_14px_35px_rgba(120,80,0,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-amber-800">
                Inventaire à surveiller
              </h2>
              <p className="mt-1 text-sm text-amber-900">
                {inventoryAlerts.length} article{inventoryAlerts.length > 1 ? 's' : ''} nécessitent votre attention.
              </p>
            </div>
            <Link href="/dashboard/inventory" className="btn-secondary">
              Voir l&apos;inventaire
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {inventoryAlerts.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200/60 bg-[var(--color-surface)]/82 px-3 py-2 shadow-[0_6px_16px_rgba(120,80,0,0.035)]"
              >
                <span className="text-sm font-medium text-[var(--color-text)]">{item.name}</span>
                <span className="text-xs text-[var(--color-text-soft)]">
                  {formatInventoryAlertReason(item)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {temperatureToday &&
        (temperatureToday.alertCount > 0 || temperatureToday.missingCount > 0) && (
          <section className="rounded-[28px] border border-sky-200/70 bg-sky-50/80 px-5 py-4 shadow-[0_14px_35px_rgba(14,116,144,0.06)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-800">
                  Suivi des températures
                </h2>
                <p className="mt-1 text-sm text-sky-900">
                  {temperatureToday.missingCount} instrument{temperatureToday.missingCount > 1 ? 's' : ''} sans relevé complet
                  · {temperatureToday.alertCount} alerte{temperatureToday.alertCount > 1 ? 's' : ''} hors plage.
                </p>
              </div>
              <Link href="/dashboard/temperature" className="btn-secondary">
                Voir les relevés
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

      {role === 'ADMIN' && backupAlert && (backupAlert.isStale || !backupAlert.hasBackups) && (
        <section className="rounded-[28px] border border-rose-200/70 bg-rose-50/85 px-5 py-4 shadow-[0_14px_35px_rgba(190,18,60,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-rose-800">
                Sauvegarde a verifier
              </h2>
              <p className="mt-1 text-sm text-rose-900">
                {!backupAlert.hasBackups
                  ? 'Aucune sauvegarde systeme n’a encore ete creee.'
                  : `La derniere sauvegarde date du ${new Date(backupAlert.latestCreatedAt as string).toLocaleString('fr-FR')}. Pensez a en creer une nouvelle.`}
              </p>
            </div>
            <Link href="/dashboard/settings/database" className="btn-secondary">
              Ouvrir la maintenance
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {role !== 'MEDECIN' && (
          <ActionCard href="/analyses/nouvelle" label="Nouvelle analyse" icon={Plus} primary />
        )}
        <ActionCard href="/dashboard/patients" label="Ajouter patient" icon={Users} />
        <ActionCard href="/analyses" label="Voir les analyses" icon={TestTube} />
      </section>

      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/86 shadow-[0_14px_38px_rgba(15,31,51,0.055)]">
          <div className="flex items-center justify-between border-b bg-[var(--color-surface)]/78 px-5 py-4 backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
              Dossiers récents
            </h2>
            <Link href="/analyses" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-12 border-b bg-[var(--color-surface-muted)]/86 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Patient</div>
            <div className="col-span-2 text-center">Commande</div>
            <div className="col-span-2 text-center">TAT</div>
            <div className="col-span-2 text-right">Statut</div>
          </div>

          <div className="divide-y">
            {loading && <LoadingRows />}
            {!loading && activeAnalyses.length === 0 && (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-emerald-500 mb-3 shadow-sm border border-emerald-100">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Aucune analyse en attente</p>
                <p className="mt-1 text-xs text-[var(--color-text-soft)] max-w-[250px]">Toutes les analyses ont été validées. Excellent travail !</p>
              </div>
            )}
            {!loading &&
              activeAnalyses.map((analysis, index) => {
                const status = STATUS_MAP[analysis.status ?? ''] ?? {
                  label: analysis.status ?? 'Inconnu',
                  classes: 'bg-[var(--color-surface-muted)] text-slate-700 border border-[var(--color-border)]/70',
                };

                return (
                  <Link
                    key={analysis.id}
                    href={`/analyses/${analysis.id}`}
                    className="grid grid-cols-12 items-center px-5 py-3 transition-colors hover:bg-[var(--color-surface-muted)]/86"
                  >
                    <div className="col-span-1 text-center text-xs font-medium text-[var(--color-text-soft)]">{index + 1}</div>
                    <div className="col-span-5 min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--color-text)]">
                        {analysis.patientFirstName} {analysis.patientLastName}
                      </div>
                      <div className="text-xs text-[var(--color-text-soft)]">ID: {analysis.dailyId || 'N/A'}</div>
                    </div>
                    <div className="col-span-2 text-center font-mono text-xs font-medium text-[var(--color-text-secondary)]">
                      {analysis.orderNumber}
                    </div>
                    <div
                      className={`col-span-2 text-center text-xs ${getTatTextClass(getTatMinutes(analysis), {
                        warnMinutes: state.stats.tatWarn ?? 45,
                        alertMinutes: state.stats.tatAlert ?? 60,
                      })}`}
                    >
                      {formatTatLabel(getTatMinutes(analysis))}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.classes}`}>
                        {status.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bento-panel p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Flux opérationnel</h3>
            <div className="mt-4 space-y-3 text-sm">
              <StatRow label="Total en attente" value={state.stats.pending} />
              <StatRow label="Démarrés" value={state.stats.inProgress} />
              <StatRow label="Non commencés" value={state.stats.purePending ?? state.stats.pending} />
              <StatRow label="TAT moyen du jour" value={state.stats.tat ? `${state.stats.tat} min` : 'N/A'} />
            </div>
          </div>

          <div className="bento-panel p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Actions rapides</h3>
            <div className="mt-4 space-y-2">
              <QuickLink href="/dashboard/patients">Rechercher patient</QuickLink>
              <QuickLink href="/dashboard/exports">Exporter statistiques</QuickLink>
              <QuickLink href="/dashboard/settings/lab">Paramètres laboratoire</QuickLink>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function formatInventoryAlertReason(item: InventoryAlertItem) {
  if (item.status === 'expired') {
    return 'Lot expiré détecté';
  }
  if (item.status === 'critical') {
    return `Stock critique: ${item.currentStock} ${item.unit}`;
  }
  if (item.status === 'low') {
    return `Sous seuil: ${item.currentStock} / ${item.minThreshold} ${item.unit}`;
  }
  return 'Conforme';
}

function KpiCard({ title, value, icon: Icon, tone, loading }: KpiCardProps) {
  const toneClasses: Record<KpiCardProps['tone'], string> = {
    default: 'bg-blue-50 text-blue-700 ring-blue-100',
    warning: 'bg-amber-50 text-amber-700 ring-amber-100',
    critical: 'bg-rose-50 text-rose-700 ring-rose-100',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  };

  return (
    <article className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)]/84 px-4 py-3 shadow-[0_14px_34px_rgba(15,31,51,0.055)] backdrop-blur transition-colors hover:bg-[var(--color-surface)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">{title}</p>
          {loading ? (
            <div className="mt-1.5 h-7 w-12 animate-pulse rounded-md bg-[var(--color-surface-muted)]" />
          ) : (
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </article>
  );
}

function ActionCard({ label, href, icon: Icon, primary = false }: ActionCardProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-[26px] border px-4 py-3 shadow-[0_12px_28px_rgba(15,31,51,0.045)] transition-all hover:-translate-y-0.5 ${
        primary
          ? 'border-blue-700/20 bg-[var(--color-accent)] text-white'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]/84 text-[var(--color-text)] hover:bg-[var(--color-surface)]'
      }`}
    >
      <span className="inline-flex items-center gap-2.5 text-sm font-medium">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
            primary ? 'bg-[var(--color-surface)]/15' : 'bg-[var(--color-surface-muted)] text-[var(--color-accent)]'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${primary ? 'text-white/90' : 'text-[var(--color-text-soft)]'}`} />
    </Link>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-[var(--color-surface-muted)]/86 px-3 py-2">
      <span className="text-[13px] text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function QuickLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border bg-[var(--color-surface-muted)]/86 px-3 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)]"
    >
      {children}
      <ArrowRight className="h-4 w-4 text-[var(--color-text-soft)]" />
    </Link>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid grid-cols-12 items-center px-5 py-3">
          <div className="col-span-1 mx-auto h-3 w-4 animate-pulse rounded bg-[var(--color-surface-muted)]" />
          <div className="col-span-5 space-y-1">
            <div className="h-3.5 w-2/5 animate-pulse rounded bg-[var(--color-surface-muted)]" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-[var(--color-surface-muted)]" />
          </div>
          <div className="col-span-2 mx-auto h-3 w-14 animate-pulse rounded bg-[var(--color-surface-muted)]" />
          <div className="col-span-2 mx-auto h-3 w-12 animate-pulse rounded bg-[var(--color-surface-muted)]" />
          <div className="col-span-2 ml-auto h-5 w-16 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
        </div>
      ))}
    </>
  );
}
