import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { pruneDatabaseBackups } from '@/lib/database-backups';
import { pruneRecoveryBundles } from '@/lib/recovery-bundles';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });

  try {
    const retentionSetting = await prisma.setting.findUnique({
      where: { key: 'database_backup_retention_count' },
      select: { value: true },
    });
    const recoveryRetentionSetting = await prisma.setting.findUnique({
      where: { key: 'database_recovery_retention_count' },
      select: { value: true },
    });
    const retainCount = Math.max(0, parseInt(retentionSetting?.value || '10', 10) || 10);
    const recoveryRetainCount = Math.max(0, parseInt(recoveryRetentionSetting?.value || '10', 10) || 10);
    const result = await pruneDatabaseBackups(retainCount);
    const recoveryResult = await pruneRecoveryBundles(recoveryRetainCount);

    await createAuditLog({
      action: 'database.backup_prune',
      severity: 'WARN',
      entity: 'database_backup',
      details: {
        retainCount,
        deletedCount: result.deleted.length,
        deletedFiles: result.deleted.map((item) => item.fileName),
        recoveryRetainCount,
        deletedRecoveryCount: recoveryResult.deleted.length,
        deletedRecoveryFiles: recoveryResult.deleted.map((item) => item.fileName),
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      message:
        result.deleted.length > 0 || recoveryResult.deleted.length > 0
          ? `${result.deleted.length} sauvegarde(s) SQLite et ${recoveryResult.deleted.length} bundle(s) de reprise supprime(s).`
          : 'Aucun fichier a supprimer selon la politique actuelle.',
      retainCount,
      recoveryRetainCount,
      deleted: result.deleted,
      deletedRecovery: recoveryResult.deleted,
    });
  } catch (error) {
    console.error('Error pruning database backups:', error);
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage des sauvegardes.' },
      { status: 500 }
    );
  }
}
