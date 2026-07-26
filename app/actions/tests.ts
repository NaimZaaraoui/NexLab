'use server';

import { prisma } from '@/lib/db/prisma';
import { requireAnyRole, requireAuthUser } from '@/lib/security/authz';
import { createAuditLog, getRequestMeta } from '@/lib/security/audit';
import { validateFormula } from '@/lib/clinical/calculated-tests';
import { testCreateSchema, testUpdateSchema } from '@/lib/clinical/validators';
import {
  assertCalculatedDependentsRemainValid,
  assertGroupCanBeConverted,
  assertValidParentAssignment,
  buildTestPersistenceData,
} from '@/lib/clinical/test-catalog-validation';
import { toLabDisplaySettings } from '@/lib/settings/settings-schema';
import { ALLOWED_SETTINGS_KEYS } from '@/lib/settings/settings-schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type Test } from '@/lib/core/types';
import { type CategoryOption, type TestsLabSettings } from '@/components/tests/types';

export async function getTests(categoryId?: string, searchQuery?: string) {
  const guard = await requireAuthUser();
  if (!guard.ok) return [];

  type WhereClause = {
    isGroup?: boolean;
    categoryId?: string;
    OR?: Array<Record<string, { contains: string }>>;
  };

  const whereClause: WhereClause = {};

  if (searchQuery?.trim()) {
    const term = searchQuery.trim().toLowerCase();
    whereClause.OR = [
      { code: { contains: term } },
      { name: { contains: term } },
    ];
  }

  if (categoryId && categoryId !== 'all') {
    whereClause.categoryId = categoryId;
  }

  const rows = await prisma.test.findMany({
    where: whereClause,
    orderBy: [{ rank: 'asc' }, { name: 'asc' }],
    include: {
      categoryRel: true,
      parent: { select: { id: true, code: true, name: true } },
      _count: { select: { inventoryRules: true } },
    },
  });

  return rows.map((row) => {
    const { categoryRel, parent, ...rest } = row as unknown as Record<string, unknown>;
    return {
      ...rest,
      categoryRel: categoryRel ?? undefined,
      parent: parent ?? undefined,
    } as unknown as Test;
  });
}

export async function getCategories() {
  const guard = await requireAuthUser();
  if (!guard.ok) return [];

  const categories = await prisma.category.findMany({
    orderBy: [{ rank: 'asc' }, { name: 'asc' }],
    include: {
      tests: { select: { id: true } },
      children: { select: { id: true, name: true, rank: true } },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    rank: cat.rank,
    icon: cat.icon,
    parentId: cat.parentId,
  })) satisfies CategoryOption[];
}

export async function getLabSettings() {
  const guard = await requireAuthUser();
  if (!guard.ok) return {} as TestsLabSettings;

  const settings = await prisma.setting.findMany({
    where: { key: { in: [...ALLOWED_SETTINGS_KEYS] } },
    select: { key: true, value: true },
  });

  const record = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return toLabDisplaySettings(record) as TestsLabSettings;
}

export async function getInventoryRules(testId: string) {
  const guard = await requireAuthUser();
  if (!guard.ok) return { items: [], rules: [] };

  const [items, rules] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.itemTestRule.findMany({
      where: { testId, isActive: true },
      include: { item: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return { items, rules };
}

export async function createTestAction(data: z.infer<typeof testCreateSchema>) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const parsed = testCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Données invalides' };
  }

  const input = parsed.data;

  try {
    const meta = getRequestMeta({ headers: new Headers() });
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

    assertValidParentAssignment(existingTests, input.parentId);

    if (input.resultType === 'calculated' && !input.isGroup) {
      const availableTests = existingTests.map((t) => ({
        code: t.code,
        resultType: t.resultType,
        options: t.options,
        decimals: t.decimals,
        isGroup: t.isGroup,
      }));
      const validation = validateFormula(input.formula || '', availableTests, input.code);
      if (!validation.valid) {
        return { error: validation.error || 'Formule invalide' };
      }
    }

    const test = await prisma.test.create({
      data: buildTestPersistenceData(input, input.categoryId || null),
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

    revalidatePath('/tests');
    return { success: true, test };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Données invalides' };
    }
    return { error: 'Erreur lors de la création' };
  }
}

export async function updateTestAction(data: z.infer<typeof testUpdateSchema>) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const parsed = testUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Données invalides' };
  }

  const { id, ...input } = parsed.data;

  try {
    const meta = getRequestMeta({ headers: new Headers() });
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

    assertValidParentAssignment(existingTests, input.parentId, id);
    assertGroupCanBeConverted(existingTests, id, input.isGroup);
    assertCalculatedDependentsRemainValid(existingTests, id, input);

    if (input.resultType === 'calculated' && !input.isGroup) {
      const availableTests = existingTests
        .filter((t) => t.id !== id)
        .map((t) => ({
          code: t.code,
          resultType: t.resultType,
          options: t.options,
          decimals: t.decimals,
          isGroup: t.isGroup,
        }));
      const validation = validateFormula(input.formula || '', availableTests, input.code);
      if (!validation.valid) {
        return { error: validation.error || 'Formule invalide' };
      }
    }

    const test = await prisma.test.update({
      where: { id },
      data: buildTestPersistenceData(input, input.categoryId || null),
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

    revalidatePath('/tests');
    return { success: true, test };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Données invalides' };
    }
    return { error: 'Erreur lors de la mise à jour' };
  }
}

export async function deleteTestAction(id: string) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  try {
    const existing = await prisma.test.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    });

    await prisma.test.delete({ where: { id } });

    const meta = getRequestMeta({ headers: new Headers() });
    await createAuditLog({
      action: 'test.delete',
      severity: 'CRITICAL',
      entity: 'test',
      entityId: id,
      details: existing,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    revalidatePath('/tests');
    return { success: true };
  } catch {
    return { error: 'Erreur lors de la suppression' };
  }
}

export async function deleteInventoryRuleAction(ruleId: string) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  try {
    await prisma.itemTestRule.delete({ where: { id: ruleId } });
    const meta = getRequestMeta({ headers: new Headers() });
    await createAuditLog({
      action: 'inventory.rule.delete',
      severity: 'WARN',
      entity: 'item_test_rule',
      entityId: ruleId,
      details: { ruleId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return { success: true };
  } catch {
    return { error: 'Erreur lors de la suppression de la règle' };
  }
}


