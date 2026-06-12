'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const importTestSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  code: z.string().min(1, 'Le code est obligatoire'),
  unit: z.string().optional().nullable(),
  minValue: z.number().optional().nullable(),
  maxValue: z.number().optional().nullable(),
  minValueM: z.number().optional().nullable(),
  maxValueM: z.number().optional().nullable(),
  minValueF: z.number().optional().nullable(),
  maxValueF: z.number().optional().nullable(),
  decimals: z.number().optional().default(1),
  resultType: z.string().optional().default('numeric'),
  categoryName: z.string().optional().nullable(),
  price: z.number().optional().default(0),
  sampleType: z.string().optional().nullable(),
  sampleContainer: z.string().optional().nullable(),
  options: z.string().optional().nullable(),
  rank: z.number().optional().default(0),
  isGroup: z.boolean().optional().default(false),
  isOptional: z.boolean().optional().default(false),
  parentId: z.string().optional().nullable(),
});

export type ImportTestInput = z.infer<typeof importTestSchema>;

export async function importTestsAction(data: ImportTestInput[]) {
  try {
    // Validate input
    const validatedData = z.array(importTestSchema).parse(data);

    let createdCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx: any) => {
      // Get all existing categories
      const existingCategories = await tx.category.findMany();
      const categoryMap = new Map<string, string>(existingCategories.map((c: any) => [c.name.toLowerCase(), c.id as string]));

      for (const testInput of validatedData) {
        let categoryId: string | null = null;

        if (testInput.categoryName) {
          const catKey = testInput.categoryName.toLowerCase().trim();
          if (categoryMap.has(catKey)) {
            categoryId = categoryMap.get(catKey)!;
          } else {
            // Create new category
            const maxRankCat = await tx.category.findFirst({ orderBy: { rank: 'desc' } });
            const newRank = maxRankCat ? maxRankCat.rank + 1 : 1;
            
            const newCategory = await tx.category.create({
              data: {
                name: testInput.categoryName.trim(),
                rank: newRank,
              },
            });
            categoryId = (newCategory as any).id as string;
            categoryMap.set(catKey, categoryId);
          }
        }

        // Prepare data
        const testData = {
          name: testInput.name,
          unit: testInput.unit || null,
          minValue: testInput.minValue ?? null,
          maxValue: testInput.maxValue ?? null,
          minValueM: testInput.minValueM ?? null,
          maxValueM: testInput.maxValueM ?? null,
          minValueF: testInput.minValueF ?? null,
          maxValueF: testInput.maxValueF ?? null,
          decimals: testInput.decimals ?? 1,
          resultType: testInput.resultType || 'numeric',
          price: testInput.price ?? 0,
          sampleType: testInput.sampleType || null,
          sampleContainer: testInput.sampleContainer || null,
          options: testInput.options || null,
          categoryId,
          rank: testInput.rank ?? 0,
          isGroup: testInput.isGroup ?? false,
          isOptional: testInput.isOptional ?? false,
        };

        let resolvedParentId = testInput.parentId || null;
        if (resolvedParentId && !resolvedParentId.includes('-')) {
          // If it doesn't look like a UUID, assume it's a test code and look it up
          const parentTest = await tx.test.findUnique({ where: { code: resolvedParentId } });
          if (parentTest) {
            resolvedParentId = parentTest.id;
          } else {
            resolvedParentId = null;
          }
        }

        const finalTestData = {
          ...testData,
          parentId: resolvedParentId,
        };

        // Check if test exists by code
        const existingTest = await tx.test.findUnique({
          where: { code: testInput.code },
        });

        if (existingTest) {
          await tx.test.update({
            where: { code: testInput.code },
            data: finalTestData,
          });
          updatedCount++;
        } else {
          await tx.test.create({
            data: {
              code: testInput.code,
              ...finalTestData,
            },
          });
          createdCount++;
        }
      }
    });

    revalidatePath('/tests');
    revalidatePath('/dashboard/settings/tests'); // Also revalidate dashboard if it's there
    return { success: true, createdCount, updatedCount };
  } catch (error) {
    console.error('Import error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Données invalides : ' + (error as any).errors[0].message };
    }
    return { success: false, error: 'Une erreur est survenue lors de l\'importation.' };
  }
}
