import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/security/auth';
import { notifyUsers, getUserIdsByRoles } from '@/lib/communications/notifications';
import { createAuditLog, getRequestMeta } from '@/lib/security/audit';
import { applyAutomaticConsumptionForAnalysis } from '@/lib/inventory/inventory';
import { getAnalysisQcReadiness } from '@/lib/clinical/qc-readiness';
import { formatSpecimenBlocker, getSpecimenReadiness } from '@/lib/analysis/specimen-readiness';
import { backgroundGenerateAndCachePdf } from '@/lib/documents/pdf-storage';
import { generateValidationHash } from '@/lib/security/validation-seal';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const type = body?.type as 'tech' | 'bio' | undefined;
    const meta = getRequestMeta({ headers: request.headers });

    if (!type || (type !== 'tech' && type !== 'bio')) {
      return NextResponse.json({ error: 'Type de validation invalide' }, { status: 400 });
    }

    const analysis = await prisma.analysis.findUnique({ where: { id } });
    if (!analysis) {
      return NextResponse.json({ error: 'Analyse non trouvée' }, { status: 404 });
    }

    const role = session.user.role || '';
    const userId = session.user.id || null;
    const userName = session?.user?.name || 'Utilisateur';

    if (type === 'tech') {
      if (!['TECHNICIEN', 'ADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Rôle insuffisant' }, { status: 403 });
      }
      if (analysis.status !== 'in_progress') {
        return NextResponse.json(
          { error: "Validation technique impossible: saisissez et sauvegardez d'abord les résultats (statut En analyse)." },
          { status: 400 }
        );
      }

      const analysisResults = await prisma.result.findMany({
        where: { analysisId: id },
        include: { test: { select: { id: true, isGroup: true, name: true, resultType: true, isOptional: true, parentId: true } } },
      });

      // Identifier tous les tests qui agissent comme parents dans cette analyse
      const parentTestIds = new Set(
        analysisResults
          .map(r => r.test?.parentId)
          .filter((pid): pid is string => Boolean(pid))
      );

      // Exclude group headers, calculated fields, explicitly optional tests, AND tests that act as parents
      const requiredResults = analysisResults.filter(r => 
        !r.test?.isGroup && 
        r.test?.resultType !== 'calculated' && 
        !r.test?.isOptional &&
        !parentTestIds.has(r.testId) // Un test parent n'a pas besoin de valeur (c'est juste un en-tête)
      );
      const emptyResults = requiredResults.filter(r => !r.value || r.value.trim() === '');

      if (requiredResults.length === 0 && analysisResults.length === 0) {
        return NextResponse.json(
          { error: 'Aucun résultat trouvé. Ajoutez des analyses et saisissez les résultats avant de valider.' },
          { status: 400 }
        );
      }

      if (emptyResults.length > 0) {
        const missingNames = emptyResults
          .map(r => r.test?.name || 'Inconnu')
          .slice(0, 5)
          .join(', ');
        const suffix = emptyResults.length > 5 ? ` et ${emptyResults.length - 5} autre(s)` : '';
        return NextResponse.json(
          { error: `Résultats manquants ou non sauvegardés: ${missingNames}${suffix}. Saisissez et sauvegardez tous les résultats avant la validation.` },
          { status: 400 }
        );
      }

      const specimens = await prisma.specimen.findMany({
        where: { analysisId: id },
      });
      const specimenReadiness = getSpecimenReadiness(specimens);

      if (!specimenReadiness.ready) {
        const details = specimenReadiness.blockers
          .slice(0, 6)
          .map(formatSpecimenBlocker)
          .join(' ; ');
        const suffix = specimenReadiness.blockers.length > 6
          ? ` ; et ${specimenReadiness.blockers.length - 6} autre(s)`
          : '';

        return NextResponse.json(
          {
            error: `Validation technique bloquée: contrôle pré-analytique non conforme. ${details}${suffix}`,
          },
          { status: 409 }
        );
      }

      const qcReadiness = await getAnalysisQcReadiness(id);
      if (!qcReadiness.ready) {
        const details = qcReadiness.blockers
          .map((lot) => {
            const statusLabel = lot.status === 'fail' ? 'QC en échec' : "QC manquant aujourd'hui";
            return `${lot.materialName} / lot ${lot.lotNumber} (${lot.tests.join(', ')}) : ${statusLabel}`;
          })
          .join(' ; ');

        return NextResponse.json(
          {
            error: `Validation technique bloquée: certains QC requis ne sont pas conformes. ${details}`,
          },
          { status: 409 }
        );
      }

      try {
        await applyAutomaticConsumptionForAnalysis({
          analysisId: id,
          performedBy: userName,
        });
      } catch (consumptionError) {
        const message =
          consumptionError instanceof Error
            ? consumptionError.message
            : 'Stock insuffisant pour appliquer la consommation automatique';
        return NextResponse.json(
          { error: `Validation bloquée: ${message}` },
          { status: 409 }
        );
      }

      const updated = await prisma.analysis.update({
        where: { id },
        data: {
          status: 'validated_tech',
          validatedTechAt: new Date(),
          validatedTechBy: userId,
          validatedTechName: userName,
          updatedAt: new Date()
        },
        include: {
          results: { include: { test: true } },
          patient: true
        }
      });

      // Notifications
      try {
        const bioIds = await getUserIdsByRoles(['ADMIN', 'MEDECIN']);
        if (bioIds.length > 0) {
          await notifyUsers({
            userIds: bioIds,
            type: 'validated_tech',
            title: 'Validation technique effectuée',
            message: `${updated.patient?.lastName || ''} ${updated.patient?.firstName || ''} (ORD-${updated.orderNumber}) est prêt pour la validation biologique.`,
            analysisId: id,
          });
        }
      } catch (e) {
        console.error('Error in tech validation notification:', e);
      }

      await createAuditLog({
        action: 'analysis.validate_tech',
        severity: 'INFO',
        entity: 'analysis',
        entityId: id,
        details: {
          orderNumber: updated.orderNumber,
          patient: `${updated.patient?.lastName || ''} ${updated.patient?.firstName || ''}`.trim(),
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json(updated);
    }

    if (!['MEDECIN', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Rôle insuffisant' }, { status: 403 });
    }
    if (analysis.status !== 'validated_tech') {
      return NextResponse.json(
        { error: 'Validation biologique impossible: la validation technique doit être effectuée en premier.' },
        { status: 400 }
      );
    }

    const analysisWithResults = await prisma.analysis.findUnique({
      where: { id },
      include: { results: true }
    });

    if (!analysisWithResults) {
      return NextResponse.json({ error: 'Analyse non trouvée pour validation' }, { status: 404 });
    }

    const validationHash = generateValidationHash(
      { id: analysisWithResults.id, patientId: analysisWithResults.patientId, orderNumber: analysisWithResults.orderNumber },
      analysisWithResults.results
    );

    const updated = await prisma.analysis.update({
      where: { id },
      data: {
        status: 'validated_bio',
        validatedBioAt: new Date(),
        validatedBioBy: userId,
        validatedBioName: userName,
        validationHash: validationHash,
        updatedAt: new Date()
      },
      include: {
        results: { include: { test: true } },
        patient: true
      }
    });

    // 🚀 Lancement de la génération PDF en arrière-plan (Fire-and-forget)
    const origin = request.headers.get('origin') || `http://${request.headers.get('host')}` || 'http://localhost:3000';
    Promise.resolve().then(() => backgroundGenerateAndCachePdf(id, origin));

    // Notifications
    try {
      const ids = await getUserIdsByRoles(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE']);
      if (ids.length > 0) {
        await notifyUsers({
          userIds: ids,
          type: 'validated_bio',
          title: 'Résultats validés — prêts à imprimer',
          message: `Le rapport de ${updated.patient?.lastName || ''} ${updated.patient?.firstName || ''} (ORD-${updated.orderNumber}) a été validé biologiquement et est prêt pour impression.`,
          analysisId: id,
        });
      }
    } catch (e) {
      console.error('Error in bio validation notification:', e);
    }

    await createAuditLog({
      action: 'analysis.validate_bio',
      severity: 'INFO',
      entity: 'analysis',
      entityId: id,
      details: {
        orderNumber: updated.orderNumber,
        patient: `${updated.patient?.lastName || ''} ${updated.patient?.firstName || ''}`.trim(),
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PATCH validate:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    );
  }
}
