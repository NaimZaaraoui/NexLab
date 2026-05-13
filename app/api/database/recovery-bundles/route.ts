import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import {
  createRecoveryBundle,
  getRecoveryBundleDirectory,
  listRecoveryBundles,
  pruneRecoveryBundles,
  validateRecoveryBundleFile,
} from '@/lib/recovery-bundles';

export const runtime = 'nodejs';

export async function GET() {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  try {
    const items = await listRecoveryBundles();
    return NextResponse.json({
      recoveryDirectory: getRecoveryBundleDirectory(),
      items,
    });
  } catch (error) {
    console.error('Error listing recovery bundles:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des bundles de reprise.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });

  try {
    const bundle = await createRecoveryBundle();
    const validation = await validateRecoveryBundleFile(bundle.absolutePath);
    const retentionSetting = await prisma.setting.findUnique({
      where: { key: 'database_recovery_retention_count' },
      select: { value: true },
    });
    const retainCount = Math.max(0, parseInt(retentionSetting?.value || '10', 10) || 10);
    const pruneResult = await pruneRecoveryBundles(retainCount);

    await createAuditLog({
      action: 'database.recovery_bundle_create',
      severity: 'CRITICAL',
      entity: 'recovery_bundle',
      entityId: bundle.fileName,
      details: {
        fileName: bundle.fileName,
        size: bundle.size,
        validation,
        retainCount,
        deletedAfterCreate: pruneResult.deleted.map((item) => item.fileName),
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      message: 'Bundle de reprise créé avec succès.',
      item: bundle,
      validation,
      retention: {
        retainCount,
        deletedCount: pruneResult.deleted.length,
      },
    });
  } catch (error) {
    console.error('Error creating recovery bundle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création du bundle de reprise.' },
      { status: 500 }
    );
  }
}
