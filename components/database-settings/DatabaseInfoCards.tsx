import { Database, HardDrive, ShieldCheck } from 'lucide-react';
import type { BackupsResponse } from './types';

interface Props {
  data: BackupsResponse | null;
  newestBackupCreatedAt: string | undefined;
}

export function DatabaseInfoCards({ data, newestBackupCreatedAt }: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <article className="bento-panel p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-[var(--color-accent)]">
            <Database size={20} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Fichier actif</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{data?.databasePath || '—'}</p>
          </div>
        </div>
      </article>

      <article className="bento-panel p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <HardDrive size={20} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Dernière sauvegarde</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
              {newestBackupCreatedAt ? new Date(newestBackupCreatedAt).toLocaleString('fr-FR') : 'Aucune sauvegarde'}
            </p>
          </div>
        </div>
      </article>

      <article className="bento-panel p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-slate-700">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Dossier backups</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{data?.backupDirectory || '—'}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
