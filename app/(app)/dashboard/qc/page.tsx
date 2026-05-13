'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, ShieldAlert, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { QcEntryModal } from '@/components/qc/QcEntryModal';
import { QcMaterialCard } from '@/components/qc/QcMaterialCard';
import { QcSummaryCard } from '@/components/qc/QcSummaryCard';
import type { QcLot, QcMaterial, TodaySummary } from '@/components/qc/types';
import { NotificationToast } from '@/components/ui/notification-toast';

export default function QcDashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';
  const canWrite = ['ADMIN', 'TECHNICIEN'].includes(role);
  const isAdmin = role === 'ADMIN';

  const [materials, setMaterials] = useState<QcMaterial[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<QcLot | null>(null);
  const [showEntry, setShowEntry] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [comment, setComment] = useState('');
  const [instrumentName, setInstrumentName] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatQcNumber = (value: number) => {
    if (!Number.isFinite(value)) return '--';
    return value.toFixed(2);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [materialsRes, todayRes] = await Promise.all([
        fetch('/api/qc', { cache: 'no-store' }),
        fetch('/api/qc/today', { cache: 'no-store' }),
      ]);

      const [materialsData, todayData] = await Promise.all([materialsRes.json(), todayRes.json()]);

      if (materialsRes.ok) {
        setMaterials(materialsData);
      }
      if (todayRes.ok) {
        setTodaySummary(todayData);
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors du chargement du contrôle qualité');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const modeSummary = useMemo(() => {
    return materials.reduce(
      (acc, material) => {
        material.lots.forEach((lot) => {
          lot.targets.forEach((target) => {
            if (target.controlMode === 'STATISTICAL') {
              acc.statistical += 1;
            } else {
              acc.acceptance += 1;
            }
          });
        });
        return acc;
      },
      { statistical: 0, acceptance: 0 }
    );
  }, [materials]);

  const overallLabel = useMemo(() => {
    if (!todaySummary) return 'Chargement...';
    if (todaySummary.fail > 0) return `${todaySummary.fail} échec(s)`;
    if (todaySummary.missing > 0) return `${todaySummary.missing} non effectué(s)`;
    if (todaySummary.warn > 0) return `${todaySummary.warn} avertissement(s)`;
    return 'Tous conformes';
  }, [todaySummary]);

  const openEntry = (lot: QcLot) => {
    setSelectedLot(lot);
    setComment('');
    setInstrumentName('');
    setValues(
      Object.fromEntries(
        lot.targets.map((target) => [target.testCode, ''])
      )
    );
    setShowEntry(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLot) return;

    const payload = {
      instrumentName: instrumentName.trim() || null,
      comment: comment.trim() || null,
      values: selectedLot.targets
        .map((target) => ({
          testCode: target.testCode,
          measured: Number(values[target.testCode]),
        }))
        .filter((value) => Number.isFinite(value.measured)),
    };

    const res = await fetch(`/api/qc/lots/${selectedLot.id}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la saisie QC');
      return;
    }

    setShowEntry(false);
    showNotification(
      data.status === 'fail' ? 'error' : 'success',
      data.status === 'fail' ? 'Contrôle rejeté' : data.status === 'warn' ? 'Contrôle enregistré avec avertissement' : 'Contrôle conforme'
    );
    await loadData();
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Contrôle Qualité</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Suivi quotidien des contrôles, lots actifs, suivi statistique et plages d’acceptation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`status-pill ${todaySummary?.fail ? 'status-pill-error' : todaySummary?.missing || todaySummary?.warn ? 'status-pill-warning' : 'status-pill-success'}`}>
              {overallLabel}
            </span>
            {isAdmin && (
              <Link href="/dashboard/qc/config" className="btn-secondary-md">
                <Plus className="h-4 w-4" />
                Configurer
              </Link>
            )}
          </div>
        </div>
      </section>

      {todaySummary && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QcSummaryCard label="Conformes" value={todaySummary.allPass ? 'Oui' : 'Non'} icon={ShieldAlert} tone="success" />
          <QcSummaryCard label="Manquants" value={String(todaySummary.missing)} icon={TriangleAlert} tone="warning" />
          <QcSummaryCard label="Avertissements" value={String(todaySummary.warn)} icon={AlertCircle} tone="warning" />
          <QcSummaryCard label="Échecs" value={String(todaySummary.fail)} icon={ShieldAlert} tone="critical" />
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Cibles statistiques</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{modeSummary.statistical}</div>
          <div className="mt-2 text-sm text-[var(--color-text-soft)]">Cibles suivies avec SD, z-score et règles Westgard.</div>
        </div>
        <div className="rounded-xl border bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">Cibles par plage</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{modeSummary.acceptance}</div>
          <div className="mt-2 text-sm text-[var(--color-text-soft)]">Cibles validées par plage d’acceptation min/max.</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {loading && Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-card h-[220px]" />)}
        {!loading && materials.map((material) => <QcMaterialCard key={material.id} material={material} canWrite={canWrite} onOpenEntry={openEntry} />)}
      </section>

      <QcEntryModal
        selectedLot={selectedLot}
        showEntry={showEntry}
        comment={comment}
        instrumentName={instrumentName}
        values={values}
        formatQcNumber={formatQcNumber}
        onClose={() => setShowEntry(false)}
        onSubmit={handleSubmit}
        onCommentChange={setComment}
        onInstrumentNameChange={setInstrumentName}
        onValueChange={(testCode, value) => setValues((prev) => ({ ...prev, [testCode]: value }))}
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
