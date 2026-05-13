import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { ruleId } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    const action = String(body?.action || '').trim();

    if (action === 'toggle-active') {
      const existing = await prisma.itemTestRule.findUnique({
        where: { id: ruleId },
        select: { id: true, isActive: true, itemId: true, testId: true },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 });
      }

      const updated = await prisma.itemTestRule.update({
        where: { id: ruleId },
        data: { isActive: !existing.isActive },
      });

      await createAuditLog({
        action: updated.isActive ? 'inventory.rule_reactivate' : 'inventory.rule_deactivate',
        severity: 'WARN',
        entity: 'item_test_rule',
        entityId: ruleId,
        details: { itemId: updated.itemId, testId: updated.testId, isActive: updated.isActive },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json(updated);
    }

    const quantityPerTest = Number(body?.quantityPerTest);
    if (!Number.isFinite(quantityPerTest) || quantityPerTest <= 0) {
      return NextResponse.json({ error: 'Quantité/test invalide' }, { status: 400 });
    }

    const updated = await prisma.itemTestRule.update({
      where: { id: ruleId },
      data: { quantityPerTest, isActive: true },
    });

    await createAuditLog({
      action: 'inventory.rule_update',
      severity: 'WARN',
      entity: 'item_test_rule',
      entityId: ruleId,
      details: { itemId: updated.itemId, testId: updated.testId, quantityPerTest },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PATCH /api/inventory/rules/[ruleId]:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la règle' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { ruleId } = await params;
    const meta = getRequestMeta({ headers: request.headers });

    const existing = await prisma.itemTestRule.findUnique({
      where: { id: ruleId },
      select: { id: true, itemId: true, testId: true, quantityPerTest: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 });
    }

    await prisma.itemTestRule.delete({ where: { id: ruleId } });

    await createAuditLog({
      action: 'inventory.rule_delete',
      severity: 'CRITICAL',
      entity: 'item_test_rule',
      entityId: ruleId,
      details: existing,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/inventory/rules/[ruleId]:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de la règle' }, { status: 500 });
  }
}
