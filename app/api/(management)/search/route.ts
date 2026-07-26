import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthUser } from '@/lib/security/authz';

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [patients, analyses, tests] = await Promise.all([
      prisma.patient.findMany({
        where: {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { phoneNumber: { contains: query } },
            { insuranceNumber: { contains: query } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          phoneNumber: true,
        },
      }),
      prisma.analysis.findMany({
        where: {
          OR: [
            { orderNumber: { contains: query } },
            { dailyId: { contains: query } },
            { receiptNumber: { contains: query } },
            { patient: { firstName: { contains: query } } },
            { patient: { lastName: { contains: query } } },
            { medecinPrescripteur: { contains: query } },
          ],
        },
        take: 5,
        orderBy: { creationDate: 'desc' },
        select: {
          id: true,
          dailyId: true,
          orderNumber: true,
          receiptNumber: true,
          status: true,
          patient: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
      }),
      prisma.test.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { code: { contains: query } },
          ],
          isGroup: false,
        },
        take: 5,
        include: { categoryRel: true },
        orderBy: { rank: 'asc' },
      }),
    ]);

    const results = [
      ...patients.map((p) => ({
        id: p.id,
        title: `${p.lastName} ${p.firstName}`,
        type: 'patient' as const,
        description: `Patient · ${p.gender === 'M' ? 'Homme' : 'Femme'}${p.phoneNumber ? ` · ${p.phoneNumber}` : ''}`,
      })),
      ...analyses.map((a) => ({
        id: a.id,
        title: `${a.dailyId ? `#${a.dailyId} - ` : ''}${a.patient?.lastName || ''} ${a.patient?.firstName || ''}`,
        type: 'analysis' as const,
        description: `ORD-${a.orderNumber} ${a.receiptNumber ? `(Reçu: ${a.receiptNumber})` : ''}`,
        url: `/analyses/${a.id}`,
      })),
      ...tests.map((t) => ({
        id: t.id,
        title: `${t.name} (${t.code})`,
        type: 'result' as const,
        description: `Paramètre · ${t.categoryRel?.name || 'Test'}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
