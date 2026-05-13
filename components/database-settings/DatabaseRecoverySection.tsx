'use client';

import { Download } from 'lucide-react';

interface DatabaseRecoverySectionProps {
  recoveryImportFile: File | null;
  importingRecovery: boolean;
  onRecoveryImportFileChange: (file: File | null) => void;
  onImport: () => void;
}

export function DatabaseRecoverySection({
  recoveryImportFile,
  importingRecovery,
  onRecoveryImportFileChange,
  onImport,
}: DatabaseRecoverySectionProps) {
  return (
    <section className="bento-panel p-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Reprise après incident</h2>
        <p className="text-sm text-[var(--color-text-soft)]">
          Le bundle de reprise contient une copie propre de la base SQLite, le dossier `public/uploads`, un manifeste et un guide de restauration.
        </p>
        <p className="text-xs text-[var(--color-text-soft)]">
          Utilise-le pour une panne machine, un remplacement de poste ou un transfert complet vers un autre environnement.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-[var(--color-surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Import depuis un autre poste</p>
          <p className="mt-2 text-sm text-[var(--color-text-soft)]">
            Après réinstallation de NexLab, l’admin peut importer un bundle `.tar.gz`, puis utiliser le bouton <span className="font-semibold text-[var(--color-text)]">Restaurer</span> pour relancer le laboratoire sans passer par une commande terminal.
          </p>
        </div>

        <div className="rounded-2xl border bg-[var(--color-surface)] p-4">
          <label className="block">
            <span className="form-label mb-1.5">Bundle de reprise à importer</span>
            <input
              type="file"
              accept=".tar.gz"
              onChange={(event) => onRecoveryImportFileChange(event.target.files?.[0] || null)}
              className="input-premium h-11 w-full file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={onImport} className="btn-primary-sm" disabled={importingRecovery || !recoveryImportFile}>
              <Download size={16} />
              {importingRecovery ? 'Import en cours...' : 'Importer le bundle'}
            </button>
            {recoveryImportFile && (
              <p className="text-xs text-[var(--color-text-soft)]">
                Fichier sélectionné: <span className="font-semibold text-[var(--color-text)]">{recoveryImportFile.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
