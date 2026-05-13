import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { getBackupFileByName } from '@/lib/database-backups';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ fileName: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const { fileName } = await context.params;
  const meta = getRequestMeta({ headers: request.headers });

  try {
    const backup = await getBackupFileByName(fileName);

    if (!backup) {
      return NextResponse.json({ error: 'Sauvegarde introuvable.' }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(backup.absolutePath);

    await createAuditLog({
      action: 'database.backup_download',
      severity: 'INFO',
      entity: 'database_backup',
      entityId: backup.fileName,
      details: {
        fileName: backup.fileName,
        size: backup.size,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.sqlite3',
        'Content-Disposition': `attachment; filename="${backup.fileName}"`,
        'Content-Length': String(backup.size),
      },
    });
  } catch (error) {
    console.error('Error downloading database backup:', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement de la sauvegarde.' },
      { status: 500 }
    );
  }
}
