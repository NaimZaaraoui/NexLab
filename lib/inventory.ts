import { prisma } from '@/lib/prisma';
export { computeInventoryDerived, computeReorderSuggestion, sortInventoryByStatusThenName } from '@/lib/inventory-shared';

export async function applyAutomaticConsumptionForAnalysis(params: {
  analysisId: string;
  performedBy: string;
}) {
  const { analysisId, performedBy } = params;

  return prisma.$transaction(async (tx) => {
    const analysis = await tx.analysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        orderNumber: true,
        results: {
          select: { testId: true },
        },
      },
    });

    if (!analysis) {
      throw new Error('Analyse introuvable');
    }

    const testIds = Array.from(new Set(analysis.results.map((result) => result.testId)));
    if (testIds.length === 0) {
      return { appliedRules: 0, consumedItems: 0, consumedQuantity: 0 };
    }

    const existingConsumptions = await tx.analysisConsumption.findMany({
      where: {
        analysisId,
        testId: { in: testIds },
      },
      select: {
        testId: true,
        itemId: true,
      },
    });
    const existingKeys = new Set(existingConsumptions.map((entry) => `${entry.testId}:${entry.itemId}`));

    const activeRules = await tx.itemTestRule.findMany({
      where: {
        isActive: true,
        testId: { in: testIds },
        item: { isActive: true },
      },
      select: {
        itemId: true,
        testId: true,
        quantityPerTest: true,
      },
    });

    const pendingRules = activeRules.filter((rule) => !existingKeys.has(`${rule.testId}:${rule.itemId}`));
    if (pendingRules.length === 0) {
      return { appliedRules: 0, consumedItems: 0, consumedQuantity: 0 };
    }

    const groupedByItem = new Map<string, { total: number; rows: Array<{ testId: string; quantity: number }> }>();
    for (const rule of pendingRules) {
      const found = groupedByItem.get(rule.itemId);
      if (found) {
        found.total += rule.quantityPerTest;
        found.rows.push({ testId: rule.testId, quantity: rule.quantityPerTest });
      } else {
        groupedByItem.set(rule.itemId, {
          total: rule.quantityPerTest,
          rows: [{ testId: rule.testId, quantity: rule.quantityPerTest }],
        });
      }
    }

    const itemIds = Array.from(groupedByItem.keys());
    const items = await tx.inventoryItem.findMany({
      where: { id: { in: itemIds }, isActive: true },
      select: {
        id: true,
        name: true,
        unit: true,
        currentStock: true,
        lots: {
          where: { isActive: true, remaining: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
          select: {
            id: true,
            lotNumber: true,
            remaining: true,
          },
        },
      },
    });
    const itemMap = new Map(items.map((item) => [item.id, item]));

    let consumedItems = 0;
    let consumedQuantity = 0;

    for (const [itemId, group] of groupedByItem.entries()) {
      const item = itemMap.get(itemId);
      if (!item) {
        throw new Error("Article d'inventaire introuvable ou inactif");
      }

      if (item.currentStock < group.total) {
        throw new Error(`Stock insuffisant pour "${item.name}" (${item.currentStock} ${item.unit} disponible)`);
      }

      let remainingToConsume = group.total;

      for (const lot of item.lots) {
        if (remainingToConsume <= 0) break;

        const consumeFromLot = Math.min(lot.remaining, remainingToConsume);
        if (consumeFromLot <= 0) continue;

        const nextRemaining = lot.remaining - consumeFromLot;

        await tx.inventoryLot.update({
          where: { id: lot.id },
          data: {
            remaining: nextRemaining,
            isActive: nextRemaining > 0,
          },
        });

        await tx.stockMovement.create({
          data: {
            itemId,
            type: 'consumption',
            quantity: -consumeFromLot,
            lotNumber: lot.lotNumber,
            reason: `Consommation automatique (analyse ${analysis.orderNumber})`,
            performedBy,
          },
        });

        remainingToConsume -= consumeFromLot;
      }

      if (remainingToConsume > 0) {
        await tx.stockMovement.create({
          data: {
            itemId,
            type: 'consumption',
            quantity: -remainingToConsume,
            reason: `Consommation automatique (analyse ${analysis.orderNumber})`,
            performedBy,
          },
        });
      }

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: { decrement: group.total },
        },
      });

      for (const row of group.rows) {
        await tx.analysisConsumption.create({
          data: {
            analysisId,
            testId: row.testId,
            itemId,
            quantity: row.quantity,
          },
        });
      }

      consumedItems += 1;
      consumedQuantity += group.total;
    }

    return {
      appliedRules: pendingRules.length,
      consumedItems,
      consumedQuantity,
    };
  });
}
