import { prisma } from './prisma';

export async function notifyUsers(
  params: {
    userIds:     string[];
    type:        string;
    title:       string;
    message:     string;
    analysisId?: string;
  }
) {
  if (!params.userIds.length) return;
  
  try {
    await prisma.notification.createMany({
      data: params.userIds.map(userId => ({
        userId,
        type:        params.type,
        title:       params.title,
        message:     params.message,
        analysisId:  params.analysisId,
      }))
    });

    // Cleanup: Keep only last 100 notifications per user (approximate)
    // and remove notifications older than 30 days
    await prisma.notification.deleteMany({
      where: {
        userId: { in: params.userIds },
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      }
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}

export async function getUserIdsByRoles(
  roles: string[],
  excludeUserId?: string
): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      role: { in: roles },
      isActive: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {})
    },
    select: { id: true }
  });
  return users.map(u => u.id);
}
