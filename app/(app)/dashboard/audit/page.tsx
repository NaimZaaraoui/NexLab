'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Loader2, ChevronLeft, ChevronRight, Activity, Calendar, History } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AuditLog {
  id: string;
  userName: string | null;
  userRole: string | null;
  action: string;
  severity: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(''); // YYYY-MM-DD
  
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [page, severityFilter, dateFilter]); // Query is handled separately via debounce

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 0) {
        setPage(0); // This will trigger fetchLogs via the other effect
      } else {
        fetchLogs();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(), // api/audit-logs expects 1-indexed page
        limit: limit.toString(),
      });
      if (query) params.append('query', query);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);
      if (dateFilter) {
        params.append('from', dateFilter); // api/audit-logs expects 'from' and 'to'
        params.append('to', dateFilter);
      }

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.items); // api/audit-logs returns 'items' instead of 'logs'
        setTotalCount(data.total); // api/audit-logs returns 'total' instead of 'totalCount'
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return <span className="status-pill status-pill-error">Critique</span>;
      case 'WARN': return <span className="status-pill status-pill-warning">Alerte</span>;
      default: return <span className="status-pill status-pill-info">Info</span>;
    }
  };

  const formatAction = (action: string) => {
    const map: Record<string, string> = {
      'analysis.results_save': 'Saisie de résultats',
      'analysis.create': 'Création d\'analyse',
      'analysis.tests_update': 'Modification des tests',
      'patient.create': 'Nouveau patient',
      'user.login': 'Connexion',
    };
    return map[action] || action;
  };

  const renderDetails = (detailsStr: string | null) => {
    if (!detailsStr) return null;
    try {
      const parsed = JSON.parse(detailsStr);
      
      // Specially render deltas (oldValue -> newValue)
      if (parsed.deltas && typeof parsed.deltas === 'object') {
        const tests = Object.keys(parsed.deltas);
        return (
          <div className="mt-1 space-y-1">
            {tests.map(testCode => {
              const { oldValue, newValue } = parsed.deltas[testCode];
              return (
                <div key={testCode} className="text-[10px] font-mono bg-[var(--color-surface-muted)] px-2 py-1 rounded inline-block mr-2 border">
                  <span className="font-bold text-slate-700">{testCode}:</span>{' '}
                  <span className="text-rose-600 line-through mr-1">{oldValue || 'vide'}</span> 
                  <span className="text-slate-400">→</span>{' '}
                  <span className="text-emerald-600 font-bold ml-1">{newValue || 'vide'}</span>
                </div>
              );
            })}
          </div>
        );
      }
      
      return (
        <pre className="text-[10px] bg-[var(--color-surface-muted)] p-1.5 rounded border text-[var(--color-text-secondary)] mt-1 max-w-full overflow-x-auto">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <div className="text-[10px] text-[var(--color-text-soft)] mt-1">{detailsStr}</div>;
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] flex items-center gap-2">
          <ShieldAlert className="text-[var(--color-accent)]" />
          Audit & Traçabilité
        </h1>
        <p className="text-sm text-[var(--color-text-soft)]">
          Historique immuable de toutes les actions, modifications et accès au système.
        </p>
      </div>

      <div className="app-content flex-1 flex flex-col min-h-0 !p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-[var(--color-border)] p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--color-surface)]">
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Chercher user, entité, action..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-premium pl-9 h-10 w-full"
            />
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="input-premium h-10 min-w-[130px]"
            >
              <option value="ALL">Toutes sévérités</option>
              <option value="INFO">Info</option>
              <option value="WARN">Alerte</option>
              <option value="CRITICAL">Critique</option>
            </select>
            
            <div className="relative shrink-0">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="date"
                 value={dateFilter}
                 onChange={(e) => setDateFilter(e.target.value)}
                 className="input-premium h-10 pl-9 w-40"
               />
               {dateFilter && (
                 <button 
                    onClick={() => setDateFilter('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs px-1"
                 >
                   x
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-[var(--color-surface-muted)]/30">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-[var(--color-surface-muted)]/80  text-xs uppercase tracking-wider text-[var(--color-text-soft)] shadow-sm z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & Heure</th>
                <th className="px-6 py-4 font-semibold">Utilisateur</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Entité (ID)</th>
                <th className="px-6 py-4 font-semibold">Sévérité</th>
                <th className="px-6 py-4 font-semibold min-w-[200px]">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-64 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-64 text-center">
                    <div className="empty-state border-none shadow-none bg-transparent">
                      <div className="empty-state-icon">
                        <History className="w-6 h-6" />
                      </div>
                      <h3 className="empty-state-title">Aucun log trouvé</h3>
                      <p className="empty-state-text">Vérifiez vos filtres de recherche.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-semibold text-slate-700">
                        {format(new Date(log.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {format(new Date(log.createdAt), 'HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[var(--color-text)]">{log.userName || 'Système'}</span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                          {log.userRole || 'AUTO'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold">{formatAction(log.action)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{log.action}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-semibold capitalize text-slate-700">{log.entity}</div>
                      <div className="text-[10px] text-slate-400 font-mono" title={log.entityId || ''}>
                        {log.entityId ? `${log.entityId.slice(-8)}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="px-6 py-3 max-w-sm overflow-hidden text-ellipsis whitespace-normal">
                      {renderDetails(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="border-t border-[var(--color-border)] p-4 flex items-center justify-between bg-[var(--color-surface)]">
          <span className="text-sm font-medium text-[var(--color-text-soft)]">
            Affichage de {logs.length} sur {totalCount} logs
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary-sm !px-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex items-center justify-center min-w-[32px] text-sm font-bold text-slate-700">
              {page + 1}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="btn-secondary-sm !px-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
