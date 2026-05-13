// src/app/api/tests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { validateFormula } from '@/lib/calculated-tests';
import { testCreateSchema, testUpdateSchema } from '@/lib/validators';
import {
  assertCalculatedDependentsRemainValid,
  assertGroupCanBeConverted,
  assertValidParentAssignment,
  buildTestPersistenceData,
} from '@/lib/test-catalog-validation';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeGrouped = searchParams.get('includeGrouped') !== 'false';
    
    const whereClause: { isGroup?: boolean; categoryId?: string } = {};
    
    if (!includeGrouped) {
      whereClause.isGroup = false;
    }
    
    if (category) {
      whereClause.categoryId = category;
    }

    const tests = await prisma.test.findMany({
      where: whereClause,
      orderBy: [
        { rank: 'asc' },
        { name: 'asc' }
      ],
      include: { 
        children: includeGrouped,
        categoryRel: true,
        _count: {
          select: {
            inventoryRules: true,
          },
        },
      }
    });
    
    return NextResponse.json(tests);
  } catch (error) {
    console.error('Erreur GET /api/tests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tests', details: errorMessage },
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
    const parsed = testCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: parsed.error.issues[0]?.message || 'Les données du test sont invalides.',
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const code = data.code;

    const existingTests = await prisma.test.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        parentId: true,
        isGroup: true,
        resultType: true,
        options: true,
        decimals: true,
      },
    });

    assertValidParentAssignment(existingTests, data.parentId);

    if (data.resultType === 'calculated' && !data.isGroup) {
      const availableTests = existingTests.map((test) => ({
        code: test.code,
        resultType: test.resultType,
        options: test.options,
        decimals: test.decimals,
        isGroup: test.isGroup,
      }));
      const validation = validateFormula(data.formula || '', availableTests, code);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error || 'Formule invalide' }, { status: 400 });
      }
    }
    
    let categoryId = data.categoryId || null;
    if (!categoryId && body.category) {
      const cat = await prisma.category.findFirst({
        where: { name: body.category }
      });
      categoryId = cat?.id || null;
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!category) {
        return NextResponse.json(
          { error: 'La catégorie sélectionnée est introuvable' },
          { status: 400 }
        );
      }
    }

    const test = await prisma.test.create({
      data: buildTestPersistenceData(data, categoryId),
    });

    await createAuditLog({
      action: 'test.create',
      severity: 'WARN',
      entity: 'test',
      entityId: test.id,
      details: { code: test.code, name: test.name },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    
    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tests:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un test avec ce code existe déjà' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du test' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    const parsed = testUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: parsed.error.issues[0]?.message || 'Les données du test sont invalides.',
        },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const code = data.code;

    if (!id) {
      return NextResponse.json(
        { error: 'ID du test manquant' },
        { status: 400 }
      );
    }

    const existingTests = await prisma.test.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        parentId: true,
        isGroup: true,
        resultType: true,
        options: true,
        decimals: true,
      },
    });

    assertValidParentAssignment(existingTests, data.parentId, id);
    assertGroupCanBeConverted(existingTests, id, data.isGroup);
    assertCalculatedDependentsRemainValid(existingTests, id, data);

    if (data.resultType === 'calculated' && !data.isGroup) {
      const availableTests = existingTests
        .filter((test) => test.id !== id)
        .map((test) => ({
          code: test.code,
          resultType: test.resultType,
          options: test.options,
          decimals: test.decimals,
          isGroup: test.isGroup,
        }));
      const validation = validateFormula(data.formula || '', availableTests, code);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error || 'Formule invalide' }, { status: 400 });
      }
    }

    const categoryId = data.categoryId || null;
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!category) {
        return NextResponse.json(
          { error: 'La catégorie sélectionnée est introuvable' },
          { status: 400 }
        );
      }
    }

    const test = await prisma.test.update({
      where: { id },
      data: buildTestPersistenceData(data, categoryId),
    });

    await createAuditLog({
      action: 'test.update',
      severity: 'WARN',
      entity: 'test',
      entityId: test.id,
      details: { code: test.code, name: test.name },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error('Erreur PUT /api/tests:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un test avec ce code existe déjà' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du test' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID manquant' },
        { status: 400 }
      );
    }
    
    const existing = await prisma.test.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    });

    await prisma.test.delete({
      where: { id }
    });

    await createAuditLog({
      action: 'test.delete',
      severity: 'CRITICAL',
      entity: 'test',
      entityId: id,
      details: existing,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/tests:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
