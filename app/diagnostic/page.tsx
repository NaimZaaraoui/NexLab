'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  FileText, 
  Settings, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Clock,
  HardDrive,
  Shield
} from 'lucide-react';

interface DiagnosticCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
  path?: string;
  users?: number;
  patients?: number;
  analyses?: number;
  tests?: number;
  settings?: number;
  size_mb?: number;
  size_bytes?: number;
  backup_count?: number;
  latest_backup?: { size_mb: number } | null;
  lab_name?: string;
  lab_bio?: string;
  node_version?: string;
  platform?: string;
  next_version?: string;
  exists?: boolean;
}

interface DiagnosticData {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'error';
  checks: DiagnosticCheck[];
}

const STATUS_COLORS = {
  ok: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
};

const STATUS_ICONS = {
  ok: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
};

export default function DiagnosticPage() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function fetchDiagnostics() {
    setLoading(true);
    try {
      const res = await fetch('/api/diagnostic');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  function formatTimestamp(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  const overallStatus = data?.status || 'loading';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">Diagnostic Système</h1>
            <p className="text-sm text-[var(--color-text-soft)]">Vérification de l&apos;état du système</p>
          </div>
        </div>
        
        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-muted)] hover:bg-slate-200 rounded-xl transition-colors text-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {lastRefresh && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-soft)]">
          <Clock className="w-4 h-4" />
          Dernière vérification: {lastRefresh.toLocaleTimeString('fr-FR')}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
        </div>
      ) : (
        <>
          <div className={`p-4 rounded-2xl flex items-center gap-3 ${
            overallStatus === 'healthy' ? 'bg-green-50 border border-green-200' :
            overallStatus === 'degraded' ? 'bg-amber-50 border border-amber-200' :
            'bg-red-50 border border-red-200'
          }`}>
            {overallStatus === 'healthy' ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : overallStatus === 'degraded' ? (
              <AlertCircle className="w-6 h-6 text-amber-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <p className={`font-medium ${
                overallStatus === 'healthy' ? 'text-green-800' :
                overallStatus === 'degraded' ? 'text-amber-800' :
                'text-red-800'
              }`}>
                Système {overallStatus === 'healthy' ? 'opérationnel' : overallStatus === 'degraded' ? 'dégradé' : 'en erreur'}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {overallStatus === 'healthy' 
                  ? 'Tous les composants fonctionnent correctement'
                  : overallStatus === 'degraded'
                  ? ' Certains composants nécessitent attention'
                  : 'Des erreurs ont été détectées'}
              </p>
            </div>
          </div>

          {data?.timestamp && (
            <p className="text-sm text-[var(--color-text-soft)] text-right">
              Vérifié le {formatTimestamp(data.timestamp)}
            </p>
          )}

          <div className="grid gap-4">
            {data?.checks.map((check, idx) => {
              const checkStatus = check.status || 'warning';
              const Icon = STATUS_ICONS[checkStatus] || Activity;
              return (
                <div 
                  key={idx}
                  className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)] shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 ${STATUS_COLORS[checkStatus]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--color-text)] capitalize">
                        {check.name.replace(/_/g, ' ')}
                      </h3>
                      
                      {check.message && (
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{check.message}</p>
                      )}
                      
                      {checkStatus === 'ok' && check.path && (
                        <p className="text-sm text-[var(--color-text-soft)] mt-1 font-mono">{String(check.path)}</p>
                      )}
                      
                      {checkStatus === 'ok' && (
                        <div className="flex flex-wrap gap-4 mt-2">
                          {check.users != null && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Shield className="w-4 h-4 text-slate-400" />
                              <span className="text-[var(--color-text-secondary)]">{String(check.users)} utilisateurs</span>
                            </div>
                          )}
                          {check.patients != null && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Database className="w-4 h-4 text-slate-400" />
                              <span className="text-[var(--color-text-secondary)]">{String(check.patients)} patients</span>
                            </div>
                          )}
                          {check.analyses != null && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-[var(--color-text-secondary)]">{String(check.analyses)} analyses</span>
                            </div>
                          )}
                          {check.tests != null && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Activity className="w-4 h-4 text-slate-400" />
                              <span className="text-[var(--color-text-secondary)]">{String(check.tests)} analyses définies</span>
                            </div>
                          )}
                          {check.size_mb != null && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <HardDrive className="w-4 h-4 text-slate-400" />
                              <span className="text-[var(--color-text-secondary)]">{String(check.size_mb)} MB</span>
                            </div>
                          )}
                          {check.backup_count != null && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-[var(--color-text-secondary)]">{String(check.backup_count)} sauvegardes</span>
                            </div>
                          )}
                          {check.lab_name && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Settings className="w-4 h-4 text-slate-400" />
                              <span className="text-[var(--color-text-secondary)]">{String(check.lab_name)}</span>
                            </div>
                          )}
                          {check.node_version && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Server className="w-4 h-4 text-slate-400" />
                              <span className="text-[var(--color-text-secondary)]">Node {String(check.node_version)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}