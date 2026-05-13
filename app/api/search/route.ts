import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/authz';

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [patients, analyses, tests] = await Promise.all([
      prisma.patient.findMany({
        where: {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.analysis.findMany({
        where: {
          OR: [
            { dailyId: { contains: query } },
            { receiptNumber: { contains: query } },
            { patientFirstName: { contains: query } },
            { patientLastName: { contains: query } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.test.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { code: { contains: query } },
          ],
        },
        take: 5,
        include: { categoryRel: true },
      }),
    ]);

    const results = [
      ...patients.map((p) => ({
        id: p.id,
        title: `${p.lastName} ${p.firstName}`,
        type: 'patient' as const,
        description: `Patient • ${p.gender === 'M' ? 'Homme' : 'Femme'}`,
      })),
      ...analyses.map((a) => ({
        id: a.id,
        title: `Analyse #${a.dailyId || a.orderNumber.slice(0, 8)}`,
        type: 'analysis' as const,
        description: `Dossier • ${a.patientLastName} ${a.patientFirstName} • ${a.receiptNumber || 'Sans quittance'}`,
      })),
      ...tests.map((t) => ({
        id: t.id,
        title: `${t.name} (${t.code})`,
        type: 'result' as const,
        description: `Paramètre • ${t.categoryRel?.name || 'Test'}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
