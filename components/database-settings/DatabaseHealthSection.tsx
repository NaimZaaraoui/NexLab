import { AlertTriangle } from 'lucide-react';
import { DatabaseHealthCard } from './DatabaseHealthCard';
import { formatBytes } from './database-helpers';
import type { HealthResponse } from './types';

interface Props {
  health: HealthResponse | null;
}

export function DatabaseHealthSection({ health }: Props) {
  return (
    <section className="bento-panel p-5">
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Santé système</h2>
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
          Vue rapide de l&apos;état de la base, des sauvegardes et des alertes critiques.
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-4">
        <DatabaseHealthCard
          title="Base de données"
          status={health?.database.reachable && health?.database.fileExists ? 'ok' : 'alert'}
          value={health?.database.reachable && health?.database.fileExists ? 'Connectée' : 'À vérifier'}
          meta={health?.database.size ? `Taille: ${formatBytes(health.database.size)}` : 'Fichier indisponible'}
        />
        <DatabaseHealthCard
          title="Sauvegardes"
          status={health?.backups.isFresh && health?.backups.latestValidation?.valid !== false ? 'ok' : 'alert'}
          value={health?.backups.count ? `${health.backups.count} fichier(s)` : 'Aucune'}
          meta={
            health?.backups.latestCreatedAt
              ? `Dernière: ${new Date(health.backups.latestCreatedAt).toLocaleString('fr-FR')} · ${health.backups.latestValidation?.valid === false ? 'validation échouée' : 'validation OK'}`
              : 'Aucune sauvegarde récente'
          }
        />
        <DatabaseHealthCard
          title="Bundles reprise"
          status={health?.recoveryBundles.count && health?.recoveryBundles.latestValidation?.valid !== false ? 'ok' : 'alert'}
          value={health?.recoveryBundles.count ? `${health.recoveryBundles.count} archive(s)` : 'Aucune'}
          meta={
            health?.recoveryBundles.latestCreatedAt
              ? `Dernière: ${new Date(health.recoveryBundles.latestCreatedAt).toLocaleString('fr-FR')} · ${health.recoveryBundles.latestValidation?.valid === false ? 'validation échouée' : 'validation OK'}`
              : 'Aucune archive de reprise'
          }
        />
        <DatabaseHealthCard
          title="Espace backups"
          status={health?.backups.freeSpaceBytes && health.backups.freeSpaceBytes > 1024 * 1024 * 512 ? 'ok' : 'alert'}
          value={health?.backups.freeSpaceBytes ? formatBytes(health.backups.freeSpaceBytes) : 'Inconnu'}
          meta="Espace libre estimé"
        />
        <DatabaseHealthCard
          title="Cible externe"
          status={health?.externalTarget.configuredPath ? (health.externalTarget.available ? 'ok' : 'alert') : 'alert'}
          value={
            health?.externalTarget.configuredPath
              ? health.externalTarget.available
                ? 'Accessible'
                : 'Indisponible'
              : 'Non configurée'
          }
          meta={health?.externalTarget.configuredPath || 'Aucun dossier distant ou externe défini'}
        />
        <DatabaseHealthCard
          title="Derniers tests"
          status={
            health?.testHistory.lastBackupTestOk === false || health?.testHistory.lastRecoveryTestOk === false
              ? 'alert'
              : health?.testHistory.lastBackupTestAt || health?.testHistory.lastRecoveryTestAt
                ? 'ok'
                : 'alert'
          }
          value={
            health?.testHistory.lastBackupTestAt || health?.testHistory.lastRecoveryTestAt
              ? 'Des tests ont été exécutés'
              : 'Aucun test manuel'
          }
          meta={
            health?.testHistory.lastRecoveryTestAt
              ? `Dernier bundle: ${new Date(health.testHistory.lastRecoveryTestAt).toLocaleString('fr-FR')}`
              : health?.testHistory.lastBackupTestAt
                ? `Dernier backup: ${new Date(health.testHistory.lastBackupTestAt).toLocaleString('fr-FR')}`
                : 'Testez un backup ou bundle sans restaurer'
          }
        />
      </div>

      <div className="mt-5 rounded-md border bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Derniers événements critiques</h3>
        </div>
        <div className="mt-3 space-y-2">
          {!health || health.criticalLogs.length === 0 ? (
            <p className="text-sm text-[var(--color-text-soft)]">Aucun événement critique récent.</p>
          ) : (
            health.criticalLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-[var(--color-surface-muted)] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{log.action}</p>
                  <p className="text-xs text-[var(--color-text-soft)]">
                    {log.entity}
                    {log.entityId ? ` · ${log.entityId}` : ''}
                  </p>
                </div>
                <p className="text-xs text-[var(--color-text-soft)]">
                  {new Date(log.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
