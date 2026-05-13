'use client';

import { HardDrive, ShieldCheck } from 'lucide-react';
import type { HealthResponse } from '@/components/database-settings/types';

interface DatabaseExternalBackupSectionProps {
  externalTarget: string;
  health: HealthResponse | null;
  saving: boolean;
  onExternalTargetChange: (value: string) => void;
  onSave: () => void;
}

export function DatabaseExternalBackupSection({
  externalTarget,
  health,
  saving,
  onExternalTargetChange,
  onSave,
}: DatabaseExternalBackupSectionProps) {
  return (
    <section className="bento-panel p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <HardDrive size={20} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Copie externe et automatisation</h2>
              <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                Configure un dossier externe pour dupliquer les sauvegardes et planifie `npm run backup:run` via cron ou une tâche système.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl space-y-4">
          <label className="block">
            <span className="form-label mb-1.5">Chemin de copie externe</span>
            <input
              value={externalTarget}
              onChange={(event) => onExternalTargetChange(event.target.value)}
              className="input-premium h-11 w-full"
              placeholder="/mnt/usb-lims-backups ou /srv/nexlab-backups"
            />
            <p className="mt-2 text-xs text-[var(--color-text-soft)]">
              L&apos;application y copiera la sauvegarde SQLite et le bundle de reprise lors des exécutions programmées.
            </p>
          </label>

          <div className="rounded-2xl border bg-[var(--color-surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Etat cible externe</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
              {health?.externalTarget.configuredPath || 'Aucun chemin configuré'}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
              {health?.externalTarget.configuredPath
                ? health.externalTarget.available
                  ? 'Chemin accessible depuis le serveur.'
                  : 'Chemin configuré mais actuellement inaccessible.'
                : 'Configure un chemin pour dupliquer les backups hors du dossier local.'}
            </p>
          </div>

          <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Commande à planifier</p>
            <code className="mt-2 block overflow-x-auto rounded-xl bg-slate-950 px-3 py-3 text-xs text-slate-100">
              0 2 * * * cd /chemin/vers/nexlab && npm run backup:run &gt;&gt; backups/backup.log 2&gt;&amp;1
            </code>
            <p className="mt-2 text-xs text-[var(--color-text-soft)]">
              Exemple cron quotidien à 02:00. À exécuter sur la machine hôte ou le serveur qui héberge Docker.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={onSave} className="btn-primary-sm" disabled={saving}>
              <ShieldCheck size={16} />
              {saving ? 'Enregistrement...' : 'Enregistrer le chemin externe'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
