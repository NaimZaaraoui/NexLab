export type InventoryStatus = 'ok' | 'low' | 'critical' | 'expired';
export type ReorderUrgency = 'normal' | 'warning' | 'critical';

const MS_PER_DAY = 86_400_000;

type ListItem = {
  currentStock: number;
  minThreshold: number;
  name: string;
  lots: Array<{
    expiryDate: Date | string;
    remaining: number;
    isActive: boolean;
  }>;
};

export function computeInventoryDerived(item: ListItem) {
  const activeLots = item.lots.filter((lot) => lot.isActive && lot.remaining > 0);
  const now = new Date();

  const nearestExpiryDate = activeLots
    .map((lot) => new Date(lot.expiryDate))
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

  const hasExpiredLot = activeLots.some((lot) => new Date(lot.expiryDate).getTime() < now.getTime());

  let status: InventoryStatus = 'ok';
  if (hasExpiredLot) {
    status = 'expired';
  } else if (item.currentStock <= 0) {
    status = 'critical';
  } else if (item.currentStock < item.minThreshold) {
    status = 'low';
  }

  return {
    status,
    nearestExpiry: nearestExpiryDate,
    daysUntilExpiry: nearestExpiryDate ? Math.ceil((nearestExpiryDate.getTime() - now.getTime()) / MS_PER_DAY) : null,
  };
}

export function sortInventoryByStatusThenName<T extends { status: InventoryStatus; name: string }>(items: T[]) {
  const order: Record<InventoryStatus, number> = {
    expired: 0,
    critical: 1,
    low: 2,
    ok: 3,
  };

  return [...items].sort((a, b) => {
    const rankDiff = order[a.status] - order[b.status];
    if (rankDiff !== 0) return rankDiff;
    return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
  });
}

export function computeReorderSuggestion(item: {
  currentStock: number;
  minThreshold: number;
  unit: string;
  status: InventoryStatus;
  daysUntilExpiry: number | null;
  avgDailyConsumption30d?: number | null;
  leadTimeDays?: number;
  safetyDays?: number;
}) {
  const threshold = Math.max(item.minThreshold, 1);
  const soonExpiring = item.daysUntilExpiry !== null && item.daysUntilExpiry > 0 && item.daysUntilExpiry <= 30;
  const avgDaily = Math.max(item.avgDailyConsumption30d ?? 0, 0);
  const leadTimeDays = Math.max(item.leadTimeDays ?? 14, 1);
  const safetyDays = Math.max(item.safetyDays ?? 14, 1);
  const dynamicTarget = avgDaily > 0 ? Math.ceil(avgDaily * (leadTimeDays + safetyDays)) : 0;
  const coverageDays = avgDaily > 0 ? Math.floor(item.currentStock / avgDaily) : null;

  let targetStock = Math.max(threshold, dynamicTarget);
  let urgency: ReorderUrgency = 'normal';
  let reason = 'Stock conforme';

  if (item.status === 'expired') {
    targetStock = Math.max(targetStock, threshold * 2, threshold + 1);
    urgency = 'critical';
    reason = 'Remplacer un stock expiré';
  } else if (item.status === 'critical') {
    targetStock = Math.max(targetStock, threshold * 3, threshold + 2);
    urgency = 'critical';
    reason = 'Prévenir une rupture immédiate';
  } else if (item.status === 'low') {
    targetStock = Math.max(targetStock, threshold * 2, threshold + 1);
    urgency = 'warning';
    reason = 'Revenir à un niveau de sécurité';
  } else if (soonExpiring) {
    targetStock = Math.max(targetStock, Math.ceil(threshold * 1.5), threshold + 1);
    urgency = 'warning';
    reason = 'Anticiper une expiration proche';
  } else if (coverageDays !== null && coverageDays < leadTimeDays) {
    targetStock = Math.max(targetStock, threshold * 2, threshold + 1);
    urgency = 'critical';
    reason = `Couverture inférieure à ${leadTimeDays} jours`;
  } else if (coverageDays !== null && coverageDays < leadTimeDays + safetyDays) {
    targetStock = Math.max(targetStock, threshold * 2, threshold + 1);
    urgency = 'warning';
    reason = `Stock de sécurité inférieur à ${leadTimeDays + safetyDays} jours`;
  }

  const suggestedQuantity = Math.max(Math.ceil(targetStock - item.currentStock), 0);

  return {
    urgency,
    reason,
    targetStock,
    suggestedQuantity,
    unit: item.unit,
    coverageDays,
    avgDailyConsumption30d: avgDaily,
    shouldReorder: suggestedQuantity > 0,
  };
}
