'use client';

import { DatabaseAuditHistory } from '@/components/database-settings/DatabaseAuditHistory';
import { DatabaseExternalBackupSection } from '@/components/database-settings/DatabaseExternalBackupSection';
import { DatabaseGuideSection } from '@/components/database-settings/DatabaseGuideSection';
import { DatabaseHealthSection } from '@/components/database-settings/DatabaseHealthSection';
import { DatabaseInfoCards } from '@/components/database-settings/DatabaseInfoCards';
import { DatabaseMaintenanceOverview } from '@/components/database-settings/DatabaseMaintenanceOverview';
import { DatabaseMaintenanceSection } from '@/components/database-settings/DatabaseMaintenanceSection';
import { DatabaseRetentionSection } from '@/components/database-settings/DatabaseRetentionSection';
import { DatabaseSectionNav } from '@/components/database-settings/DatabaseSectionNav';
import { NotificationToast } from '@/components/ui/notification-toast';
import { useDatabaseSettings } from '@/components/database-settings/useDatabaseSettings';

export default function DatabaseSupervisionPage() {
  const {
    status,
    role,
    health,
    history,
    data,
    maintenanceMode,
    maintenanceMessage,
    savingMaintenance,
    backupRetentionCount,
    recoveryRetentionCount,
    savingRetention,
    pruning,
    externalTarget,
    savingExternalTarget,
    notification,
    newestBackup,
    lastBackupStatus,
    warningItems,
    handleSaveMaintenance,
    handleSaveRetention,
    handleSaveExternalTarget,
    handlePruneBackups,
    setMaintenanceMode,
    setMaintenanceMessage,
    setBackupRetentionCount,
    setRecoveryRetentionCount,
    setExternalTarget,
  } = useDatabaseSettings();

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-transparent" />
      </div>
    );
  }

  if (role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <DatabaseSectionNav
        active="supervision"
        title="Supervision et politique"
        description="Suivre l’état réel de la protection du laboratoire et configurer les règles de rétention, de maintenance et de copie externe."
      />

      <DatabaseMaintenanceOverview
        label={lastBackupStatus.label}
        description={lastBackupStatus.description}
        tone={lastBackupStatus.tone}
        health={health}
        warningItems={warningItems}
      />

      <DatabaseHealthSection health={health} />

      <DatabaseInfoCards data={data} newestBackupCreatedAt={newestBackup?.createdAt} />

      <DatabaseExternalBackupSection
        externalTarget={externalTarget}
        health={health}
        saving={savingExternalTarget}
        onExternalTargetChange={setExternalTarget}
        onSave={handleSaveExternalTarget}
      />

      <DatabaseRetentionSection
        backupRetentionCount={backupRetentionCount}
        recoveryRetentionCount={recoveryRetentionCount}
        savingRetention={savingRetention}
        pruning={pruning}
        onBackupRetentionCountChange={setBackupRetentionCount}
        onRecoveryRetentionCountChange={setRecoveryRetentionCount}
        onSaveRetention={handleSaveRetention}
        onPrune={handlePruneBackups}
      />

      <DatabaseMaintenanceSection
        maintenanceMode={maintenanceMode}
        maintenanceMessage={maintenanceMessage}
        savingMaintenance={savingMaintenance}
        onMaintenanceModeToggle={() => setMaintenanceMode((v) => !v)}
        onMaintenanceMessageChange={setMaintenanceMessage}
        onSaveMaintenance={handleSaveMaintenance}
      />

      <DatabaseAuditHistory history={history} />

      <DatabaseGuideSection />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
