'use client';

import { History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DatabaseAuditItem } from './types';

function severityBadgeClass(level: DatabaseAuditItem['severity']) {
  if (level === 'CRITICAL') return 'status-pill status-pill-error';
  if (level === 'WARN') return 'status-pill status-pill-warning';
  return 'status-pill status-pill-info';
}

function formatDatabaseAction(action: string) {
  const labels: Record<string, string> = {
    'database.backup_create': 'Sauvegarde créée',
    'database.backup_download': 'Sauvegarde téléchargée',
    'database.backup_restore': 'Base restaurée',
    'database.backup_test': 'Sauvegarde testée',
    'database.backup_prune': 'Nettoyage des sauvegardes',
    'database.full_export': 'Export complet généré',
    'database.recovery_bundle_create': 'Bundle de reprise créé',
    'database.recovery_bundle_download': 'Bundle de reprise téléchargé',
    'database.recovery_bundle_import': 'Bundle de reprise importé',
    'database.recovery_bundle_restore': 'Bundle de reprise restauré',
    'database.recovery_bundle_test': 'Bundle de reprise testé',
  };
  return labels[action] || action;
}

interface Props {
  history: DatabaseAuditItem[];
}

export function DatabaseAuditHistory({ history }: Props) {
  const router = useRouter();

  return (
    <section className="bento-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Historique visuel</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">
            Dernières actions liées aux sauvegardes, restaurations, exports et nettoyages.
          </p>
        </div>
        <button onClick={() => router.push('/dashboard/settings/audit')} className="btn-secondary-sm">
          Ouvrir l&apos;audit
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {history.length === 0 ? (
          <div className="rounded-2xl border bg-[var(--color-surface)] px-4 py-5 text-sm text-[var(--color-text-soft)]">
            Aucun événement base de données récent.
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-[var(--color-surface)] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={severityBadgeClass(item.severity)}>{item.severity}</span>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{formatDatabaseAction(item.action)}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                  {item.userName || 'Système'} · {item.entity}
                  {item.entityId ? ` · ${item.entityId}` : ''}
                </p>
              </div>
              <p className="text-xs text-[var(--color-text-soft)]">
                {new Date(item.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
