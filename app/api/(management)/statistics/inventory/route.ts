import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { subDays, startOfYear, startOfMonth, startOfDay } from 'date-fns';
import { requireAuthUser } from '@/lib/security/authz';
import { checkStatisticsRateLimit } from '@/lib/security/rate-limit';

function buildRange(range: string, from?: string | null, to?: string | null) {
  const endDate = new Date();
  let startDate = startOfDay(new Date());

  if (from && to) return { startDate: new Date(from), endDate: new Date(to) };

  if (range === '7d') startDate = subDays(startOfDay(new Date()), 7);
  else if (range === '30d') startDate = subDays(startOfDay(new Date()), 30);
  else if (range === 'month') startDate = startOfMonth(new Date());
  else if (range === 'ytd') startDate = startOfYear(new Date());
  else if (range === 'all') startDate = new Date(0);

  return { startDate, endDate };
}

export async function GET(request: Request) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
    if (!(await checkStatisticsRateLimit(`stats-inventory:${ip}`))) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const { startDate, endDate } = buildRange(range, searchParams.get('from'), searchParams.get('to'));

    const [movements, consumptions, criticalItems] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { performedAt: { gte: startDate, lte: endDate } },
        select: {
          id: true,
          type: true,
          quantity: true,
          performedAt: true,
          item: { select: { id: true, name: true, unit: true, category: true } },
        },
      }),
      prisma.analysisConsumption.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: {
          quantity: true,
          item: { select: { id: true, name: true, unit: true, category: true } },
        },
      }),
      prisma.inventoryItem.findMany({
        where: { isActive: true },
        select: { id: true, name: true, unit: true, category: true, currentStock: true, minThreshold: true },
      }),
    ]);

    // Consumption ranking by item
    const consumptionMap: Record<string, { id: string; name: string; unit: string; category: string; totalQty: number; count: number }> = {};
    consumptions.forEach(c => {
      const id = c.item.id;
      if (!consumptionMap[id])
        consumptionMap[id] = { id, name: c.item.name, unit: c.item.unit, category: c.item.category, totalQty: 0, count: 0 };
      consumptionMap[id].totalQty += c.quantity;
      consumptionMap[id].count++;
    });
    const consumptionRanking = Object.values(consumptionMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 15);

    // Movement type breakdown
    const movTypeMap: Record<string, number> = {};
    movements.forEach(m => {
      movTypeMap[m.type] = (movTypeMap[m.type] || 0) + m.quantity;
    });
    const movementTypeBreakdown = Object.entries(movTypeMap).map(([type, quantity]) => ({ type, quantity }));

    // Movement timeline (daily)
    const movTimelineMap: Record<string, { date: string; RECEIVE: number; CONSUME: number; WASTE: number; ADJUST: number }> = {};
    movements.forEach(m => {
      const key = new Date(m.performedAt).toISOString().split('T')[0];
      if (!movTimelineMap[key]) movTimelineMap[key] = { date: key, RECEIVE: 0, CONSUME: 0, WASTE: 0, ADJUST: 0 };
      const t = m.type as 'RECEIVE' | 'CONSUME' | 'WASTE' | 'ADJUST';
      if (t in movTimelineMap[key]) movTimelineMap[key][t] += m.quantity;
    });
    const movementTimeline = Object.values(movTimelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Category consumption
    const catMap: Record<string, number> = {};
    consumptions.forEach(c => {
      const cat = c.item.category;
      catMap[cat] = (catMap[cat] || 0) + c.quantity;
    });
    const consumptionByCategory = Object.entries(catMap).map(([category, quantity]) => ({ category, quantity }));

    // Critical items
    const critical = criticalItems.filter(i => i.currentStock <= i.minThreshold);

    return NextResponse.json({
      kpis: {
        totalMovements: movements.length,
        totalConsumed: consumptions.reduce((acc, c) => acc + c.quantity, 0),
        totalReceived: movements.filter(m => m.type === 'RECEIVE').reduce((acc, m) => acc + m.quantity, 0),
        totalWasted: movements.filter(m => m.type === 'WASTE').reduce((acc, m) => acc + m.quantity, 0),
        criticalItemsCount: critical.length,
        uniqueItemsConsumed: Object.keys(consumptionMap).length,
      },
      consumptionRanking,
      movementTypeBreakdown,
      movementTimeline,
      consumptionByCategory,
      criticalItems: critical.map(i => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        category: i.category,
        currentStock: i.currentStock,
        minThreshold: i.minThreshold,
      })),
    });
  } catch (error) {
    console.error('[API Statistics/Inventory]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
