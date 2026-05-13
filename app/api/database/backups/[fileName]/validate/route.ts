import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { getBackupFileByName, testDatabaseBackupRestore, validateDatabaseBackupFile } from '@/lib/database-backups';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ fileName: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });
  const { fileName } = await context.params;

  const backup = await getBackupFileByName(fileName);
  if (!backup) {
    return NextResponse.json({ error: 'Sauvegarde introuvable.' }, { status: 404 });
  }

  const validation = validateDatabaseBackupFile(backup.absolutePath);
  const restoreTest = await testDatabaseBackupRestore(backup.fileName);

  await createAuditLog({
    action: 'database.backup_test',
    severity: restoreTest.valid ? 'INFO' : 'CRITICAL',
    entity: 'database_backup',
    entityId: backup.fileName,
    details: {
      fileName: backup.fileName,
      validation,
      restoreTest,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({
    fileName: backup.fileName,
    validation,
    restoreTest,
  });
}
