import { prisma } from '@/lib/prisma';

export async function archiveAndPurgeAuditLogs(retentionDays: number) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const oldLogs = await prisma.auditLog.findMany({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: 'asc' },
    take: 5000,
  });

  if (oldLogs.length === 0) {
    return { archived: 0, deleted: 0, cutoff: cutoff.toISOString() };
  }

  await prisma.$transaction([
    prisma.auditLogArchive.createMany({
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
      })),
    }),
    prisma.auditLog.deleteMany({
      where: { id: { in: oldLogs.map((log) => log.id) } },
    }),
  ]);

  return { archived: oldLogs.length, deleted: oldLogs.length, cutoff: cutoff.toISOString() };
}
