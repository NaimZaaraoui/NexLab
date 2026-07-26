import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAnyRole } from '@/lib/security/authz';
import { createAuditLog, getRequestMeta } from '@/lib/security/audit';
import { getTestReferenceValues } from '@/lib/core/utils';
import { isAnalysisFinalValidated } from '@/lib/analysis/status-flow';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN']);
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const testIdsParam = searchParams.get('testIds');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD

    if ((!testId && !testIdsParam) || !dateStr) {
      return NextResponse.json({ error: 'testId(s) and date are required' }, { status: 400 });
    }

    const testIds = testIdsParam ? testIdsParam.split(',') : (testId ? [testId] : []);

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await prisma.result.findMany({
      where: {
        testId: { in: testIds },
        analysis: {
          creationDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
      include: {
        analysis: {
          select: {
            id: true,
            dailyId: true,
            patient: {
              select: { firstName: true, lastName: true, gender: true, birthDate: true },
            },
            status: true,
          },
        },
        test: true,
      },
      orderBy: {
        analysis: {
          dailyId: 'asc',
        },
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Erreur GET batch:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

interface BatchUpdateItem {
  resultId: string;
  analysisId: string;
  value: string;
  notes?: string;
  metadata?: string;
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json() as { updates: BatchUpdateItem[] };
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid updates payload' }, { status: 400 });
    }

    // Retrieve all relevant analyses to check status
    const analysisIds = Array.from(new Set(updates.map(u => u.analysisId)));
    const analyses = await prisma.analysis.findMany({
      where: { id: { in: analysisIds } },
      select: { id: true, status: true },
    });

    const analysisStatusMap = new Map(analyses.map(a => [a.id, a.status]));

    // Build Prisma update promises
    const tx = [];
    const updatedAnalysisIds = new Set<string>();
    const changes: Record<string, string> = {}; // For audit log

    for (const update of updates) {
      const status = analysisStatusMap.get(update.analysisId);
      if (status && isAnalysisFinalValidated(status)) {
        continue; // Skip validated analyses
      }

      updatedAnalysisIds.add(update.analysisId);
      changes[update.resultId] = update.value;

      tx.push(
        prisma.result.update({
          where: { id: update.resultId },
          data: {
            value: update.value || null,
            notes: update.notes !== undefined ? update.notes : undefined,
            updatedAt: new Date(),
          },
        })
      );
    }

    // Update analyses updatedAt and status if pending
    for (const aId of Array.from(updatedAnalysisIds)) {
      const status = analysisStatusMap.get(aId);
      tx.push(
        prisma.analysis.update({
          where: { id: aId },
          data: {
            updatedAt: new Date(),
            ...(status === 'pending' ? { status: 'in_progress' } : {}),
          },
        })
      );
    }

    await prisma.$transaction(tx);

    await createAuditLog({
      action: 'analysis.batch_results_save',
      severity: 'INFO',
      entity: 'analysis',
      entityId: 'batch',
      details: { updatedCount: updates.length, updatedAnalysisCount: updatedAnalysisIds.size },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, count: updates.length });
  } catch (error) {
    console.error('Erreur PUT batch:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde batch' }, { status: 500 });
  }
}
