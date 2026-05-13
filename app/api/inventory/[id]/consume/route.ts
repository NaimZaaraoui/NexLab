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

    const quantity = Number(body?.quantity);
    const lotNumber = body?.lotNumber ? String(body.lotNumber).trim() : null;
    const reason = body?.reason ? String(body.reason).trim() : null;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 });
    }

    const performedBy = guard.session.user.name || 'Utilisateur';

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id },
        include: {
          lots: {
            where: { isActive: true, remaining: { gt: 0 } },
            orderBy: { expiryDate: 'asc' },
          },
        },
      });

      if (!item) {
        throw new Error('ARTICLE_NOT_FOUND');
      }

      if (item.currentStock < quantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      if (lotNumber) {
        const targetLot = item.lots.find((lot) => lot.lotNumber === lotNumber);
        if (!targetLot) {
          throw new Error('LOT_NOT_FOUND');
        }

        if (targetLot.remaining < quantity) {
          throw new Error('INSUFFICIENT_LOT_STOCK');
        }

        const nextRemaining = targetLot.remaining - quantity;

        await tx.inventoryLot.update({
          where: { id: targetLot.id },
          data: {
            remaining: nextRemaining,
            isActive: nextRemaining > 0,
          },
        });

        await tx.stockMovement.create({
          data: {
            itemId: id,
            type: 'consumption',
            quantity: -quantity,
            lotNumber,
            reason,
            performedBy,
          },
        });
      } else {
        let remainingToConsume = quantity;

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
              itemId: id,
              type: 'consumption',
              quantity: -consumeFromLot,
              lotNumber: lot.lotNumber,
              reason,
              performedBy,
            },
          });

          remainingToConsume -= consumeFromLot;
        }

        if (remainingToConsume > 0) {
          await tx.stockMovement.create({
            data: {
              itemId: id,
              type: 'consumption',
              quantity: -remainingToConsume,
              reason,
              performedBy,
            },
          });
        }
      }

      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: {
          currentStock: {
            decrement: quantity,
          },
        },
      });

      return { updatedItem };
    });

    await createAuditLog({
      action: 'inventory.consume',
      severity: 'INFO',
      entity: 'inventory_item',
      entityId: id,
      details: { quantity, lotNumber, reason },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await notifyInventoryStatus(id, guard.session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'ARTICLE_NOT_FOUND') {
        return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
      }
      if (error.message === 'INSUFFICIENT_STOCK') {
        return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });
      }
      if (error.message === 'LOT_NOT_FOUND') {
        return NextResponse.json({ error: 'Lot introuvable' }, { status: 400 });
      }
      if (error.message === 'INSUFFICIENT_LOT_STOCK') {
        return NextResponse.json({ error: 'Stock insuffisant dans ce lot' }, { status: 400 });
      }
    }

    console.error('Erreur POST /api/inventory/[id]/consume:', error);
    return NextResponse.json({ error: 'Erreur lors de la consommation' }, { status: 500 });
  }
}
