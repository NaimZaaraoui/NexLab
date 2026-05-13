'use client';

import type { RestoreSummary } from './types';

interface Props {
  restoreSummary: RestoreSummary;
  onClose: () => void;
}

export function DatabaseRestoreSummary({ restoreSummary, onClose }: Props) {
  return (
    <section className={`rounded-xl border px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)] ${
      restoreSummary.validation?.valid === false ? 'border-slate-300 bg-slate-50' : 'border-slate-300 bg-slate-50'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Dernière restauration</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {restoreSummary.kind === 'bundle' ? 'Bundle de reprise' : 'Sauvegarde SQLite'} restauré depuis{' '}
            <span className="font-semibold text-[var(--color-text)]">{restoreSummary.restoredFrom}</span>{' '}
            le {new Date(restoreSummary.restoredAt).toLocaleString('fr-FR')}.
          </p>
        </div>
        <button type="button" onClick={onClose} className="btn-secondary-sm">
          Fermer
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Fichier de sécurité</p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{restoreSummary.safetyFileName}</p>
        </div>
        <div className="rounded-md border bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Validation post-restore</p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {restoreSummary.validation?.valid === false ? 'Problèmes détectés' : 'Base valide'}
          </p>
        </div>
        <div className="rounded-md border bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Uploads</p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {restoreSummary.kind === 'bundle'
              ? restoreSummary.restoredUploads
                ? 'Restaurés'
                : 'Aucun upload dans le bundle'
              : 'Non concernés'}
          </p>
        </div>
      </div>
      {restoreSummary.validation?.issues?.length ? (
        <div className="mt-3 rounded-md border bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Détails validation</p>
          <div className="mt-2 space-y-1">
            {restoreSummary.validation.issues.map((issue) => (
              <p key={issue} className="text-sm text-[var(--color-text-secondary)]">{issue}</p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
