import { NextRequest, NextResponse } from 'next/server';
import { subDays, startOfDay } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { requireAuthUser, requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { computeInventoryDerived, computeReorderSuggestion, sortInventoryByStatusThenName } from '@/lib/inventory';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || '').trim().toLowerCase();
    const mode = (searchParams.get('mode') || 'inventory').trim().toLowerCase();
    const settingsRows = await prisma.setting.findMany({
      where: { key: { in: ['inventory_reorder_lead_days', 'inventory_safety_days'] } },
      select: { key: true, value: true },
    });
    const leadTimeDays = Math.max(
      Number(settingsRows.find((row) => row.key === 'inventory_reorder_lead_days')?.value || 14),
      1
    );
    const safetyDays = Math.max(
      Number(settingsRows.find((row) => row.key === 'inventory_safety_days')?.value || 14),
      1
    );
    const analyticsSince = startOfDay(subDays(new Date(), 29));

    const items = await prisma.inventoryItem.findMany({
      where: { isActive: true },
      include: {
        lots: {
          where: { isActive: true },
          orderBy: { expiryDate: 'asc' },
        },
        _count: {
          select: { movements: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    const recentConsumptions = await prisma.stockMovement.findMany({
      where: {
        type: 'consumption',
        performedAt: { gte: analyticsSince },
        itemId: { in: items.map((item) => item.id) },
      },
      select: {
        itemId: true,
        quantity: true,
      },
    });
    const consumptionByItem = new Map<string, number>();
    for (const movement of recentConsumptions) {
      consumptionByItem.set(
        movement.itemId,
        (consumptionByItem.get(movement.itemId) || 0) + Math.abs(movement.quantity)
      );
    }

    const withDerived = items.map((item) => ({
      ...item,
      consumption30d: Number((consumptionByItem.get(item.id) || 0).toFixed(2)),
      avgDailyConsumption30d: Number((((consumptionByItem.get(item.id) || 0) / 30)).toFixed(2)),
      ...computeInventoryDerived({
        currentStock: item.currentStock,
        minThreshold: item.minThreshold,
        name: item.name,
        lots: item.lots,
      }),
    }));

    if (format === 'csv') {
      const exportRows = withDerived.map((item) => {
        const reorder = computeReorderSuggestion({
          currentStock: item.currentStock,
          minThreshold: item.minThreshold,
          unit: item.unit,
          status: item.status,
          daysUntilExpiry: item.daysUntilExpiry,
          avgDailyConsumption30d: item.avgDailyConsumption30d,
          leadTimeDays,
          safetyDays,
        });

        return {
          name: item.name,
          category: item.category,
          kind: item.kind,
          unit: item.unit,
          currentStock: item.currentStock,
          minThreshold: item.minThreshold,
          status: item.status,
          nearestExpiry: item.nearestExpiry ? new Date(item.nearestExpiry).toISOString().slice(0, 10) : '',
          daysUntilExpiry: item.daysUntilExpiry ?? '',
          reorderUrgency: reorder.urgency,
          reorderReason: reorder.reason,
          suggestedQuantity: reorder.suggestedQuantity,
          targetStock: reorder.targetStock,
          avgDailyConsumption30d: item.avgDailyConsumption30d,
          coverageDays: reorder.coverageDays ?? '',
        };
      });

      const rows =
        mode === 'reorder'
          ? exportRows.filter((row) => row.suggestedQuantity > 0)
          : exportRows;

      const header = [
        'name',
        'category',
        'kind',
        'unit',
        'currentStock',
        'minThreshold',
        'status',
        'nearestExpiry',
        'daysUntilExpiry',
        'reorderUrgency',
        'reorderReason',
        'suggestedQuantity',
        'targetStock',
        'avgDailyConsumption30d',
        'coverageDays',
      ];

      const escapeCsv = (value: string | number) => {
        return `"${String(value).replaceAll('"', '""')}"`;
      };

      const lines = rows.map((row) =>
        header.map((column) => escapeCsv(row[column as keyof typeof row] ?? '')).join(',')
      );

      const csv = [header.join(','), ...lines].join('\n');
      const fileName =
        mode === 'reorder'
          ? `inventory_reorder_${new Date().toISOString().slice(0, 10)}.csv`
          : `inventory_${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    return NextResponse.json(sortInventoryByStatusThenName(withDerived));
  } catch (error) {
    console.error('Erreur GET /api/inventory:', error);
    return NextResponse.json({ error: "Erreur lors du chargement de l'inventaire" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    const name = String(body?.name || '').trim();
    const category = String(body?.category || '').trim();
    const unit = String(body?.unit || '').trim();
    const kind = String(body?.kind || 'REAGENT').trim().toUpperCase();
    const minThreshold = Number(body?.minThreshold);
    const currentStock = Number(body?.currentStock ?? 0);

    if (!name || !category || !unit || !Number.isFinite(minThreshold) || minThreshold < 0) {
      return NextResponse.json(
        { error: 'Champs invalides: nom, catégorie, unité et seuil minimum sont requis' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(currentStock) || currentStock < 0) {
      return NextResponse.json({ error: 'Stock initial invalide' }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        reference: body?.reference ? String(body.reference).trim() : null,
        category,
        unit,
        kind: kind === 'CONSUMABLE' ? 'CONSUMABLE' : 'REAGENT',
        currentStock,
        minThreshold,
        storage: body?.storage ? String(body.storage).trim() : null,
        supplier: body?.supplier ? String(body.supplier).trim() : null,
        notes: body?.notes ? String(body.notes).trim() : null,
      },
    });

    await createAuditLog({
      action: 'inventory.item_create',
      severity: 'WARN',
      entity: 'inventory_item',
      entityId: item.id,
      details: {
        name: item.name,
        category: item.category,
        kind: item.kind,
        minThreshold: item.minThreshold,
        currentStock: item.currentStock,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/inventory:', error);
    return NextResponse.json({ error: "Erreur lors de la création de l'article" }, { status: 500 });
  }
}
