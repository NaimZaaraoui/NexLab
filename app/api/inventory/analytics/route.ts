import { NextResponse } from 'next/server';
import { subDays, startOfDay } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/authz';

const WINDOW_DAYS = 30;

export async function GET() {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const since = startOfDay(subDays(new Date(), WINDOW_DAYS - 1));

    const movements = await prisma.stockMovement.findMany({
      where: {
        performedAt: { gte: since },
        type: { in: ['consumption', 'waste'] },
      },
      select: {
        itemId: true,
        type: true,
        quantity: true,
        performedAt: true,
        item: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: true,
          },
        },
      },
      orderBy: { performedAt: 'asc' },
    });

    const days = Array.from({ length: WINDOW_DAYS }).map((_, index) => {
      const date = startOfDay(subDays(new Date(), WINDOW_DAYS - 1 - index));
      return {
        date: date.toISOString().slice(0, 10),
        consumption: 0,
        waste: 0,
      };
    });
    const dayMap = new Map(days.map((day) => [day.date, day]));

    const itemMap = new Map<
      string,
      {
        itemId: string;
        name: string;
        unit: string;
        category: string;
        consumption30d: number;
        waste30d: number;
      }
    >();

    for (const movement of movements) {
      const amount = Math.abs(movement.quantity);
      const dayKey = startOfDay(new Date(movement.performedAt)).toISOString().slice(0, 10);
      const day = dayMap.get(dayKey);
      if (day) {
        if (movement.type === 'consumption') day.consumption += amount;
        if (movement.type === 'waste') day.waste += amount;
      }

      const current = itemMap.get(movement.itemId) || {
        itemId: movement.itemId,
        name: movement.item.name,
        unit: movement.item.unit,
        category: movement.item.category,
        consumption30d: 0,
        waste30d: 0,
      };

      if (movement.type === 'consumption') current.consumption30d += amount;
      if (movement.type === 'waste') current.waste30d += amount;

      itemMap.set(movement.itemId, current);
    }

    const items = Array.from(itemMap.values())
      .map((item) => ({
        ...item,
        avgDailyConsumption30d: Number((item.consumption30d / WINDOW_DAYS).toFixed(2)),
      }))
      .sort((a, b) => b.consumption30d - a.consumption30d);

    const totalConsumption30d = items.reduce((sum, item) => sum + item.consumption30d, 0);
    const totalWaste30d = items.reduce((sum, item) => sum + item.waste30d, 0);

    return NextResponse.json({
      windowDays: WINDOW_DAYS,
      totals: {
        consumption30d: Number(totalConsumption30d.toFixed(2)),
        waste30d: Number(totalWaste30d.toFixed(2)),
        avgDailyConsumption30d: Number((totalConsumption30d / WINDOW_DAYS).toFixed(2)),
      },
      series: days.map((day) => ({
        ...day,
        consumption: Number(day.consumption.toFixed(2)),
        waste: Number(day.waste.toFixed(2)),
      })),
      topConsumedItems: items.slice(0, 6),
      topWastedItems: [...items].sort((a, b) => b.waste30d - a.waste30d).filter((item) => item.waste30d > 0).slice(0, 6),
    });
  } catch (error) {
    console.error('Erreur GET /api/inventory/analytics:', error);
    return NextResponse.json({ error: "Erreur lors du chargement de l'analytique inventaire" }, { status: 500 });
  }
}
