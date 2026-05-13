import path from 'node:path';
import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import {
  ensureBackupDirectory,
  getDatabaseBackupDirectory,
  validateDatabaseBackupFile,
} from '@/lib/database-backups';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file || !file.name.endsWith('.sqlite')) {
    return NextResponse.json(
      { error: 'Fichier invalide. Seuls les fichiers .sqlite sont acceptés.' },
      { status: 400 }
    );
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  await ensureBackupDirectory();
  const destPath = path.join(getDatabaseBackupDirectory(), safeFileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(destPath, buffer);

  const validation = validateDatabaseBackupFile(destPath);
  if (!validation.valid) {
    await fs.unlink(destPath);
    return NextResponse.json(
      { error: `Le fichier uploadé est corrompu: ${validation.issues.join(', ')}` },
      { status: 422 }
    );
  }

  const stat = await fs.stat(destPath);

  await createAuditLog({
    action: 'database.backup_upload',
    severity: 'WARN',
    entity: 'database_backup',
    entityId: safeFileName,
    details: { fileName: safeFileName, size: stat.size, validation },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({
    message: 'Fichier de sauvegarde importé avec succès.',
    item: {
      fileName: safeFileName,
      absolutePath: destPath,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
    },
    validation,
  });
}
