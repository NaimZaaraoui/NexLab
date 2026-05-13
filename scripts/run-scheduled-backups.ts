import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { createDatabaseBackup, pruneDatabaseBackups } from '@/lib/database-backups';
import { createRecoveryBundle, pruneRecoveryBundles } from '@/lib/recovery-bundles';
import { syncBackupsToExternalTarget } from '@/lib/backup-sync';

async function main() {
  const [retentionSetting, recoveryRetentionSetting, targetSetting] = await Promise.all([
    prisma.setting.findUnique({
      where: { key: 'database_backup_retention_count' },
      select: { value: true },
    }),
    prisma.setting.findUnique({
      where: { key: 'database_recovery_retention_count' },
      select: { value: true },
    }),
    prisma.setting.findUnique({
      where: { key: 'database_backup_external_target' },
      select: { value: true },
    }),
  ]);

  const retentionCount = Math.max(0, parseInt(retentionSetting?.value || '10', 10) || 10);
  const recoveryRetentionCount = Math.max(0, parseInt(recoveryRetentionSetting?.value || '10', 10) || 10);
  const externalTarget = process.env.BACKUP_EXTERNAL_TARGET || targetSetting?.value || '';

  const databaseBackup = await createDatabaseBackup();
  const recoveryBundle = await createRecoveryBundle();
  const pruneResult = await pruneDatabaseBackups(retentionCount);
  const pruneRecoveryResult = await pruneRecoveryBundles(recoveryRetentionCount);

  console.log(`Database backup created: ${databaseBackup.fileName}`);
  console.log(`Recovery bundle created: ${recoveryBundle.fileName}`);
  console.log(`Retention applied: kept ${retentionCount}, deleted ${pruneResult.deleted.length}`);
  console.log(`Recovery retention applied: kept ${recoveryRetentionCount}, deleted ${pruneRecoveryResult.deleted.length}`);

  if (externalTarget.trim()) {
    const syncResult = await syncBackupsToExternalTarget({
      targetDirectory: externalTarget.trim(),
      databaseBackup,
      recoveryBundle,
    });

    console.log(`External sync completed to: ${syncResult.targetDirectory}`);
    console.log(`Database copy: ${syncResult.databaseBackupPath}`);
    console.log(`Recovery copy: ${syncResult.recoveryBundlePath}`);
  } else {
    console.log('No external target configured. Local backups only.');
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Scheduled backup run failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
