import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;

    const [test, items, rules] = await Promise.all([
      prisma.test.findUnique({
        where: { id },
        select: { id: true, name: true, code: true },
      }),
      prisma.inventoryItem.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          kind: true,
          unit: true,
          category: true,
          currentStock: true,
        },
        orderBy: [{ kind: 'asc' }, { name: 'asc' }],
      }),
      prisma.itemTestRule.findMany({
        where: { testId: id },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              kind: true,
              unit: true,
              category: true,
              currentStock: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ isActive: 'desc' }, { item: { name: 'asc' } }],
      }),
    ]);

    if (!test) {
      return NextResponse.json({ error: 'Test non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ test, items, rules });
  } catch (error) {
    console.error('Erreur GET /api/tests/[id]/inventory:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des règles de consommation' }, { status: 500 });
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

    const itemId = String(body?.itemId || '').trim();
    const quantityPerTest = Number(body?.quantityPerTest);

    if (!itemId || !Number.isFinite(quantityPerTest) || quantityPerTest <= 0) {
      return NextResponse.json({ error: 'Article et quantité par test valides sont requis' }, { status: 400 });
    }

    const [test, item] = await Promise.all([
      prisma.test.findUnique({
        where: { id },
        select: { id: true, name: true, code: true },
      }),
      prisma.inventoryItem.findUnique({
        where: { id: itemId },
        select: { id: true, name: true, unit: true, kind: true, isActive: true },
      }),
    ]);

    if (!test) {
      return NextResponse.json({ error: 'Test non trouvé' }, { status: 404 });
    }

    if (!item || !item.isActive) {
      return NextResponse.json({ error: 'Article inventaire non trouvé ou inactif' }, { status: 404 });
    }

    const rule = await prisma.itemTestRule.upsert({
      where: {
        itemId_testId: {
          itemId,
          testId: id,
        },
      },
      create: {
        itemId,
        testId: id,
        quantityPerTest,
        isActive: true,
      },
      update: {
        quantityPerTest,
        isActive: true,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            unit: true,
            kind: true,
            category: true,
            currentStock: true,
            isActive: true,
          },
        },
      },
    });

    await createAuditLog({
      action: 'test.inventory_rule_upsert',
      severity: 'WARN',
      entity: 'item_test_rule',
      entityId: rule.id,
      details: {
        testId: test.id,
        testCode: test.code,
        itemId: item.id,
        itemName: item.name,
        quantityPerTest,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tests/[id]/inventory:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde de la règle de consommation' }, { status: 500 });
  }
}
