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
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    const lotNumber = String(body?.lotNumber || '').trim();
    const quantity = Number(body?.quantity);
    const expiryDate = body?.expiryDate ? new Date(body.expiryDate) : null;

    if (!lotNumber || !Number.isFinite(quantity) || quantity <= 0 || !expiryDate || Number.isNaN(expiryDate.getTime())) {
      return NextResponse.json(
        { error: 'Lot, date expiration et quantité (>0) sont requis' },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiryDate.getTime() < today.getTime()) {
      return NextResponse.json({ error: "La date d'expiration est déjà dépassée" }, { status: 400 });
    }

    const performedBy = guard.session.user.name || 'Utilisateur';

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id } });
      if (!item) {
        throw new Error('ARTICLE_NOT_FOUND');
      }

      const lot = await tx.inventoryLot.create({
        data: {
          itemId: id,
          lotNumber,
          expiryDate,
          quantity,
          remaining: quantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          itemId: id,
          type: 'reception',
          quantity,
          lotNumber,
          performedBy,
          reason: 'Réception de lot',
        },
      });

      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: {
          currentStock: {
            increment: quantity,
          },
        },
      });

      return { lot, updatedItem };
    });

    await createAuditLog({
      action: 'inventory.receive',
      severity: 'INFO',
      entity: 'inventory_item',
      entityId: id,
      details: {
        lotNumber,
        quantity,
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

    console.error('Erreur POST /api/inventory/[id]/receive:', error);
    return NextResponse.json({ error: 'Erreur lors de la réception du lot' }, { status: 500 });
  }
}
