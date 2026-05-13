import { startOfDay, subDays } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/authz';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';

    const today = startOfDay(new Date());
    const last30Days = startOfDay(subDays(new Date(), 29));

    const materials = await prisma.qcMaterial.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        lots: {
          where: includeInactive ? undefined : { isActive: true },
          orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
          include: {
            targets: {
              orderBy: [{ testName: 'asc' }, { testCode: 'asc' }],
            },
            results: {
              where: {
                performedAt: { gte: last30Days },
                status: { not: 'cancelled' },
              },
              orderBy: { performedAt: 'desc' },
              include: {
                values: {
                  orderBy: { testName: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    const response = materials.map((material) => ({
      ...material,
      lots: material.lots.map((lot) => {
        const lastResult = lot.results[0] || null;
        const todayResult = lot.results.find((result) => new Date(result.performedAt) >= today) || null;

        return {
          ...lot,
          targetsCount: lot.targets.length,
          resultsCount30d: lot.results.length,
          lastResult,
          todayResult,
        };
      }),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur GET /api/qc:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement du contrôle qualité' }, { status: 500 });
  }
}
