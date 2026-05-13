import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import {
  createNamedDatabaseBackup,
  restoreDatabaseBackup,
  validateActiveDatabase,
} from '@/lib/database-backups';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ fileName: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });
  const { fileName } = await context.params;

  try {
    const safetyBackup = await createNamedDatabaseBackup('pre-restore-safety');

    await prisma.$disconnect();
    const restoredBackup = await restoreDatabaseBackup(fileName);
    const validation = validateActiveDatabase();

    await createAuditLog({
      action: 'database.backup_restore',
      severity: 'CRITICAL',
      entity: 'database_backup',
      entityId: restoredBackup.fileName,
      details: {
        restoredFrom: restoredBackup.fileName,
        safetyBackup: safetyBackup.fileName,
        validation,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      message: 'Restauration terminée. Une sauvegarde de sécurité a été créée avant écrasement.',
      restoredFrom: restoredBackup.fileName,
      safetyBackup,
      validation,
    });
  } catch (error) {
    console.error('Error restoring database backup:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur lors de la restauration de la sauvegarde.',
      },
      { status: 500 }
    );
  }
}
