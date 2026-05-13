'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Archive, Search, RefreshCw, Download, X } from 'lucide-react';
import { PageBackLink } from '@/components/ui/PageBackLink';

type AuditArchiveItem = {
  id: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  archivedAt: string;
};

type AuditArchiveResponse = {
  items: AuditArchiveItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function AuditArchivePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AuditArchiveResponse | null>(null);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [severity, setSeverity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditArchiveItem | null>(null);

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
        limit: '25',
      });
      if (query.trim()) params.set('query', query.trim());
      if (action) params.set('action', action);
      if (entity) params.set('entity', entity);
      if (severity) params.set('severity', severity);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const response = await fetch(`/api/audit-logs/archive?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load');
      const json = (await response.json()) as AuditArchiveResponse;
      setData(json);
    } catch (error) {
      console.error('Audit archive fetch error:', error);
      setData({ items: [], total: 0, page: 1, limit: 25, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [action, entity, from, page, query, severity, to]);

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
    if (entity) params.set('entity', entity);
    if (severity) params.set('severity', severity);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('format', 'csv');
    return `/api/audit-logs/archive?${params.toString()}`;
  }, [action, entity, from, query, severity, to]);

  const severityBadgeClass = (level: string) => {
    if (level === 'CRITICAL') return 'status-pill status-pill-error';
    if (level === 'WARN') return 'status-pill status-pill-warning';
    return 'status-pill status-pill-info';
  };

  const formatDetails = (value: string | null) => {
    if (!value) return 'Aucun détail.';
    try {
      const parsed = JSON.parse(value) as unknown;
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
        <PageBackLink href="/dashboard/settings/audit" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Archives d&apos;audit</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Événements archivés selon la politique de rétention.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-[var(--color-text-secondary)] lg:flex">
            <Archive className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Mode archive</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-[var(--color-surface)] p-5 shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="xl:col-span-2">
            <span className="form-label mb-1.5">Recherche</span>
            <div className="input-premium flex h-11 items-center gap-2">
              <Search size={16} className="text-[var(--color-text-soft)]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Utilisateur, action, ID..." className="w-full border-none bg-transparent outline-none" />
            </div>
          </label>
          <label>
            <span className="form-label mb-1.5">Action</span>
            <input value={action} onChange={(e) => setAction(e.target.value)} className="input-premium h-11" placeholder="ex: user.create" />
          </label>
          <label>
            <span className="form-label mb-1.5">Entité</span>
            <input value={entity} onChange={(e) => setEntity(e.target.value)} className="input-premium h-11" placeholder="ex: user" />
          </label>
          <label>
            <span className="form-label mb-1.5">Criticité</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input-premium h-11">
              <option value="">Toutes</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
          <label>
            <span className="form-label mb-1.5">Du</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-premium h-11" />
          </label>
          <label>
            <span className="form-label mb-1.5">Au</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-premium h-11" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
          <button onClick={() => { setPage(1); fetchLogs(); }} className="btn-secondary-sm bg-slate-900 text-white hover:bg-slate-800">
            <Search size={16} />
            Filtrer
          </button>
          <button
            onClick={() => { setQuery(''); setAction(''); setEntity(''); setSeverity(''); setFrom(''); setTo(''); setPage(1); fetchLogs(); }}
            className="btn-secondary-sm"
          >
            <RefreshCw size={16} />
            Réinitialiser
          </button>
          <a href={csvExportHref} className="btn-secondary-sm">
            <Download size={16} />
            Export CSV
          </a>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-[var(--color-surface)] shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px]">
            <thead>
              <tr className="border-b bg-[var(--color-surface-muted)] text-left">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Date</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Archivé le</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Criticité</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Utilisateur</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Action</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--color-text-soft)]">Chargement...</td></tr>}
              {!loading && visibleItems.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--color-text-soft)]">Aucune archive trouvée.</td></tr>}
              {!loading && visibleItems.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--color-surface-muted)]/60">
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{new Date(item.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-soft)]">{new Date(item.archivedAt).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-xs"><span className={severityBadgeClass(item.severity)}>{item.severity}</span></td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                    <div className="font-semibold text-[var(--color-text)]">{item.userName || 'Système'}</div>
                    <div>{item.userEmail || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text)]">{item.action}</td>
                  <td className="max-w-[340px] px-4 py-3 text-xs text-[var(--color-text-soft)]">
                    <div className="truncate">{detailsPreview(item.details)}</div>
                    {item.details && (
                      <button onClick={() => setSelectedLog(item)} className="mt-1 text-[11px] font-semibold text-[var(--color-text)] hover:text-[var(--color-text-secondary)] hover:underline">
                        Voir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-soft)]">Total: <span className="font-semibold text-[var(--color-text)]">{data?.total ?? 0}</span></p>
        <div className="flex items-center gap-2">
          <button className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</button>
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Page {page} / {totalPages}</span>
          <button className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suivant</button>
        </div>
      </div>

      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-shell w-full max-w-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text)]">Détails archive</h3>
                <p className="mt-1 text-xs text-[var(--color-text-soft)]">{new Date(selectedLog.createdAt).toLocaleString('fr-FR')} • {selectedLog.action}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-[var(--color-surface-muted)] text-[var(--color-text-soft)] hover:text-[var(--color-text)]" aria-label="Fermer">
                <X size={16} />
              </button>
            </div>
            <div className="rounded-xl border bg-[var(--color-surface-muted)] p-4">
              <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words text-xs text-[var(--color-text-secondary)]">{formatDetails(selectedLog.details)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
