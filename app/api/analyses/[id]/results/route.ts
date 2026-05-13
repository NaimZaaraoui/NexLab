import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { resolveAnalysisTestIds } from '@/lib/analysis-tests';
import { isAnalysisFinalValidated } from '@/lib/status-flow';

interface SaveResultsPayload {
  results?: Record<string, unknown>;
  notes?: Record<string, string>;
}

interface UpdateTestsPayload {
  testsIds?: string[];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { id } = await params;
    const body = (await request.json()) as SaveResultsPayload;
    const { results, notes } = body;

    if (!results || typeof results !== 'object') {
      return NextResponse.json(
        { error: 'Données manquantes ou format invalide' },
        { status: 400 }
      );
    }

    // Valider que l'analyse existe
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        results: {
          include: { test: true }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    if (isAnalysisFinalValidated(analysis.status)) {
      return NextResponse.json(
        { error: 'Analyse validée: modification des résultats interdite' },
        { status: 409 }
      );
    }

    // Utilisation d'une transaction pour garantir l'intégrité des données
    const updates = Object.entries(results)
      .map(([resultId, value]) =>
        prisma.result.update({
          where: { id: resultId },
          data: { 
            value: value !== undefined && value !== null ? String(value).trim() || null : undefined,
            notes: notes && notes[resultId] !== undefined ? notes[resultId] : undefined,
            updatedAt: new Date()
          }
        })
      );

    await prisma.$transaction(updates);

    // Mettre à jour la date de modification de l'analyse
    await prisma.analysis.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        ...(analysis.status === 'pending' ? { status: 'in_progress' } : {})
      }
    });

    // Construire le delta pour l'audit
    const changes: Record<string, { oldValue: string | null; newValue: string | null }> = {};
    Object.entries(results).forEach(([resultId, newValueRaw]) => {
      const existingResult = analysis.results.find((result) => result.id === resultId);
      if (existingResult) {
        const oldVal = existingResult.value || null;
        const newVal = newValueRaw !== undefined && newValueRaw !== null ? String(newValueRaw).trim() || null : null;
        if (oldVal !== newVal) {
          changes[existingResult.test?.code || resultId] = {
            oldValue: oldVal,
            newValue: newVal
          };
        }
      }
    });

    if (Object.keys(changes).length > 0) {
      await createAuditLog({
        action: 'analysis.results_save',
        severity: 'INFO',
        entity: 'analysis',
        entityId: id,
        details: {
          deltas: changes,
          hadNotes: Boolean(notes),
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PUT results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des résultats', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { id } = await params;
    const body = (await request.json()) as UpdateTestsPayload;
    const { testsIds } = body;

    if (!Array.isArray(testsIds)) {
      return NextResponse.json({ error: 'testsIds invalide' }, { status: 400 });
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: { results: true }
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analyse non trouvée' }, { status: 404 });
    }

    if (isAnalysisFinalValidated(analysis.status)) {
      return NextResponse.json(
        { error: 'Analyse validée: modification des tests interdite' },
        { status: 409 }
      );
    }

    const resolvedTestsIds = await resolveAnalysisTestIds(testsIds);
    const currentTestIds = new Set(analysis.results.map(r => r.testId));
    const targetTestIds = new Set(resolvedTestsIds);

    const toCreate = resolvedTestsIds.filter(testId => !currentTestIds.has(testId));
    const toDelete = analysis.results.filter(r => !targetTestIds.has(r.testId)).map(r => r.id);

    await prisma.$transaction([
      ...(toDelete.length > 0
        ? [prisma.result.deleteMany({ where: { id: { in: toDelete }, analysisId: id } })]
        : []),
      ...(toCreate.length > 0
        ? [prisma.result.createMany({ data: toCreate.map(testId => ({ analysisId: id, testId })) })]
        : []),
      prisma.analysis.update({
        where: { id },
        data: { updatedAt: new Date() }
      })
    ]);

    await createAuditLog({
      action: 'analysis.tests_update',
      severity: 'WARN',
      entity: 'analysis',
      entityId: id,
      details: {
        added: toCreate.length,
        removed: toDelete.length,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, added: toCreate.length, removed: toDelete.length });
  } catch (error) {
    console.error('Erreur PATCH results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des tests', details: errorMessage },
      { status: 500 }
    );
  }
}
