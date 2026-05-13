import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import {
  DEFAULT_INVENTORY_CATEGORIES,
  parseInventoryCategories,
  stringifyInventoryCategories,
} from '@/lib/inventory-categories';

const INVENTORY_CATEGORIES_KEY = 'inventory_categories';

export async function GET() {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const row = await prisma.setting.findUnique({
      where: { key: INVENTORY_CATEGORIES_KEY },
      select: { value: true },
    });

    return NextResponse.json(parseInventoryCategories(row?.value));
  } catch (error) {
    console.error('Erreur GET /api/inventory/categories:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des catégories inventaire' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });
    const categories = Array.isArray(body?.categories)
      ? parseInventoryCategories(JSON.stringify(body.categories))
      : DEFAULT_INVENTORY_CATEGORIES;

    await prisma.setting.upsert({
      where: { key: INVENTORY_CATEGORIES_KEY },
      update: {
        value: stringifyInventoryCategories(categories),
        updatedBy: guard.userId,
      },
      create: {
        key: INVENTORY_CATEGORIES_KEY,
        value: stringifyInventoryCategories(categories),
        updatedBy: guard.userId,
      },
    });

    await createAuditLog({
      action: 'inventory.categories_update',
      severity: 'WARN',
      entity: 'inventory_category',
      details: { count: categories.length },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erreur PUT /api/inventory/categories:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour des catégories inventaire' }, { status: 500 });
  }
}
