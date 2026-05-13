import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/authz';
import { getAnalysisQcReadiness } from '@/lib/qc-readiness';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const readiness = await getAnalysisQcReadiness(id);
    return NextResponse.json(readiness);
  } catch (error) {
    console.error('Erreur GET /api/analyses/[id]/qc-readiness:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du chargement du statut QC' },
      { status: 500 }
    );
  }
}
