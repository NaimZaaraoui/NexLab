// src/app/api/analyses/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/security/auth';
import { notifyUsers, getUserIdsByRoles } from '@/lib/communications/notifications';
import { hasValidInternalPrintToken, requireAuthUser } from '@/lib/security/authz';
import { createAuditLog, getRequestMeta } from '@/lib/security/audit';
import { getPreviousResultsMapForAnalysis } from '@/lib/analysis/analysis-history';
import {
  buildAnalysisPatchData,
  buildPaymentState,
  isPaymentOnlyAnalysisUpdate,
  isPrintOnlyAnalysisUpdate,
  type AnalysisPatchPayload,
} from '@/lib/analysis/analysis-updates';
import { isAnalysisFinalValidated } from '@/lib/analysis/status-flow';
import {
  buildDailyIdConflictMessage,
  findDailyIdConflict,
  isDailyIdConflictError,
  normalizeDailyId,
} from '@/lib/analysis/analysis-daily-id';
import { prepareLearnedSettingUpdate } from '@/lib/settings/settings-learning';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isInternalPrint = hasValidInternalPrintToken(request);
    if (!isInternalPrint) {
      const guard = await requireAuthUser();
      if (!guard.ok) return guard.error;
    }

    const { id } = await params;
    
    const analysis = await getPreviousResultsMapForAnalysis(id);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Erreur GET /api/analyses/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isInternalPrint = hasValidInternalPrintToken(request);
    if (!isInternalPrint) {
      const guard = await requireAuthUser();
      if (!guard.ok) return guard.error;
    }

    const { id } = await params;
    const body = (await request.json()) as { status?: string };

    const existing = await prisma.analysis.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    if (isAnalysisFinalValidated(existing.status)) {
      return NextResponse.json(
        { error: 'Analyse validée: modification interdite' },
        { status: 409 }
      );
    }
    
    const analysis = await prisma.analysis.update({
      where: { id },
      data: {
        status: body.status
      },
      include: {
        results: {
          include: {
            test: true
          }
        }
      }
    });
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Erreur PUT /api/analyses/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = (await request.json()) as AnalysisPatchPayload;
    const meta = getRequestMeta({ headers: request.headers });

    const existing = await prisma.analysis.findUnique({
      where: { id },
      select: {
        status: true,
        totalPrice: true,
        amountPaid: true,
        paymentStatus: true,
        paymentMethod: true,
        paidAt: true,
        dailyId: true,
        creationDate: true,
        orderNumber: true,
        patientFirstName: true,
        patientLastName: true,
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    const isPrintOnlyUpdate = isPrintOnlyAnalysisUpdate(body);
    const isPaymentOnlyUpdate = isPaymentOnlyAnalysisUpdate(body);

    if (isAnalysisFinalValidated(existing.status) && !isPrintOnlyUpdate && !isPaymentOnlyUpdate) {
      return NextResponse.json(
        { error: 'Analyse validée: modification interdite' },
        { status: 409 }
      );
    }

    if (body.dailyId !== undefined) {
      body.dailyId = normalizeDailyId(body.dailyId);

      if (body.dailyId) {
        const dailyIdConflict = await findDailyIdConflict({
          dailyId: body.dailyId,
          referenceDate: existing.creationDate,
          excludeAnalysisId: id,
        });

        if (dailyIdConflict) {
          return NextResponse.json(
            {
              error: 'ID paillasse déjà utilisé',
              details: buildDailyIdConflictMessage(body.dailyId, dailyIdConflict.orderNumber),
            },
            { status: 409 }
          );
        }
      }
    }

    const paymentState = buildPaymentState(body, existing);

    const analysis = await prisma.analysis.update({
      where: { id },
      data: buildAnalysisPatchData(body, paymentState),
      include: {
        results: {
          include: {
            test: true
          }
        }
      }
    });

    if (paymentState.parsedAmountPaid !== undefined || body.paymentMethod !== undefined) {
      await createAuditLog({
        action: 'analysis.payment_update',
        severity: 'WARN',
        entity: 'analysis',
        entityId: id,
        details: {
          orderNumber: existing.orderNumber,
          patient: `${existing.patientLastName || ''} ${existing.patientFirstName || ''}`.trim(),
          previousAmountPaid: existing.amountPaid ?? 0,
          nextAmountPaid: paymentState.nextAmountPaid,
          paymentStatus: paymentState.nextPaymentStatus,
          paymentMethod: paymentState.nextPaymentMethod,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }

    if (body.provenance !== undefined || body.medecinPrescripteur !== undefined) {
      const learnedSettingsUpdates = await Promise.all([
        prepareLearnedSettingUpdate('provenance_options', [body.provenance]),
        prepareLearnedSettingUpdate('prescriber_options', [body.medecinPrescripteur]),
      ]);

      await prisma.$transaction(
        learnedSettingsUpdates.map((setting) =>
          prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: { key: setting.key, value: setting.value },
          })
        )
      );
    }
    
    // Notifications
    try {
      if (body.status === 'in_progress' && existing.status === 'pending') {
        const session = await auth();
        const medecinAdminIds = await getUserIdsByRoles(
          ['MEDECIN', 'ADMIN'],
          session?.user?.id
        );
        await notifyUsers({
          userIds: medecinAdminIds,
          type: 'results_entered',
          title: 'Résultats en cours de saisie',
          message: `Les résultats pour ${analysis.patientLastName} ${analysis.patientFirstName} (ORD-${analysis.orderNumber}) sont en cours de saisie.`,
          analysisId: id,
        });
      }
    } catch (e) {
      console.error('Error in status update notifications:', e);
    }

    return NextResponse.json(analysis);
  } catch (error) {
    if (isDailyIdConflictError(error)) {
      return NextResponse.json(
        {
          error: 'ID paillasse déjà utilisé',
          details: 'Cet ID paillasse est déjà utilisé aujourd’hui par un autre dossier.',
        },
        { status: 409 }
      );
    }

    console.error('Erreur PATCH /api/analyses/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { id } = await params;
    
    // Vérifier que l'analyse existe
    const analysis = await prisma.analysis.findUnique({
      where: { id }
    });
    
    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    if (isAnalysisFinalValidated(analysis.status)) {
      return NextResponse.json(
        { error: 'Analyse validée: suppression interdite' },
        { status: 409 }
      );
    }
    
    // Supprimer tous les résultats associés (cascade)
    await prisma.result.deleteMany({
      where: { analysisId: id }
    });
    
    // Supprimer l'analyse
    await prisma.analysis.delete({
      where: { id }
    });

    await createAuditLog({
      action: 'analysis.delete',
      severity: 'CRITICAL',
      entity: 'analysis',
      entityId: id,
      details: {
        orderNumber: analysis.orderNumber,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    
    return NextResponse.json(
      { message: 'Analyse supprimée avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur DELETE /api/analyses/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
