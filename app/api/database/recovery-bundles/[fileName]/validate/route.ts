import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { getRecoveryBundleByName, testRecoveryBundleRestore, validateRecoveryBundleFile } from '@/lib/recovery-bundles';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ fileName: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });
  const { fileName } = await context.params;

  const bundle = await getRecoveryBundleByName(fileName);
  if (!bundle) {
    return NextResponse.json({ error: 'Bundle de reprise introuvable.' }, { status: 404 });
  }

  const validation = await validateRecoveryBundleFile(bundle.absolutePath);
  const restoreTest = await testRecoveryBundleRestore(bundle.fileName);

  await createAuditLog({
    action: 'database.recovery_bundle_test',
    severity: restoreTest.valid ? 'INFO' : 'CRITICAL',
    entity: 'recovery_bundle',
    entityId: bundle.fileName,
    details: {
      fileName: bundle.fileName,
      validation,
      restoreTest,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({
    fileName: bundle.fileName,
    validation,
    restoreTest,
  });
}
