'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type {
  BackupsResponse,
  DatabaseAuditItem,
  DatabaseFileValidationStatus,
  DatabaseAuditResponse,
  HealthResponse,
  RecoveryBundlesResponse,
  RestoreModalState,
  RestoreSummary,
} from './types';

export function useDatabaseSettings() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingRecovery, setCreatingRecovery] = useState(false);
  const [importingRecovery, setImportingRecovery] = useState(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [restoringRecoveryFile, setRestoringRecoveryFile] = useState<string | null>(null);
  const [testingFile, setTestingFile] = useState<string | null>(null);
  const [testingRecoveryFile, setTestingRecoveryFile] = useState<string | null>(null);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingRetention, setSavingRetention] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [data, setData] = useState<BackupsResponse | null>(null);
  const [recoveryBundles, setRecoveryBundles] = useState<RecoveryBundlesResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [history, setHistory] = useState<DatabaseAuditItem[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [backupRetentionCount, setBackupRetentionCount] = useState('10');
  const [recoveryRetentionCount, setRecoveryRetentionCount] = useState('10');
  const [externalTarget, setExternalTarget] = useState('');
  const [recoveryImportFile, setRecoveryImportFile] = useState<File | null>(null);
  const [uploadBackupFile, setUploadBackupFile] = useState<File | null>(null);
  const [uploadingBackup, setUploadingBackup] = useState(false);
  const [savingExternalTarget, setSavingExternalTarget] = useState(false);
  const [backupValidationStatuses, setBackupValidationStatuses] = useState<Record<string, DatabaseFileValidationStatus>>({});
  const [recoveryValidationStatuses, setRecoveryValidationStatuses] = useState<Record<string, DatabaseFileValidationStatus>>({});
  const [restoreModal, setRestoreModal] = useState<RestoreModalState>({
    isOpen: false,
    kind: null,
    fileName: null,
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && role !== 'ADMIN') router.push('/');
  }, [status, role, router]);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const [backupsResponse, recoveryBundlesResponse, settingsResponse, healthResponse, historyResponse] =
        await Promise.all([
          fetch('/api/database/backups', { cache: 'no-store' }),
          fetch('/api/database/recovery-bundles', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/database/health', { cache: 'no-store' }),
          fetch('/api/audit-logs?module=database&limit=8', { cache: 'no-store' }),
        ]);
      const [backupsJson, recoveryJson, settingsJson, healthJson, historyJson] = await Promise.all([
        backupsResponse.json(),
        recoveryBundlesResponse.json(),
        settingsResponse.json(),
        healthResponse.json(),
        historyResponse.json(),
      ]);

      if (!backupsResponse.ok) throw new Error(backupsJson.error || 'Erreur lors du chargement des sauvegardes');
      if (!settingsResponse.ok) throw new Error(settingsJson.error || 'Erreur lors du chargement des paramètres système');
      if (!recoveryBundlesResponse.ok) throw new Error(recoveryJson.error || 'Erreur lors du chargement des bundles de reprise');
      if (!healthResponse.ok) throw new Error((healthJson as { error?: string })?.error || 'Erreur lors du chargement de la santé système');
      if (!historyResponse.ok) throw new Error((historyJson as { error?: string })?.error || 'Erreur lors du chargement de l\'historique');

      setData(backupsJson as BackupsResponse);
      setRecoveryBundles(recoveryJson as RecoveryBundlesResponse);
      setHealth(healthJson as HealthResponse);
      setHistory((historyJson as DatabaseAuditResponse).items || []);
      setMaintenanceMode(settingsJson.maintenance_mode === 'true');
      setMaintenanceMessage(settingsJson.maintenance_message || '');
      setBackupRetentionCount(settingsJson.database_backup_retention_count || '10');
      setRecoveryRetentionCount(settingsJson.database_recovery_retention_count || '10');
      setExternalTarget(settingsJson.database_backup_external_target || '');
    } catch (error) {
      console.error('Database backups load error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors du chargement');
      setData(null);
      setRecoveryBundles(null);
      setHealth(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (status === 'authenticated' && role === 'ADMIN') {
      loadBackups();
    }
  }, [status, role, loadBackups]);

  const handleCreateBackup = useCallback(async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/database/backups', { method: 'POST' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors de la création de la sauvegarde');
      showNotification('success', 'Sauvegarde créée avec succès');
      await loadBackups();
    } catch (error) {
      console.error('Database backup create error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }, [loadBackups, showNotification]);

  const handleCreateRecoveryBundle = useCallback(async () => {
    setCreatingRecovery(true);
    try {
      const response = await fetch('/api/database/recovery-bundles', { method: 'POST' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors de la création du bundle');
      showNotification('success', 'Bundle de reprise créé avec succès');
      await loadBackups();
    } catch (error) {
      console.error('Recovery bundle create error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setCreatingRecovery(false);
    }
  }, [loadBackups, showNotification]);

  const handleImportRecoveryBundle = useCallback(async () => {
    if (!recoveryImportFile) {
      showNotification('error', 'Choisissez d\'abord un fichier de bundle .tar.gz');
      return;
    }
    setImportingRecovery(true);
    try {
      const formData = new FormData();
      formData.append('file', recoveryImportFile);
      const response = await fetch('/api/database/recovery-bundles/import', { method: 'POST', body: formData });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors de l\'import du bundle');
      setRecoveryImportFile(null);
      showNotification('success', 'Bundle importé avec succès');
      await loadBackups();
    } catch (error) {
      console.error('Recovery bundle import error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de l\'import');
    } finally {
      setImportingRecovery(false);
    }
  }, [loadBackups, recoveryImportFile, showNotification]);

  const handleRestoreBackup = useCallback(async (fileName: string) => {
    setRestoreModal({ isOpen: true, kind: 'backup', fileName });
  }, []);

  const handleValidateBackup = useCallback(
    async (fileName: string) => {
      setTestingFile(fileName);
      try {
        const response = await fetch(`/api/database/backups/${encodeURIComponent(fileName)}/validate`, { method: 'POST' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Erreur lors du test du backup');
        const validationOk = json.validation?.valid !== false;
        const restoreTestOk =
          typeof json.restoreTest?.valid === 'boolean' ? json.restoreTest.valid : undefined;
        setBackupValidationStatuses((current) => ({
          ...current,
          [fileName]: { validationOk, restoreTestOk },
        }));
        showNotification(
          !validationOk || restoreTestOk === false ? 'error' : 'success',
          !validationOk || restoreTestOk === false
            ? `Le backup ${fileName} a signalé un problème pendant le test.`
            : restoreTestOk
              ? `Le backup ${fileName} a passé le test de restauration.`
              : `Le backup ${fileName} est valide.`
        );
        await loadBackups();
      } catch (error) {
        console.error('Database backup validation error:', error);
        showNotification('error', error instanceof Error ? error.message : 'Erreur lors du test du backup');
      } finally {
        setTestingFile(null);
      }
    },
    [loadBackups, showNotification]
  );

  const executeRestoreBackup = useCallback(
    async (fileName: string) => {
      setRestoringFile(fileName);
      try {
        const response = await fetch(`/api/database/backups/${encodeURIComponent(fileName)}/restore`, { method: 'POST' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Erreur lors de la restauration');
        setRestoreSummary({
          kind: 'backup',
          restoredFrom: json.restoredFrom,
          safetyFileName: json.safetyBackup?.fileName ?? 'inconnu',
          validation: json.validation ?? null,
          restoredAt: new Date().toISOString(),
        });
        showNotification(
          json.validation?.valid === false ? 'error' : 'success',
          json.validation?.valid === false
            ? `Restauration terminée, mais la validation a détecté des problèmes.`
            : `Base restaurée et validée depuis ${fileName}`
        );
        await loadBackups();
      } catch (error) {
        console.error('Database backup restore error:', error);
        showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la restauration');
      } finally {
        setRestoringFile(null);
      }
    },
    [loadBackups, showNotification]
  );

  const handleRestoreRecoveryBundle = useCallback(async (fileName: string) => {
    setRestoreModal({ isOpen: true, kind: 'bundle', fileName });
  }, []);

  const handleValidateRecoveryBundle = useCallback(
    async (fileName: string) => {
      setTestingRecoveryFile(fileName);
      try {
        const response = await fetch(`/api/database/recovery-bundles/${encodeURIComponent(fileName)}/validate`, {
          method: 'POST',
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Erreur lors du test du bundle');
        const validationOk = json.validation?.valid !== false;
        const restoreTestOk =
          typeof json.restoreTest?.valid === 'boolean' ? json.restoreTest.valid : undefined;
        setRecoveryValidationStatuses((current) => ({
          ...current,
          [fileName]: { validationOk, restoreTestOk },
        }));
        showNotification(
          !validationOk || restoreTestOk === false ? 'error' : 'success',
          !validationOk || restoreTestOk === false
            ? `Le bundle ${fileName} a signalé un problème pendant le test.`
            : restoreTestOk
              ? `Le bundle ${fileName} a passé le test de restauration.`
              : `Le bundle ${fileName} est valide.`
        );
        await loadBackups();
      } catch (error) {
        console.error('Recovery bundle validation error:', error);
        showNotification('error', error instanceof Error ? error.message : 'Erreur lors du test du bundle');
      } finally {
        setTestingRecoveryFile(null);
      }
    },
    [loadBackups, showNotification]
  );

  const executeRestoreRecoveryBundle = useCallback(
    async (fileName: string) => {
      setRestoringRecoveryFile(fileName);
      try {
        const response = await fetch(`/api/database/recovery-bundles/${encodeURIComponent(fileName)}/restore`, {
          method: 'POST',
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Erreur lors de la restauration du bundle');
        setRestoreSummary({
          kind: 'bundle',
          restoredFrom: json.restoredFrom,
          safetyFileName: json.safetyBundle?.fileName ?? 'inconnu',
          restoredUploads: Boolean(json.restoredUploads),
          validation: json.validation ?? null,
          restoredAt: new Date().toISOString(),
        });
        showNotification(
          json.validation?.valid === false ? 'error' : 'success',
          json.validation?.valid === false
            ? `Bundle restauré, mais la validation a détecté des problèmes.`
            : `Bundle restauré et validé depuis ${fileName}`
        );
        await loadBackups();
      } catch (error) {
        console.error('Recovery bundle restore error:', error);
        showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la restauration');
      } finally {
        setRestoringRecoveryFile(null);
      }
    },
    [loadBackups, showNotification]
  );

  const handleConfirmRestore = useCallback(async () => {
    if (!restoreModal.isOpen || !restoreModal.fileName || !restoreModal.kind) return;
    if (restoreModal.kind === 'backup') {
      await executeRestoreBackup(restoreModal.fileName);
    } else {
      await executeRestoreRecoveryBundle(restoreModal.fileName);
    }
    setRestoreModal({ isOpen: false, kind: null, fileName: null });
  }, [executeRestoreBackup, executeRestoreRecoveryBundle, restoreModal]);

  const handleSaveMaintenance = useCallback(async () => {
    setSavingMaintenance(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            maintenance_mode: maintenanceMode ? 'true' : 'false',
            maintenance_message: maintenanceMessage,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors de la mise a jour du mode maintenance');
      showNotification('success', maintenanceMode ? 'Mode maintenance active' : 'Mode maintenance desactive');
    } catch (error) {
      console.error('Maintenance settings save error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSavingMaintenance(false);
    }
  }, [maintenanceMessage, maintenanceMode, showNotification]);

  const handleSaveRetention = useCallback(async () => {
    setSavingRetention(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            database_backup_retention_count: backupRetentionCount,
            database_recovery_retention_count: recoveryRetentionCount,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors de la mise a jour de la retention');
      showNotification('success', 'Politique de retention enregistree');
    } catch (error) {
      console.error('Backup retention save error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSavingRetention(false);
    }
  }, [backupRetentionCount, recoveryRetentionCount, showNotification]);

  const handleSaveExternalTarget = useCallback(async () => {
    setSavingExternalTarget(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { database_backup_external_target: externalTarget } }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors de la mise a jour du chemin externe');
      showNotification('success', 'Chemin de copie externe enregistré');
      await loadBackups();
    } catch (error) {
      console.error('External target save error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSavingExternalTarget(false);
    }
  }, [externalTarget, loadBackups, showNotification]);

  const handlePruneBackups = useCallback(async () => {
    setPruning(true);
    try {
      const response = await fetch('/api/database/backups/prune', { method: 'POST' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors du nettoyage');
      showNotification('success', json.message || 'Nettoyage termine');
      await loadBackups();
    } catch (error) {
      console.error('Database backup prune error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors du nettoyage');
    } finally {
      setPruning(false);
    }
  }, [loadBackups, showNotification]);

  const handleUploadBackup = useCallback(async () => {
    if (!uploadBackupFile) {
      showNotification('error', 'Choisissez d\'abord un fichier de sauvegarde .sqlite');
      return;
    }
    setUploadingBackup(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadBackupFile);
      const response = await fetch('/api/database/backups/upload', { method: 'POST', body: formData });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors de l\'import du backup');
      setUploadBackupFile(null);
      showNotification('success', 'Fichier de sauvegarde importé avec succès');
      await loadBackups();
    } catch (error) {
      console.error('Backup upload error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de l\'import');
    } finally {
      setUploadingBackup(false);
    }
  }, [loadBackups, showNotification, uploadBackupFile]);

  const newestBackup = useMemo(() => data?.items?.[0] ?? null, [data]);

  const lastBackupStatus = useMemo(() => {
    const latestCreatedAt = health?.backups.latestCreatedAt;
    if (!latestCreatedAt) {
      return {
        tone: 'alert' as const,
        label: 'Aucune sauvegarde',
        description: 'Aucune sauvegarde n\'a encore été créée. Lancez une sauvegarde avant toute opération sensible.',
      };
    }
    const ageHours = (Date.now() - new Date(latestCreatedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours <= 24) {
      return {
        tone: 'ok' as const,
        label: 'Sauvegarde récente',
        description: `Dernière sauvegarde effectuée le ${new Date(latestCreatedAt).toLocaleString('fr-FR')}.`,
      };
    }
    if (ageHours <= 72) {
      return {
        tone: 'warning' as const,
        label: 'Sauvegarde vieillissante',
        description: `La dernière sauvegarde date du ${new Date(latestCreatedAt).toLocaleString('fr-FR')}. Vérifiez la tâche automatique.`,
      };
    }
    return {
      tone: 'alert' as const,
      label: 'Sauvegarde trop ancienne',
      description: `La dernière sauvegarde date du ${new Date(latestCreatedAt).toLocaleString('fr-FR')}. Le laboratoire n\'est pas suffisamment protégé.`,
    };
  }, [health]);

  const warningItems = useMemo(() => {
    const items: string[] = [];
    if (!health?.backups.latestCreatedAt) {
      items.push('Aucune sauvegarde locale n\'a encore été créée.');
    } else {
      const ageHours = (Date.now() - new Date(health.backups.latestCreatedAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > 24) {
        items.push('La dernière sauvegarde a plus de 24 heures. Vérifiez que la tâche automatique fonctionne bien.');
      }
    }
    if (!health?.externalTarget.configuredPath) {
      items.push('Aucun disque ou dossier externe n\'est configuré. En cas de panne du poste, les copies locales seules ne suffisent pas.');
    } else if (!health.externalTarget.available) {
      items.push('Le chemin externe est configuré mais actuellement inaccessible. Vérifiez le disque USB ou le partage réseau.');
    }
    return items;
  }, [health]);

  return {
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
    savingMaintenance,
    savingRetention,
    pruning,
    data,
    recoveryBundles,
    health,
    backupValidationStatuses,
    recoveryValidationStatuses,
    history,
    maintenanceMode,
    maintenanceMessage,
    backupRetentionCount,
    recoveryRetentionCount,
    externalTarget,
    recoveryImportFile,
    savingExternalTarget,
    restoreModal,
    notification,
    restoreSummary,
    newestBackup,
    lastBackupStatus,
    warningItems,
    loadBackups,
    handleCreateBackup,
    handleCreateRecoveryBundle,
    handleImportRecoveryBundle,
    handleRestoreBackup,
    handleValidateBackup,
    handleRestoreRecoveryBundle,
    handleValidateRecoveryBundle,
    handleConfirmRestore,
    handleSaveMaintenance,
    handleSaveRetention,
    handleSaveExternalTarget,
    handlePruneBackups,
    handleUploadBackup,
    setRecoveryImportFile,
    setMaintenanceMode,
    setMaintenanceMessage,
    setBackupRetentionCount,
    setRecoveryRetentionCount,
    setExternalTarget,
    setRestoreModal,
    uploadBackupFile,
    uploadingBackup,
    setUploadBackupFile,
    setRestoreSummary,
  };
}
