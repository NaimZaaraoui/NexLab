import { startOfDay } from 'date-fns';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/authz';

export async function GET() {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const today = startOfDay(new Date());

    const activeLots = await prisma.qcLot.findMany({
      where: {
        isActive: true,
        material: { isActive: true },
      },
      select: {
        id: true,
        lotNumber: true,
        material: {
          select: {
            name: true,
          },
        },
        results: {
          where: {
            performedAt: { gte: today },
            status: { not: 'cancelled' },
          },
          orderBy: { performedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            performedAt: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    let missing = 0;
    let warn = 0;
    let fail = 0;

    const lots = activeLots.map((lot) => {
      const todayResult = lot.results[0] || null;
      if (!todayResult) {
        missing += 1;
      } else if (todayResult.status === 'fail') {
        fail += 1;
      } else if (todayResult.status === 'warn') {
        warn += 1;
      }

      return {
        id: lot.id,
        lotNumber: lot.lotNumber,
        materialName: lot.material.name,
        status: todayResult?.status || 'missing',
        performedAt: todayResult?.performedAt || null,
      };
    });

    return NextResponse.json({
      allPass: missing === 0 && warn === 0 && fail === 0,
      missing,
      warn,
      fail,
      lots,
    });
  } catch (error) {
    console.error('Erreur GET /api/qc/today:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement du statut QC du jour' }, { status: 500 });
  }
}
