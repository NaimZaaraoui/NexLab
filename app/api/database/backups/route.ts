import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import {
  createDatabaseBackup,
  getDatabaseBackupDirectory,
  getDatabaseFilePath,
  listDatabaseBackups,
  pruneDatabaseBackups,
  validateDatabaseBackupFile,
} from '@/lib/database-backups';

export const runtime = 'nodejs';

export async function GET() {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  try {
    const [items] = await Promise.all([listDatabaseBackups()]);

    return NextResponse.json({
      databasePath: getDatabaseFilePath(),
      backupDirectory: getDatabaseBackupDirectory(),
      items,
    });
  } catch (error) {
    console.error('Error listing database backups:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des sauvegardes.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });

  try {
    const backup = await createDatabaseBackup();
    const validation = validateDatabaseBackupFile(backup.absolutePath);
    const retentionSetting = await prisma.setting.findUnique({
      where: { key: 'database_backup_retention_count' },
      select: { value: true },
    });
    const retainCount = Math.max(0, parseInt(retentionSetting?.value || '10', 10) || 10);
    const pruneResult = await pruneDatabaseBackups(retainCount);

    await createAuditLog({
      action: 'database.backup_create',
      severity: 'WARN',
      entity: 'database_backup',
      entityId: backup.fileName,
      details: {
        fileName: backup.fileName,
        size: backup.size,
        validation,
        retainCount,
        deletedAfterCreate: pruneResult.deleted.map((item) => item.fileName),
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      message: 'Sauvegarde créée avec succès.',
      item: backup,
      validation,
      retention: {
        retainCount,
        deletedCount: pruneResult.deleted.length,
      },
    });
  } catch (error) {
    console.error('Error creating database backup:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la sauvegarde.' },
      { status: 500 }
    );
  }
}
