import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { archiveAndPurgeAuditLogs } from '@/lib/audit-retention';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const body = await request.json().catch(() => ({} as { retentionDays?: number; dryRun?: boolean }));
    const retentionDays = Math.min(Math.max(Number(body.retentionDays ?? 730), 30), 3650);
    const dryRun = Boolean(body.dryRun);
    const meta = getRequestMeta({ headers: request.headers });

    if (dryRun) {
      return NextResponse.json({
        success: true,
        retentionDays,
        message: 'Dry-run actif: aucune suppression effectuée.',
      });
    }

    const result = await archiveAndPurgeAuditLogs(retentionDays);

    await createAuditLog({
      action: 'audit.retention_apply',
      severity: 'WARN',
      entity: 'audit_log',
      details: {
        retentionDays,
        archived: result.archived,
        deleted: result.deleted,
        cutoff: result.cutoff,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      success: true,
      retentionDays,
      ...result,
    });
  } catch (error) {
    console.error('Error applying audit retention:', error);
    return NextResponse.json({ error: 'Erreur lors de l’application de la rétention.' }, { status: 500 });
  }
}
