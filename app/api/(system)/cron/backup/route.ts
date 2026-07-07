import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createDatabaseBackup, pruneDatabaseBackups } from '@/lib/db/database-backups';
import { createRecoveryBundle, pruneRecoveryBundles } from '@/lib/db/recovery-bundles';
import { syncBackupsToExternalTarget } from '@/lib/db/backup-sync';

// This endpoint is internal and should only be called from localhost (by the Docker entrypoint)
export async function POST(request: Request) {
  try {
    // Basic protection: Ensure it's called from localhost
    const url = new URL(request.url);
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    let syncResult = null;
    if (externalTarget.trim()) {
      syncResult = await syncBackupsToExternalTarget({
        targetDirectory: externalTarget.trim(),
        databaseBackup,
        recoveryBundle,
      });
    }

    return NextResponse.json({
      success: true,
      databaseBackup: databaseBackup.fileName,
      recoveryBundle: recoveryBundle.fileName,
      retention: { kept: retentionCount, deleted: pruneResult.deleted.length },
      recoveryRetention: { kept: recoveryRetentionCount, deleted: pruneRecoveryResult.deleted.length },
      sync: syncResult ? { target: syncResult.targetDirectory } : 'Local only',
    });
  } catch (error) {
    console.error('API Backup failed:', error);
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
  }
}
