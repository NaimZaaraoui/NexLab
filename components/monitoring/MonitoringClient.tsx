'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Server, Database, HardDrive, Shield, RefreshCw } from 'lucide-react';
import { type LogEntry } from '@/lib/logger';

export function MonitoringClient() {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [diagRes, logsRes] = await Promise.all([
        fetch('/api/diagnostic'),
        fetch('/api/monitoring/logs')
      ]);

      if (diagRes.ok) {
        const diagData = await diagRes.json();
        setDiagnostic(diagData);
      }
      
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch monitoring data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getSystemMemoryStr = () => {
    if (!diagnostic?.checks) return '--';
    const sys = diagnostic.checks.find((c: any) => c.name === 'system_metrics');
    if (!sys) return '--';
    return `${sys.memory.heap_used_mb} MB / ${sys.memory.rss_mb} MB (RSS)`;
  };

  const getCpuStr = () => {
    if (!diagnostic?.checks) return '--';
    const sys = diagnostic.checks.find((c: any) => c.name === 'system_metrics');
    if (!sys) return '--';
    return `Load: ${sys.load_avg.toFixed(2)} (${sys.cpus} Cores)`;
  };

  const getDbStatus = () => {
    if (!diagnostic?.checks) return '--';
    const db = diagnostic.checks.find((c: any) => c.name === 'database');
    return db?.status === 'ok' ? 'Connecté (Healthy)' : 'Erreur';
  };

  const getBackupStatus = () => {
    if (!diagnostic?.checks) return '--';
    const bck = diagnostic.checks.find((c: any) => c.name === 'backups');
    return bck?.status === 'ok' 
      ? `${bck.backup_count} archives détectées` 
      : 'Aucun backup ou warning';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Observabilité & Monitoring
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Surveillez la santé de votre serveur, de la base de données et consultez les journaux système en temps réel.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {diagnostic?.status === 'degraded' && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-xl text-sm font-medium">
          ⚠️ Le système fonctionne en mode dégradé (une vérification critique a échouée).
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Memory Widget */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
             <Server className="w-5 h-5 text-indigo-500" />
             <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">Serveur (Node.js)</h3>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex justify-between">
               <span>Mem:</span> <span>{getSystemMemoryStr()}</span>
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 flex justify-between">
               <span>CPU:</span> <span>{getCpuStr()}</span>
            </p>
          </div>
        </div>

        {/* Database Widget */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
             <Database className="w-5 h-5 text-emerald-500" />
             <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">Base Sqlite</h3>
          </div>
          <div className="space-y-1">
             <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex justify-between">
               <span>Prisma:</span> <span className="text-emerald-500">{getDbStatus()}</span>
             </p>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 flex justify-between">
               <span>Ping API:</span> <span>{diagnostic?.endpointLatencyMs || '--'} ms</span>
             </p>
          </div>
        </div>

        {/* Disk & Backups */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
             <HardDrive className="w-5 h-5 text-amber-500" />
             <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">Local Backups</h3>
          </div>
          <div className="space-y-1">
             <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
               {getBackupStatus()}
             </p>
             <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
               Disque: vérification locale activée.
             </p>
          </div>
        </div>
        
        {/* Security State */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
             <Shield className="w-5 h-5 text-rose-500" />
             <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">Sécurité Node</h3>
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 font-medium leading-relaxed">
             ✓ Proxy Headers (CSP/HSTS)<br/>
             ✓ Rate Limiting (API)<br/>
             ✓ Strict Session Idle
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[600px]">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
           <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
             <Activity className="w-4 h-4" />
             Journaux Système (Tail Logs)
           </h3>
           <span className="text-xs text-zinc-500">Mise à jour: {lastUpdate.toLocaleTimeString()}</span>
        </div>
        <div className="p-4 flex-1">
           <div className="bg-[#0D1117] h-full rounded-xl p-4 overflow-y-auto font-mono text-xs w-full shadow-inner custom-scrollbar relative">
             {logs.length === 0 ? (
               <div className="text-zinc-500 italic">Aucun log récent détecté dans le système.</div>
             ) : (
               <div className="space-y-1 w-full">
                 {logs.map((log, index) => (
                   <div key={index} className="flex gap-3 hover:bg-zinc-800/50 px-1 py-0.5 rounded transition-colors w-full">
                     <span className="text-zinc-500 shrink-0">
                       {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                     </span>
                     <span className={`shrink-0 font-semibold w-12 ${
                       log.level === 'INFO' ? 'text-blue-400' :
                       log.level === 'WARN' ? 'text-amber-400' :
                       log.level === 'ERROR' ? 'text-red-400' : 'text-purple-400'
                     }`}>
                       [{log.level}]
                     </span>
                     <span className="text-zinc-300 flex-1 break-all">
                       {log.message}
                       {log.context?.error && (
                         <div className="text-red-400 mt-1 pl-4 border-l border-red-900/50">
                           {log.context.error.message}
                         </div>
                       )}
                     </span>
                     {log.context?.sys?.memRss && (
                       <span className="text-zinc-600 shrink-0 text-[10px]">
                         {log.context.sys.memRss}
                       </span>
                     )}
                   </div>
                 ))}
               </div>
             )}
             
             {/* Gradient overlay for terminal feel */}
             <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0D1117] to-transparent"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
