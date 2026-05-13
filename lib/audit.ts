import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getUserIdsByRoles, notifyUsers } from '@/lib/notifications';

type AuditInput = {
  action: string;
  severity?: 'INFO' | 'WARN' | 'CRITICAL';
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AuditRequestContext = {
  headers: Headers;
};

export function getRequestMeta(request: AuditRequestContext) {
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const ipAddress = forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent') || null;
  return { ipAddress, userAgent };
}

function serializeDetails(details: AuditInput['details']) {
  if (!details) return null;
  if (typeof details === 'string') return details;
  try {
    return JSON.stringify(details);
  } catch {
    return null;
  }
}

export async function createAuditLog(input: AuditInput) {
  try {
    const session = await auth();
    const user = session?.user;

    const log = await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        userName: user?.name || null,
        userEmail: user?.email || null,
        userRole: user?.role || null,
        action: input.action,
        severity: input.severity || 'INFO',
        entity: input.entity,
        entityId: input.entityId || null,
        details: serializeDetails(input.details),
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });

    if ((input.severity || 'INFO') === 'CRITICAL') {
      try {
        const adminIds = await getUserIdsByRoles(['ADMIN'], user?.id);
        if (adminIds.length > 0) {
          await notifyUsers({
            userIds: adminIds,
            type: 'audit_critical',
            title: 'Événement critique (Audit)',
            message: `${log.action} sur ${log.entity}${log.entityId ? ` (${log.entityId})` : ''}`,
          });
        }
      } catch (notificationError) {
        console.error('Critical audit notification error:', notificationError);
      }
    }
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
