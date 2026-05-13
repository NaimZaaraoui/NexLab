'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ThermometerSnowflake } from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { TemperatureEditModal } from '@/components/temperature/TemperatureEditModal';
import { TemperatureHistoryChart } from '@/components/temperature/TemperatureHistoryChart';
import { TemperatureHistoryHeader } from '@/components/temperature/TemperatureHistoryHeader';
import { TemperatureInvalidateModal } from '@/components/temperature/TemperatureInvalidateModal';
import { TemperatureReadingsTable } from '@/components/temperature/TemperatureReadingsTable';
import type { Instrument, TemperatureReading } from '@/components/temperature/types';
import { useDirectPrint } from '@/lib/hooks/useDirectPrint';

type InstrumentResponse = {
  instrument: Instrument;
  readings: TemperatureReading[];
  month: string;
};

export default function TemperatureHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status, data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';
  const canEdit = role === 'ADMIN' || role === 'TECHNICIEN';
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<InstrumentResponse | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editing, setEditing] = useState<TemperatureReading | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editMeasuredAt, setEditMeasuredAt] = useState('');
  const [editCorrectiveAction, setEditCorrectiveAction] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [invalidateReading, setInvalidateReading] = useState<TemperatureReading | null>(null);
  const [invalidateReason, setInvalidateReason] = useState('');
  const [savingInvalidate, setSavingInvalidate] = useState(false);
  const { printUrl } = useDirectPrint();

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/temperature/${id}?month=${month}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Erreur lors du chargement.');
      }
      setData(json as InstrumentResponse);
    } catch (error) {
      console.error('Temperature history error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [id, month, showNotification]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, loadData]);

  const readings = data?.readings ?? [];

  const csvHref = useMemo(() => {
    if (!data) return '#';
    return `/api/temperature/${id}?month=${month}&format=csv`;
  }, [data, id, month]);

  const printHref = useMemo(() => {
    return `/dashboard/temperature/${id}/print?month=${month}`;
  }, [id, month]);

  const openEdit = (reading: TemperatureReading) => {
    setEditing(reading);
    setEditValue(String(reading.value));
    setEditMeasuredAt(reading.measuredAt.slice(0, 16));
    setEditCorrectiveAction(reading.correctiveAction || '');
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;

    setSavingEdit(true);
    try {
      const response = await fetch(`/api/temperature/readings/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          value: Number(editValue),
          measuredAt: editMeasuredAt ? new Date(editMeasuredAt).toISOString() : undefined,
          correctiveAction: editCorrectiveAction || undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Erreur lors de la mise à jour');
      }
      showNotification('success', 'Relevé mis à jour');
      setEditing(null);
      await loadData();
    } catch (error) {
      console.error('Temperature edit error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleInvalidate = async (reading: TemperatureReading) => {
    setInvalidateReading(reading);
    setInvalidateReason('');
  };

  const confirmInvalidate = async () => {
    if (!invalidateReading || !invalidateReason.trim()) return;

    setSavingInvalidate(true);
    try {
      const response = await fetch(`/api/temperature/readings/${invalidateReading.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalidate', reason: invalidateReason.trim() }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Erreur lors de l’annulation');
      }
      showNotification('success', 'Relevé annulé');
      setInvalidateReading(null);
      setInvalidateReason('');
      await loadData();
    } catch (error) {
      console.error('Temperature invalidate error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de l’annulation');
    } finally {
      setSavingInvalidate(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <TemperatureHistoryHeader
          instrumentName={data?.instrument.name}
          month={month}
          csvHref={csvHref}
          onMonthChange={setMonth}
          onRefresh={loadData}
          onPrint={() => printUrl(printHref)}
        />
      </section>

      {data && (
        <section className="bento-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="h-5 w-5 text-[var(--color-text-secondary)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text)]">Plage cible</h2>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {data.instrument.targetMin}{data.instrument.unit} → {data.instrument.targetMax}{data.instrument.unit}
              </p>
              {data.instrument.location && (
                <p className="mt-1 text-xs text-[var(--color-text-soft)]">Emplacement: {data.instrument.location}</p>
              )}
            </div>
            <div className="rounded-md border bg-[var(--color-surface)] px-4 py-3 text-xs text-[var(--color-text-soft)]">
              {readings.length} relevé(s) sur la période
            </div>
          </div>

          <div className="mt-5 rounded-md border bg-[var(--color-surface)] p-4">
            <TemperatureHistoryChart
              readings={readings}
              min={data.instrument.targetMin}
              max={data.instrument.targetMax}
              unit={data.instrument.unit}
            />
          </div>
        </section>
      )}

      <TemperatureReadingsTable
        readings={readings}
        instrument={data?.instrument || null}
        loading={loading}
        canEdit={canEdit}
        onEdit={openEdit}
        onInvalidate={handleInvalidate}
      />

      <TemperatureEditModal
        reading={editing}
        value={editValue}
        measuredAt={editMeasuredAt}
        correctiveAction={editCorrectiveAction}
        saving={savingEdit}
        onClose={() => setEditing(null)}
        onSubmit={handleSaveEdit}
        onValueChange={setEditValue}
        onMeasuredAtChange={setEditMeasuredAt}
        onCorrectiveActionChange={setEditCorrectiveAction}
      />

      <TemperatureInvalidateModal
        reading={invalidateReading}
        reason={invalidateReason}
        saving={savingInvalidate}
        onClose={() => setInvalidateReading(null)}
        onConfirm={confirmInvalidate}
        onReasonChange={setInvalidateReason}
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
