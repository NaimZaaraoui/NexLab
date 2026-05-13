'use client';

import { Download, RotateCcw, ShieldCheck } from 'lucide-react';
import type { BackupItem, DatabaseFileValidationStatus } from '@/components/database-settings/types';

interface DatabaseFileTableProps {
  title: string;
  subtitle: string;
  items: BackupItem[] | null | undefined;
  loading: boolean;
  restoringFile: string | null;
  testingFile?: string | null;
  onRestore: (fileName: string) => void;
  onValidate?: (fileName: string) => void;
  getDownloadHref: (fileName: string) => string;
  emptyLabel: string;
  formatBytes: (size: number) => string;
  validationStatuses?: Record<string, DatabaseFileValidationStatus>;
}

function getValidationBadge(status?: DatabaseFileValidationStatus) {
  if (!status) {
    return {
      className: 'border-slate-200 bg-slate-50 text-slate-600',
      label: 'Non testé',
    };
  }

  if (!status.validationOk || status.restoreTestOk === false) {
    return {
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      label: 'Problème détecté',
    };
  }

  if (status.restoreTestOk === true) {
    return {
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      label: 'Test restauration OK',
    };
  }

  return {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    label: 'Validation OK',
  };
}

export function DatabaseFileTable({
  title,
  subtitle,
  items,
  loading,
  restoringFile,
  testingFile,
  onRestore,
  onValidate,
  getDownloadHref,
  emptyLabel,
  formatBytes,
  validationStatuses,
}: DatabaseFileTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
      <div className="flex items-center justify-between border-b bg-[var(--color-surface-muted)] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
          <p className="mt-1 text-xs text-[var(--color-text-soft)]">{subtitle}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b bg-[var(--color-surface)] text-left">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Fichier</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Créé le</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Taille</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Statut</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Chemin</th>
              <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                  Chargement...
                </td>
              </tr>
            )}

            {!loading && (!items || items.length === 0) && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                  {emptyLabel}
                </td>
              </tr>
            )}

            {!loading &&
              items?.map((item) => {
                const badge = getValidationBadge(validationStatuses?.[item.fileName]);

                return (
                  <tr key={item.fileName} className="hover:bg-[var(--color-surface-muted)]/50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[var(--color-text)]">{item.fileName}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                      {new Date(item.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{formatBytes(item.size)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="max-w-[360px] px-5 py-4 text-xs text-[var(--color-text-soft)]">
                      <span className="line-clamp-2">{item.absolutePath}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {onValidate && (
                          <button
                            onClick={() => onValidate(item.fileName)}
                            className="btn-secondary-sm inline-flex"
                            disabled={Boolean(restoringFile) || Boolean(testingFile)}
                          >
                            <ShieldCheck size={16} className={testingFile === item.fileName ? 'animate-pulse' : ''} />
                            {testingFile === item.fileName ? 'Test...' : 'Tester'}
                          </button>
                        )}
                        <button
                          onClick={() => onRestore(item.fileName)}
                          className="btn-secondary-sm inline-flex"
                          disabled={Boolean(restoringFile) || Boolean(testingFile)}
                        >
                          <RotateCcw size={16} className={restoringFile === item.fileName ? 'animate-spin' : ''} />
                          {restoringFile === item.fileName ? 'Restauration...' : 'Restaurer'}
                        </button>
                        <a href={getDownloadHref(item.fileName)} className="btn-secondary-sm inline-flex">
                          <Download size={16} />
                          Télécharger
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
