import fs from 'node:fs/promises';
import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAnyRole } from '@/lib/security/authz';
import {
  getDatabaseBackupDirectory,
  getDatabaseFilePath,
  isBackupEncryptionConfigured,
  listDatabaseBackups,
  validateStoredDatabaseBackupFile,
} from '@/lib/db/database-backups';
import { listRecoveryBundles, validateRecoveryBundleFile } from '@/lib/db/recovery-bundles';
import { checkAuditImmutabilityTriggers } from '@/lib/security/audit-trail-setup';
import { checkDatabaseOpsRateLimit } from '@/lib/security/rate-limit';
import { verifyValidationHash } from '@/lib/security/validation-seal';
import { areLocalFileToolsUnavailable, LOCAL_FILE_TOOLS_UNAVAILABLE_MESSAGE } from '@/lib/core/deployment';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;
  if (areLocalFileToolsUnavailable()) {
    return NextResponse.json({ error: LOCAL_FILE_TOOLS_UNAVAILABLE_MESSAGE }, { status: 501 });
  }

  const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
  const allowed = await checkDatabaseOpsRateLimit(`health:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429 }
    );
  }

  try {
    const databasePath = getDatabaseFilePath();
    const backupDirectory = getDatabaseBackupDirectory();

    const [dbPing, dbStat, backupStat, backups, recoveryBundles, maintenanceSetting, externalTargetSetting, criticalLogs, latestBackupTestLog, latestRecoveryTestLog, recentValidatedAnalyses] = await Promise.all([
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
      prisma.analysis.findMany({
        where: { status: 'validated_bio', validationHash: { not: null } },
        orderBy: { validatedBioAt: 'desc' },
        take: 20,
        include: { results: true }
      }),
    ]);

    const auditTrailIntegrity = await checkAuditImmutabilityTriggers();

    let sealCompromisedCount = 0;
    for (const a of recentValidatedAnalyses) {
      if (!verifyValidationHash(a, a.results)) {
        sealCompromisedCount++;
      }
    }

    let pragmaIntegrity: { ok: boolean; details: string } = { ok: false, details: 'Non vérifié' };
    const integrityClient = createClient({
      url: process.env.DATABASE_URL || `file:${getDatabaseFilePath()}`,
      authToken: process.env.DATABASE_AUTH_TOKEN,
      encryptionKey: process.env.DATABASE_ENCRYPTION_KEY,
    });
    try {
      const result = await integrityClient.execute('PRAGMA integrity_check');
      const details = result.rows.map((row) => String((row as Record<string, unknown>).integrity_check));
      const isOk = details.length === 1 && details[0] === 'ok';
      pragmaIntegrity = {
        ok: isOk,
        details: isOk ? 'ok' : details.join('; '),
      };
    } catch (err) {
      pragmaIntegrity = { ok: false, details: String(err) };
    } finally {
      integrityClient.close();
    }

    const latestBackupCreatedAt = backups[0]?.createdAt ?? null;
    const latestBackupAgeDays = latestBackupCreatedAt
      ? (Date.now() - new Date(latestBackupCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
      : null;
    const latestBackupValidation = backups[0] ? await validateStoredDatabaseBackupFile(backups[0].absolutePath) : null;
    const latestRecoveryValidation = recoveryBundles[0]
      ? await validateRecoveryBundleFile(recoveryBundles[0].absolutePath)
      : null;

    return NextResponse.json({
      database: {
        reachable: Array.isArray(dbPing),
        fileExists: Boolean(dbStat?.isFile()),
        path: databasePath,
        size: dbStat?.size ?? null,
        encryptionKey: {
          configured: Boolean(process.env.DATABASE_ENCRYPTION_KEY),
          keyLength: process.env.DATABASE_ENCRYPTION_KEY?.length ?? 0,
        },
      },
      backups: {
        count: backups.length,
        latestCreatedAt: latestBackupCreatedAt,
        isFresh: latestBackupAgeDays !== null ? latestBackupAgeDays < 7 : false,
        latestValidation: latestBackupValidation,
        encryptedCount: backups.filter((backup) => backup.encrypted).length,
        encryptionConfigured: isBackupEncryptionConfigured(),
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
      auditTrail: {
        immutable: auditTrailIntegrity.ok,
        missingTriggers: auditTrailIntegrity.missingTriggers,
      },
      integrity: {
        ok: pragmaIntegrity.ok,
        details: pragmaIntegrity.details,
      },
      validationSeal: {
        checkedCount: recentValidatedAnalyses.length,
        compromisedCount: sealCompromisedCount,
        ok: sealCompromisedCount === 0,
      },
    });
  } catch (error) {
    console.error('Error computing database health:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul de la santé système.' },
      { status: 500 }
    );
  }
}
