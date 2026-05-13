import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser, requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { computeInventoryDerived } from '@/lib/inventory';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        lots: {
          orderBy: { expiryDate: 'asc' },
        },
        movements: {
          orderBy: { performedAt: 'desc' },
          take: 50,
        },
        rules: {
          where: { isActive: true },
          include: {
            test: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: {
            test: { name: 'asc' },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      ...computeInventoryDerived({
        currentStock: item.currentStock,
        minThreshold: item.minThreshold,
        name: item.name,
        lots: item.lots,
      }),
    });
  } catch (error) {
    console.error('Erreur GET /api/inventory/[id]:', error);
    return NextResponse.json({ error: "Erreur lors du chargement de l'article" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const action = String(body?.action || '').trim();
    const meta = getRequestMeta({ headers: request.headers });

    if (action === 'toggle-active') {
      const existing = await prisma.inventoryItem.findUnique({ where: { id }, select: { isActive: true, name: true } });
      if (!existing) {
        return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
      }

      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });

      await createAuditLog({
        action: updated.isActive ? 'inventory.item_reactivate' : 'inventory.item_deactivate',
        severity: 'WARN',
        entity: 'inventory_item',
        entityId: id,
        details: { name: updated.name, isActive: updated.isActive },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json(updated);
    }

    if (action !== 'update') {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const name = String(body?.name || '').trim();
    const category = String(body?.category || '').trim();
    const unit = String(body?.unit || '').trim();
    const minThreshold = Number(body?.minThreshold);
    const kind = String(body?.kind || '').trim().toUpperCase();

    if (!name || !category || !unit || !Number.isFinite(minThreshold) || minThreshold < 0) {
      return NextResponse.json(
        { error: 'Champs invalides: nom, catégorie, unité et seuil minimum sont requis' },
        { status: 400 }
      );
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        reference: body?.reference ? String(body.reference).trim() : null,
        category,
        unit,
        kind: kind === 'CONSUMABLE' ? 'CONSUMABLE' : 'REAGENT',
        minThreshold,
        storage: body?.storage ? String(body.storage).trim() : null,
        supplier: body?.supplier ? String(body.supplier).trim() : null,
        notes: body?.notes ? String(body.notes).trim() : null,
      },
    });

    await createAuditLog({
      action: 'inventory.item_update',
      severity: 'WARN',
      entity: 'inventory_item',
      entityId: updated.id,
      details: {
        name: updated.name,
        category: updated.category,
        kind: updated.kind,
        minThreshold: updated.minThreshold,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PATCH /api/inventory/[id]:', error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour de l'article" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const meta = getRequestMeta({ headers: request.headers });

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, name: true, category: true, kind: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    // Traceability guard: block hard deletion if the item has been used in analyses or has stock history.
    // In both cases the admin should deactivate the item instead to preserve the audit trail.
    const [consumptionCount, movementCount] = await Promise.all([
      prisma.analysisConsumption.count({ where: { itemId: id } }),
      prisma.stockMovement.count({ where: { itemId: id } }),
    ]);

    if (consumptionCount > 0) {
      return NextResponse.json(
        {
          error: `Suppression impossible : cet article est associé à ${consumptionCount} consommation(s) d'analyse. Désactivez-le plutôt pour conserver la traçabilité.`,
        },
        { status: 409 }
      );
    }

    if (movementCount > 0) {
      return NextResponse.json(
        {
          error: `Suppression impossible : cet article possède ${movementCount} mouvement(s) de stock. Désactivez-le plutôt pour conserver la traçabilité.`,
        },
        { status: 409 }
      );
    }

    await prisma.inventoryItem.delete({ where: { id } });

    await createAuditLog({
      action: 'inventory.item_delete',
      severity: 'CRITICAL',
      entity: 'inventory_item',
      entityId: id,
      details: { name: existing.name, category: existing.category, kind: existing.kind },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/inventory/[id]:', error);
    return NextResponse.json({ error: "Erreur lors de la suppression de l'article" }, { status: 500 });
  }
}
