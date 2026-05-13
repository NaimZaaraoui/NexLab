'use client';

import { Download, FolderArchive, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { DatabaseFileTable } from '@/components/database-settings/DatabaseFileTable';
import { DatabaseRecoverySection } from '@/components/database-settings/DatabaseRecoverySection';
import { DatabaseRestoreSummary } from '@/components/database-settings/DatabaseRestoreSummary';
import { DatabaseSectionNav } from '@/components/database-settings/DatabaseSectionNav';
import { useDatabaseSettings } from '@/components/database-settings/useDatabaseSettings';
import { formatBytes } from '@/components/database-settings/database-helpers';

export default function DatabaseBackupsPage() {
  const {
    status,
    role,
    loading,
    creating,
    creatingRecovery,
    importingRecovery,
    restoringFile,
    restoringRecoveryFile,
    testingFile,
    testingRecoveryFile,
    data,
    recoveryBundles,
    health,
    backupValidationStatuses,
    recoveryValidationStatuses,
    recoveryImportFile,
    restoreModal,
    notification,
    restoreSummary,
    newestBackup,
    loadBackups,
    handleCreateBackup,
    handleCreateRecoveryBundle,
    handleImportRecoveryBundle,
    handleRestoreBackup,
    handleValidateBackup,
    handleRestoreRecoveryBundle,
    handleValidateRecoveryBundle,
    handleConfirmRestore,
    handleUploadBackup,
    setRecoveryImportFile,
    setRestoreModal,
    uploadBackupFile,
    uploadingBackup,
    setUploadBackupFile,
    setRestoreSummary,
  } = useDatabaseSettings();

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <DatabaseSectionNav
        active="backups"
        title="Sauvegardes et reprise"
        description="Créer, tester, télécharger, importer et restaurer les fichiers de sauvegarde du laboratoire."
      />

      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex flex-wrap gap-3">
          <a href="/api/database/export-full" className="btn-secondary-sm">
            <Download size={16} />
            Export complet
          </a>
          <button onClick={loadBackups} className="btn-secondary-sm" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button onClick={handleCreateBackup} className="btn-primary-sm" disabled={creating}>
            <FolderArchive size={16} className={creating ? 'animate-pulse' : ''} />
            {creating ? 'Sauvegarde en cours...' : 'Créer une sauvegarde'}
          </button>
          <button onClick={handleCreateRecoveryBundle} className="btn-secondary-sm" disabled={creatingRecovery}>
            <FolderArchive size={16} className={creatingRecovery ? 'animate-pulse' : ''} />
            {creatingRecovery ? 'Bundle en cours...' : 'Créer un bundle de reprise'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="bento-panel p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <FolderArchive size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Dernier backup</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {newestBackup?.createdAt ? new Date(newestBackup.createdAt).toLocaleString('fr-FR') : 'Aucun backup'}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                {data?.items?.length ? `${data.items.length} fichier(s) disponibles` : 'Créez une première sauvegarde'}
              </p>
            </div>
          </div>
        </article>

        <article className="bento-panel p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <FolderArchive size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Dernier bundle</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {recoveryBundles?.items?.[0]?.createdAt ? new Date(recoveryBundles.items[0].createdAt).toLocaleString('fr-FR') : 'Aucun bundle'}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                {recoveryBundles?.items?.length ? `${recoveryBundles.items.length} archive(s) disponibles` : 'Créez un bundle de reprise'}
              </p>
            </div>
          </div>
        </article>

        <article className="bento-panel p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Dernier test</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {health?.testHistory.lastRecoveryTestAt
                  ? `Bundle · ${new Date(health.testHistory.lastRecoveryTestAt).toLocaleString('fr-FR')}`
                  : health?.testHistory.lastBackupTestAt
                    ? `Backup · ${new Date(health.testHistory.lastBackupTestAt).toLocaleString('fr-FR')}`
                    : 'Aucun test manuel'}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                {health?.testHistory.lastRecoveryTestOk === false || health?.testHistory.lastBackupTestOk === false
                  ? 'Le dernier test a signalé un problème'
                  : 'Utilisez “Tester” pour vérifier un fichier sans restaurer'}
              </p>
            </div>
          </div>
        </article>
      </section>

      {restoreSummary && (
        <DatabaseRestoreSummary restoreSummary={restoreSummary} onClose={() => setRestoreSummary(null)} />
      )}

      <DatabaseFileTable
        title="Sauvegardes disponibles"
        subtitle={`${data?.items.length ?? 0} fichier(s) prêt(s) au téléchargement`}
        items={data?.items}
        loading={loading}
        restoringFile={restoringFile}
        testingFile={testingFile}
        onRestore={handleRestoreBackup}
        onValidate={handleValidateBackup}
        getDownloadHref={(fileName) => `/api/database/backups/${encodeURIComponent(fileName)}/download`}
        emptyLabel="Aucune sauvegarde n'a encore été créée."
        formatBytes={formatBytes}
        validationStatuses={backupValidationStatuses}
      />

      <section className="overflow-hidden rounded-xl border bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="border-b bg-[var(--color-surface-muted)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Importer une sauvegarde</h2>
          <p className="mt-1 text-xs text-[var(--color-text-soft)]">
            Importez un fichier <code>.sqlite</code> depuis votre machine ou clé USB. Le fichier sera vérifié avant d&apos;être accepté.
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 px-5 py-5 sm:flex-row sm:items-center">
          <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-md border border-dashed bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-soft)] transition hover:border-slate-400 hover:text-slate-700">
            <Upload size={18} />
            {uploadBackupFile ? uploadBackupFile.name : 'Choisir un fichier .sqlite…'}
            <input
              type="file"
              accept=".sqlite"
              className="hidden"
              onChange={(e) => setUploadBackupFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            onClick={handleUploadBackup}
            className="btn-primary-sm"
            disabled={!uploadBackupFile || uploadingBackup}
          >
            <Upload size={16} className={uploadingBackup ? 'animate-pulse' : ''} />
            {uploadingBackup ? 'Import en cours...' : 'Importer'}
          </button>
        </div>
      </section>

      <DatabaseRecoverySection
        recoveryImportFile={recoveryImportFile}
        importingRecovery={importingRecovery}
        onRecoveryImportFileChange={setRecoveryImportFile}
        onImport={handleImportRecoveryBundle}
      />

      <DatabaseFileTable
        title="Bundles de reprise"
        subtitle={`${recoveryBundles?.items.length ?? 0} archive(s) complète(s) prêtes au téléchargement`}
        items={recoveryBundles?.items}
        loading={loading}
        restoringFile={restoringRecoveryFile}
        testingFile={testingRecoveryFile}
        onRestore={handleRestoreRecoveryBundle}
        onValidate={handleValidateRecoveryBundle}
        getDownloadHref={(fileName) => `/api/database/recovery-bundles/${encodeURIComponent(fileName)}`}
        emptyLabel="Aucun bundle de reprise n'a encore été créé."
        formatBytes={formatBytes}
        validationStatuses={recoveryValidationStatuses}
      />

      <ConfirmationModal
        isOpen={restoreModal.isOpen}
        onClose={() => setRestoreModal({ isOpen: false, kind: null, fileName: null })}
        onConfirm={handleConfirmRestore}
        title={restoreModal.kind === 'bundle' ? 'Restaurer un bundle de reprise' : 'Restaurer une sauvegarde'}
        message={
          restoreModal.kind === 'bundle'
            ? `Cette action va restaurer la base active et les fichiers uploads depuis ${restoreModal.fileName || 'le bundle sélectionné'}. Un bundle de sécurité sera créé avant écrasement, puis une validation post-restauration sera exécutée automatiquement.`
            : `Cette action va écraser la base active avec ${restoreModal.fileName || 'la sauvegarde sélectionnée'}. Une sauvegarde de sécurité sera créée avant restauration, puis une validation post-restauration sera exécutée automatiquement.`
        }
        confirmText="Restaurer"
        cancelText="Annuler"
        type="danger"
        icon="warning"
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
