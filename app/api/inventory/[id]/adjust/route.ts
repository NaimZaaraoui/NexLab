import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { notifyInventoryStatus } from '@/lib/inventory-notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    const newStock = Number(body?.newStock);
    const reason = String(body?.reason || '').trim();

    if (!Number.isFinite(newStock) || newStock < 0) {
      return NextResponse.json({ error: 'Nouveau stock invalide' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: "Le motif de l'ajustement est obligatoire" }, { status: 400 });
    }

    const performedBy = guard.session.user.name || 'Utilisateur';

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id } });
      if (!item) {
        throw new Error('ARTICLE_NOT_FOUND');
      }

      const delta = newStock - item.currentStock;

      await tx.stockMovement.create({
        data: {
          itemId: id,
          type: 'adjustment',
          quantity: delta,
          reason,
          performedBy,
        },
      });

      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: {
          currentStock: newStock,
        },
      });

      return { updatedItem, delta };
    });

    await createAuditLog({
      action: 'inventory.adjust',
      severity: 'WARN',
      entity: 'inventory_item',
      entityId: id,
      details: {
        newStock,
        delta: result.delta,
        reason,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await notifyInventoryStatus(id, guard.session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'ARTICLE_NOT_FOUND') {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    console.error('Erreur POST /api/inventory/[id]/adjust:', error);
    return NextResponse.json({ error: "Erreur lors de l'ajustement" }, { status: 500 });
  }
}
