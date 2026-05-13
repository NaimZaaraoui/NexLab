import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { getBackupFileByName } from '@/lib/database-backups';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ fileName: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const { fileName } = await context.params;
  const backup = await getBackupFileByName(fileName);

  if (!backup) {
    return NextResponse.json({ error: 'Sauvegarde introuvable.' }, { status: 404 });
  }

  const fileStream = fs.createReadStream(backup.absolutePath);

  return new NextResponse(fileStream as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${backup.fileName}"`,
      'Content-Length': String(backup.size),
    },
  });
}
