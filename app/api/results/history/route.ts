import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/authz';

export async function GET(request: NextRequest) {
  const guard = await requireAuthUser();
  if (!guard.ok) return guard.error;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const testId = searchParams.get('testId');
  const currentAnalysisId = searchParams.get('currentAnalysisId');

  if (!patientId || !testId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const previousResult = await prisma.result.findFirst({
      where: {
        testId,
        analysis: {
          patientId,
          id: { not: currentAnalysisId || '' },
          status: 'completed',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        analysis: true,
      },
    });

    return NextResponse.json(previousResult);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
