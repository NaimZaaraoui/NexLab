'use client';

import type { AuditItem } from '@/components/audit/types';

interface AuditLogsTableProps {
  loading: boolean;
  visibleItems: AuditItem[];
  detailsPreview: (value: string | null) => string;
  severityBadgeClass: (level: string) => string;
  onSelectLog: (item: AuditItem) => void;
}

export function AuditLogsTable({
  loading,
  visibleItems,
  detailsPreview,
  severityBadgeClass,
  onSelectLog,
}: AuditLogsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-[var(--color-surface)] shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-b bg-[var(--color-surface-muted)] text-left">
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Date</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Criticité</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Utilisateur</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Action</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Entité</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Détails</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--color-text-soft)]">
                  Chargement...
                </td>
              </tr>
            )}
            {!loading && visibleItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--color-text-soft)]">
                  Aucun log trouvé.
                </td>
              </tr>
            )}
            {!loading &&
              visibleItems.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--color-surface-muted)]/60">
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{new Date(item.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={severityBadgeClass(item.severity)}>{item.severity}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                    <div className="font-semibold text-[var(--color-text)]">{item.userName || 'Système'}</div>
                    <div>{item.userEmail || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text)]">{item.action}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                    {item.entity}
                    {item.entityId ? ` (${item.entityId})` : ''}
                  </td>
                  <td className="max-w-[340px] px-4 py-3 text-xs text-[var(--color-text-soft)]">
                    <div className="truncate">{detailsPreview(item.details)}</div>
                    {item.details && (
                      <button onClick={() => onSelectLog(item)} className="mt-1 text-[11px] font-semibold text-[var(--color-text)] hover:text-[var(--color-text-secondary)] hover:underline">
                        Voir
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-soft)]">{item.ipAddress || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
