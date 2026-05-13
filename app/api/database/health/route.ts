import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { getDatabaseBackupDirectory, getDatabaseFilePath, listDatabaseBackups, validateDatabaseBackupFile } from '@/lib/database-backups';
import { listRecoveryBundles, validateRecoveryBundleFile } from '@/lib/recovery-bundles';

export const runtime = 'nodejs';

export async function GET() {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  try {
    const databasePath = getDatabaseFilePath();
    const backupDirectory = getDatabaseBackupDirectory();

    const [dbPing, dbStat, backupStat, backups, recoveryBundles, maintenanceSetting, externalTargetSetting, criticalLogs, latestBackupTestLog, latestRecoveryTestLog] = await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      fs.stat(databasePath).catch(() => null),
      fs.statfs(backupDirectory).catch(() => null),
      listDatabaseBackups(),
      listRecoveryBundles(),
      prisma.setting.findUnique({
        where: { key: 'maintenance_mode' },
        select: { value: true },
      }),
      prisma.setting.findUnique({
        where: { key: 'database_backup_external_target' },
        select: { value: true },
      }),
      prisma.auditLog.findMany({
        where: { severity: 'CRITICAL' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.findFirst({
        where: { action: 'database.backup_test' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, severity: true },
      }),
      prisma.auditLog.findFirst({
        where: { action: 'database.recovery_bundle_test' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, severity: true },
      }),
    ]);

    const latestBackupCreatedAt = backups[0]?.createdAt ?? null;
    const latestBackupAgeDays = latestBackupCreatedAt
      ? (Date.now() - new Date(latestBackupCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
      : null;
    const latestBackupValidation = backups[0] ? validateDatabaseBackupFile(backups[0].absolutePath) : null;
    const latestRecoveryValidation = recoveryBundles[0]
      ? await validateRecoveryBundleFile(recoveryBundles[0].absolutePath)
      : null;

    return NextResponse.json({
      database: {
        reachable: Array.isArray(dbPing),
        fileExists: Boolean(dbStat?.isFile()),
        path: databasePath,
        size: dbStat?.size ?? null,
      },
      backups: {
        count: backups.length,
        latestCreatedAt: latestBackupCreatedAt,
        isFresh: latestBackupAgeDays !== null ? latestBackupAgeDays < 7 : false,
        latestValidation: latestBackupValidation,
        freeSpaceBytes:
          backupStat && typeof backupStat.bavail === 'number' && typeof backupStat.bsize === 'number'
            ? Number(backupStat.bavail) * Number(backupStat.bsize)
            : null,
      },
      recoveryBundles: {
        count: recoveryBundles.length,
        latestCreatedAt: recoveryBundles[0]?.createdAt ?? null,
        latestValidation: latestRecoveryValidation,
      },
      testHistory: {
        lastBackupTestAt: latestBackupTestLog?.createdAt?.toISOString() ?? null,
        lastBackupTestOk: latestBackupTestLog ? latestBackupTestLog.severity !== 'CRITICAL' : null,
        lastRecoveryTestAt: latestRecoveryTestLog?.createdAt?.toISOString() ?? null,
        lastRecoveryTestOk: latestRecoveryTestLog ? latestRecoveryTestLog.severity !== 'CRITICAL' : null,
      },
      externalTarget: {
        configuredPath: externalTargetSetting?.value || '',
        available: externalTargetSetting?.value
          ? Boolean(await fs.stat(externalTargetSetting.value).catch(() => null))
          : false,
      },
      maintenance: {
        enabled: maintenanceSetting?.value === 'true',
      },
      criticalLogs: criticalLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error computing database health:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul de la santé système.' },
      { status: 500 }
    );
  }
}
