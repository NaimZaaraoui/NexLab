import { prisma } from '@/lib/prisma';
import { computeInventoryDerived } from '@/lib/inventory-shared';
import { getUserIdsByRoles, notifyUsers } from '@/lib/notifications';

export async function notifyInventoryStatus(itemId: string, excludeUserId?: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      lots: true,
    },
  });

  if (!item) return;

  const derived = computeInventoryDerived({
    currentStock: item.currentStock,
    minThreshold: item.minThreshold,
    name: item.name,
    lots: item.lots,
  });

  if (derived.status === 'ok') {
    return;
  }

  const statusLabel =
    derived.status === 'expired'
      ? 'Stock expiré'
      : derived.status === 'critical'
      ? 'Stock critique'
      : 'Stock sous seuil';

  const adminIds = await getUserIdsByRoles(['ADMIN', 'TECHNICIEN'], excludeUserId);

  await notifyUsers({
    userIds: adminIds,
    type: 'inventory_alert',
    title: statusLabel,
    message: `${item.name} · ${item.currentStock} ${item.unit} (seuil ${item.minThreshold})`,
  });
}
