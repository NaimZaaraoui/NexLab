import fs from 'node:fs/promises';
import path from 'node:path';
import type { DatabaseBackupFile } from '@/lib/database-backups';
import type { RecoveryBundleFile } from '@/lib/recovery-bundles';

export type ExternalBackupSyncResult = {
  targetDirectory: string;
  databaseBackupPath: string;
  recoveryBundlePath: string;
};

export async function syncBackupsToExternalTarget(params: {
  targetDirectory: string;
  databaseBackup: DatabaseBackupFile;
  recoveryBundle: RecoveryBundleFile;
}) {
  const { targetDirectory, databaseBackup, recoveryBundle } = params;
  const resolvedTarget = path.resolve(targetDirectory);
  const databaseDir = path.join(resolvedTarget, 'database');
  const recoveryDir = path.join(resolvedTarget, 'recovery');

  await fs.mkdir(databaseDir, { recursive: true });
  await fs.mkdir(recoveryDir, { recursive: true });

  const databaseBackupPath = path.join(databaseDir, databaseBackup.fileName);
  const recoveryBundlePath = path.join(recoveryDir, recoveryBundle.fileName);

  await fs.copyFile(databaseBackup.absolutePath, databaseBackupPath);
  await fs.copyFile(recoveryBundle.absolutePath, recoveryBundlePath);

  await fs.writeFile(
    path.join(resolvedTarget, 'latest-sync.json'),
    JSON.stringify(
      {
        syncedAt: new Date().toISOString(),
        databaseBackup: databaseBackup.fileName,
        recoveryBundle: recoveryBundle.fileName,
      },
      null,
      2
    ),
    'utf8'
  );

  return {
    targetDirectory: resolvedTarget,
    databaseBackupPath,
    recoveryBundlePath,
  } satisfies ExternalBackupSyncResult;
}
