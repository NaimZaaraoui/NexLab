import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { getRecoveryBundleByName } from '@/lib/recovery-bundles';

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
    const bundle = await getRecoveryBundleByName(fileName);
    if (!bundle) {
      return NextResponse.json({ error: 'Bundle introuvable.' }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(bundle.absolutePath);

    await createAuditLog({
      action: 'database.recovery_bundle_download',
      severity: 'WARN',
      entity: 'recovery_bundle',
      entityId: bundle.fileName,
      details: {
        fileName: bundle.fileName,
        size: bundle.size,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${bundle.fileName}"`,
        'Content-Length': String(bundle.size),
      },
    });
  } catch (error) {
    console.error('Error downloading recovery bundle:', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement du bundle de reprise.' },
      { status: 500 }
    );
  }
}
