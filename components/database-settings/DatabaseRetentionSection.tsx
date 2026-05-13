'use client';

import { ShieldCheck, Trash2 } from 'lucide-react';

interface DatabaseRetentionSectionProps {
  backupRetentionCount: string;
  recoveryRetentionCount: string;
  savingRetention: boolean;
  pruning: boolean;
  onBackupRetentionCountChange: (value: string) => void;
  onRecoveryRetentionCountChange: (value: string) => void;
  onSaveRetention: () => void;
  onPrune: () => void;
}

export function DatabaseRetentionSection({
  backupRetentionCount,
  recoveryRetentionCount,
  savingRetention,
  pruning,
  onBackupRetentionCountChange,
  onRecoveryRetentionCountChange,
  onSaveRetention,
  onPrune,
}: DatabaseRetentionSectionProps) {
  return (
    <section className="bento-panel p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <Trash2 size={20} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Politique de retention</h2>
              <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                Garde uniquement les N derniers backups SQLite et bundles de reprise. La regle s&apos;applique automatiquement apres chaque nouvelle creation.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="form-label mb-1.5">Backups SQLite a conserver</span>
              <input
                type="number"
                min="0"
                max="200"
                value={backupRetentionCount}
                onChange={(event) => onBackupRetentionCountChange(event.target.value)}
                className="input-premium h-11 w-full"
                placeholder="10"
              />
            </label>
            <label className="block">
              <span className="form-label mb-1.5">Bundles de reprise a conserver</span>
              <input
                type="number"
                min="0"
                max="200"
                value={recoveryRetentionCount}
                onChange={(event) => onRecoveryRetentionCountChange(event.target.value)}
                className="input-premium h-11 w-full"
                placeholder="10"
              />
            </label>
          </div>
          <p className="text-xs text-[var(--color-text-soft)]">`0` desactive le nettoyage automatique. Valeur recommandee: `10` pour chaque type.</p>

          <div className="flex flex-wrap gap-3">
            <button onClick={onSaveRetention} className="btn-primary-sm" disabled={savingRetention}>
              <ShieldCheck size={16} />
              {savingRetention ? 'Enregistrement...' : 'Enregistrer la retention'}
            </button>
            <button onClick={onPrune} className="btn-secondary-sm" disabled={pruning}>
              <Trash2 size={16} className={pruning ? 'animate-pulse' : ''} />
              {pruning ? 'Nettoyage...' : 'Appliquer maintenant'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
