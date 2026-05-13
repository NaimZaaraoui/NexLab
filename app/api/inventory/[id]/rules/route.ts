import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;

    const rules = await prisma.itemTestRule.findMany({
      where: { itemId: id },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            code: true,
            categoryRel: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { test: { name: 'asc' } },
      ],
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Erreur GET /api/inventory/[id]/rules:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des règles' }, { status: 500 });
  }
}

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

    const testId = String(body?.testId || '').trim();
    const quantityPerTest = Number(body?.quantityPerTest);

    if (!testId || !Number.isFinite(quantityPerTest) || quantityPerTest <= 0) {
      return NextResponse.json({ error: 'Test et quantité/test valides sont requis' }, { status: 400 });
    }

    const [item, test] = await Promise.all([
      prisma.inventoryItem.findUnique({ where: { id }, select: { id: true, name: true } }),
      prisma.test.findUnique({ where: { id: testId }, select: { id: true, name: true, code: true } }),
    ]);

    if (!item) return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    if (!test) return NextResponse.json({ error: 'Test non trouvé' }, { status: 404 });

    const rule = await prisma.itemTestRule.upsert({
      where: {
        itemId_testId: {
          itemId: id,
          testId,
        },
      },
      create: {
        itemId: id,
        testId,
        quantityPerTest,
        isActive: true,
      },
      update: {
        quantityPerTest,
        isActive: true,
      },
      include: {
        test: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await createAuditLog({
      action: 'inventory.rule_upsert',
      severity: 'WARN',
      entity: 'item_test_rule',
      entityId: rule.id,
      details: {
        itemId: id,
        itemName: item.name,
        testId,
        testCode: test.code,
        quantityPerTest,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/inventory/[id]/rules:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde de la règle' }, { status: 500 });
  }
}
