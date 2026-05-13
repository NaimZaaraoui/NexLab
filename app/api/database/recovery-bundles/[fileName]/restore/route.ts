import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { createRecoveryBundle, restoreRecoveryBundle } from '@/lib/recovery-bundles';
import { validateActiveDatabase } from '@/lib/database-backups';

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
    const safetyBundle = await createRecoveryBundle();

    await prisma.$disconnect();
    const restored = await restoreRecoveryBundle(fileName);
    const validation = validateActiveDatabase();

    await createAuditLog({
      action: 'database.recovery_bundle_restore',
      severity: 'CRITICAL',
      entity: 'recovery_bundle',
      entityId: restored.bundle.fileName,
      details: {
        restoredFrom: restored.bundle.fileName,
        restoredUploads: restored.restoredUploads,
        safetyBundle: safetyBundle.fileName,
        validation,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      message: 'Restauration du bundle terminée. Un bundle de sécurité a été créé avant écrasement.',
      restoredFrom: restored.bundle.fileName,
      restoredUploads: restored.restoredUploads,
      safetyBundle,
      validation,
    });
  } catch (error) {
    console.error('Error restoring recovery bundle:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur lors de la restauration du bundle de reprise.',
      },
      { status: 500 }
    );
  }
}
