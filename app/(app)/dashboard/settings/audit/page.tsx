'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useSession } from 'next-auth/react';
import { ShieldCheck, Archive } from 'lucide-react';
import { AuditFiltersPanel } from '@/components/audit/AuditFiltersPanel';
import { AuditLogDetailsModal } from '@/components/audit/AuditLogDetailsModal';
import { AuditLogsTable } from '@/components/audit/AuditLogsTable';
import type { AuditItem, AuditResponse } from '@/components/audit/types';
import { PageBackLink } from '@/components/ui/PageBackLink';

export default function AuditLogsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [entity, setEntity] = useState('');
  const [severity, setSeverity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useLocalStorageState<number>('audit:pageSize', 25);
  const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null);
  const [retentionDays, setRetentionDays] = useState('730');
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionMessage, setRetentionMessage] = useState('');

  const role = session?.user?.role;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && role !== 'ADMIN') router.push('/');
  }, [status, role, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query.trim()) params.set('query', query.trim());
      if (action) params.set('action', action);
      if (moduleName) params.set('module', moduleName);
      if (entity) params.set('entity', entity);
      if (severity) params.set('severity', severity);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const response = await fetch(`/api/audit-logs?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load');
      const json = (await response.json()) as AuditResponse;
      setData(json);
    } catch (error) {
      console.error('Audit logs fetch error:', error);
      setData({ items: [], total: 0, page: 1, limit: pageSize, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [action, entity, from, moduleName, page, pageSize, query, severity, to]);

  useEffect(() => {
    if (status === 'authenticated' && role === 'ADMIN') {
      fetchLogs();
    }
  }, [status, role, fetchLogs]);

  const visibleItems = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const detailsPreview = useMemo(() => {
    return (value: string | null) => {
      if (!value) return '—';
      return value.length > 100 ? `${value.slice(0, 100)}...` : value;
    };
  }, []);

  const csvExportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query.trim());
    if (action) params.set('action', action);
    if (moduleName) params.set('module', moduleName);
    if (entity) params.set('entity', entity);
    if (severity) params.set('severity', severity);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('format', 'csv');
    return `/api/audit-logs?${params.toString()}`;
  }, [action, entity, from, moduleName, query, severity, to]);

  const severityBadgeClass = (level: string) => {
    if (level === 'CRITICAL') return 'status-pill status-pill-error';
    if (level === 'WARN') return 'status-pill status-pill-warning';
    return 'status-pill status-pill-info';
  };

  const applyRetention = async () => {
    setRetentionLoading(true);
    setRetentionMessage('');
    try {
      const response = await fetch('/api/audit-logs/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays: Number(retentionDays || '730') }),
      });
      const payload = (await response.json()) as { archived?: number; deleted?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Échec rétention');
      setRetentionMessage(`Archivage OK: ${payload.archived ?? 0} archivés, ${payload.deleted ?? 0} purgés.`);
      fetchLogs();
    } catch (error) {
      setRetentionMessage(error instanceof Error ? error.message : 'Erreur rétention');
    } finally {
      setRetentionLoading(false);
    }
  };

  const renderDetails = (value: string | null) => {
    if (!value) return 'Aucun détail.';
    try {
      const parsed = JSON.parse(value);
      
      // Visualisation spéciale pour les deltas (modifications de résultats)
      if (parsed.deltas && typeof parsed.deltas === 'object') {
        const tests = Object.keys(parsed.deltas);
        return (
          <div className="flex flex-col gap-2 font-sans">
            {tests.map(testCode => {
              const { oldValue, newValue } = parsed.deltas[testCode];
              return (
                <div key={testCode} className="inline-flex w-fit items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm">
                  <span className="font-bold text-slate-700">{testCode}:</span>
                  <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-slate-500 line-through">{oldValue || 'vide'}</span>
                  <span className="text-slate-500">➔</span>
                  <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 font-bold text-slate-700">{newValue || 'vide'}</span>
                </div>
              );
            })}
          </div>
        );
      }
      
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-2xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
        <PageBackLink href="/dashboard/settings" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Journal d&apos;audit</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Historique des actions critiques réalisées dans le système.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/settings/audit/archive')}
              className="btn-secondary-sm"
            >
              <Archive size={14} />
              Archives
            </button>
            <div className="hidden items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-[var(--color-text-secondary)] lg:flex">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Traçabilité active</span>
            </div>
          </div>
        </div>
      </section>

      <AuditFiltersPanel
        query={query}
        action={action}
        moduleName={moduleName}
        entity={entity}
        severity={severity}
        from={from}
        to={to}
        pageSize={pageSize}
        csvExportHref={csvExportHref}
        onQueryChange={setQuery}
        onActionChange={setAction}
        onModuleNameChange={setModuleName}
        onEntityChange={setEntity}
        onSeverityChange={setSeverity}
        onFromChange={setFrom}
        onToChange={setTo}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        onFilter={() => {
          setPage(1);
          fetchLogs();
        }}
        onReset={() => {
          setQuery('');
          setAction('');
          setModuleName('');
          setEntity('');
          setSeverity('');
          setFrom('');
          setTo('');
          setPage(1);
          fetchLogs();
        }}
      />

      <section className="rounded-2xl border bg-[var(--color-surface)] p-5 shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Rétention et archivage</h3>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Les logs plus anciens que la période choisie sont déplacés vers l&apos;archive puis retirés de la table active.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--color-border)] pt-4">
          <label>
            <span className="form-label mb-1.5">Conserver (jours)</span>
            <input
              type="number"
              min={30}
              max={3650}
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="input-premium h-11 w-40"
            />
          </label>
          <button
            onClick={applyRetention}
            disabled={retentionLoading}
            className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retentionLoading ? 'Traitement...' : 'Appliquer la rétention'}
          </button>
          {retentionMessage && <span className="text-xs text-[var(--color-text-secondary)]">{retentionMessage}</span>}
        </div>
      </section>

      <AuditLogsTable
        loading={loading}
        visibleItems={visibleItems}
        detailsPreview={detailsPreview}
        severityBadgeClass={severityBadgeClass}
        onSelectLog={setSelectedLog}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-secondary)]">
          Total: <span className="font-semibold text-[var(--color-text)]">{data?.total ?? 0}</span>
          {data && data.total > 0 && (
            <>
              {' '}
              • Affichage{' '}
              <span className="font-semibold text-[var(--color-text)]">
                {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.total)}
              </span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </button>
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
            Page {page} / {totalPages}
          </span>
          <button
            className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </button>
        </div>
      </div>

      <AuditLogDetailsModal
        selectedLog={selectedLog}
        detailsContent={selectedLog ? renderDetails(selectedLog.details) : ''}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
