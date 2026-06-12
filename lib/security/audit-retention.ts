import { prisma } from '@/lib/db/prisma';

/**
 * Archive les anciens logs d'audit vers `audit_logs_archive`.
 *
 * IMPORTANT : Conform à l'immutabilité réglementaire (ISO 15189),
 * les logs ne sont JAMAIS supprimés de la table active.
 * Cette fonction copie uniquement vers l'archive (duplication intentionnelle).
 *
 * Les triggers SQLite installés au démarrage (`audit-trail-setup.ts`)
 * bloqueront de toute façon tout DELETE sur `audit_logs`.
 */
export async function archiveAndPurgeAuditLogs(retentionDays: number) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const oldLogs = await prisma.auditLog.findMany({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: 'asc' },
    take: 5000,
  });

  if (oldLogs.length === 0) {
    return { archived: oldLogs.length, cutoff: cutoff.toISOString() };
  }

  await prisma.auditLogArchive.createMany({
    data: oldLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.userName,
      userEmail: log.userEmail,
      userRole: log.userRole,
      action: log.action,
      severity: log.severity,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }))
  });

  return { archived: oldLogs.length, cutoff: cutoff.toISOString() };
}
