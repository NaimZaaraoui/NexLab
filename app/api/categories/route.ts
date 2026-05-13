import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET() {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const categories = await prisma.category.findMany({
      orderBy: [{ rank: 'asc' }, { name: 'asc' }],
      include: {
        tests: {
          orderBy: [{ rank: 'asc' }, { name: 'asc' }],
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erreur GET /api/categories:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const icon = body?.icon ? String(body.icon).trim() : null;
    const parentId = body?.parentId ? String(body.parentId).trim() : null;

    if (!name) {
      return NextResponse.json({ error: 'Le nom de la catégorie est requis' }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: 'Une catégorie avec ce nom existe déjà' }, { status: 400 });
    }

    const highestRank = await prisma.category.aggregate({
      _max: { rank: true },
      where: parentId ? { parentId } : { parentId: null },
    });

    const category = await prisma.category.create({
      data: {
        name,
        icon,
        parentId,
        rank: (highestRank._max.rank ?? -1) + 1,
      },
    });

    await createAuditLog({
      action: 'category.create',
      severity: 'WARN',
      entity: 'category',
      entityId: category.id,
      details: { name: category.name, icon: category.icon, parentId: category.parentId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/categories:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la catégorie' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    const id = String(body?.id || '').trim();
    const name = String(body?.name || '').trim();
    const icon = body?.icon ? String(body.icon).trim() : null;
    const parentId = body?.parentId ? String(body.parentId).trim() : null;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID et nom de catégorie requis' }, { status: 400 });
    }

    if (parentId === id) {
      return NextResponse.json({ error: 'Une catégorie ne peut pas être son propre parent' }, { status: 400 });
    }

    const duplicate = await prisma.category.findFirst({
      where: {
        name,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Une catégorie avec ce nom existe déjà' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        icon,
        parentId,
      },
    });

    await createAuditLog({
      action: 'category.update',
      severity: 'WARN',
      entity: 'category',
      entityId: category.id,
      details: { name: category.name, icon: category.icon, parentId: category.parentId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Erreur PUT /api/categories:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la catégorie' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'ID de catégorie requis' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        tests: {
          select: { id: true },
        },
        children: {
          select: { id: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
    }

    if (category.tests.length > 0) {
      return NextResponse.json(
        { error: 'Cette catégorie contient encore des tests. Déplacez-les avant suppression.' },
        { status: 400 }
      );
    }

    if (category.children.length > 0) {
      return NextResponse.json(
        { error: 'Cette catégorie contient encore des sous-catégories. Supprimez-les ou déplacez-les avant suppression.' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'category.delete',
      severity: 'CRITICAL',
      entity: 'category',
      entityId: id,
      details: { name: category.name },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/categories:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de la catégorie' }, { status: 500 });
  }
}
