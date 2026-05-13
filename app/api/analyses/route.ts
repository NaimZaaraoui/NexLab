// src/app/api/analyses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/app/generated/prisma';
import {prisma} from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notifyUsers, getUserIdsByRoles } from '@/lib/notifications';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { resolveAnalysisTestIds } from '@/lib/analysis-tests';
import { analysisCreateSchema } from '@/lib/validators';
import { getLicenseStatus } from '@/lib/license';
import {
  buildDailyIdConflictMessage,
  findDailyIdConflict,
  isDailyIdConflictError,
  normalizeDailyId,
} from '@/lib/analysis-daily-id';
import { prepareLearnedSettingUpdate } from '@/lib/settings-learning';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const status = searchParams.get('status');
    const includeResults = searchParams.get('includeResults') === 'true';
    const category = searchParams.get('category');
    
    // Pagination params
    const isPaginated = searchParams.get('paginated') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    const q = searchParams.get('q');
    
    const where: Prisma.AnalysisWhereInput = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (start || end) {
      where.creationDate = {};
      if (start) {
        where.creationDate.gte = new Date(start);
      }
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        where.creationDate.lte = endDate;
      }
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { orderNumber: { contains: q } },
        { patientFirstName: { contains: q } },
        { patientLastName: { contains: q } }
      ];
    }

    if (category) {
      where.results = {
        some: {
          test: {
            categoryRel: {
              name: category,
            }
          }
        }
      };
    }

    let analyses = [];
    let totalCount = 0;

    const findOptions = {
      where,
      include: {
        results: includeResults ? {
          include: {
            test: {
              include: {
                categoryRel: true
              }
            }
          }
        } : {
          select: {
            id: true,
            testId: true,
            test: {
              select: {
                parentId: true,
                isGroup: true,
              }
            }
          }
        }
      },
      orderBy: { creationDate: 'desc' } as Prisma.AnalysisOrderByWithRelationInput
    };

    if (isPaginated) {
      const skip = (page - 1) * limit;
      const [count, items] = await prisma.$transaction([
        prisma.analysis.count({ where }),
        prisma.analysis.findMany({ ...findOptions, skip, take: limit })
      ]);
      totalCount = count;
      analyses = items;
    } else {
      analyses = await prisma.analysis.findMany(findOptions);
    }

    const normalizedAnalyses = analyses.map((analysis) => {
      const testsCount = (analysis.results || []).filter(
        (result) => !result.test?.parentId
      ).length;

      return { ...analysis, testsCount };
    });

    if (isPaginated) {
      return NextResponse.json({
        items: normalizedAnalyses,
        pagination: {
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          page,
          limit
        }
      });
    }

    return NextResponse.json(normalizedAnalyses);
  } catch (error) {
    console.error('Erreur GET /api/analyses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analyses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE']);
    if (!guard.ok) return guard.error;
    
    const license = await getLicenseStatus();
    if (!license.isValid) {
      return NextResponse.json({ 
        error: 'Paiement Requis (402)', 
        details: 'Licence NexLab expirée ou absente. L\'application est verrouillée en mode Lecture Seule.' 
      }, { status: 402 });
    }

    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    const parsed = analysisCreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: parsed.error.format() 
      }, { status: 400 });
    }
    
    // Générer numéro d'ordre unique (Robuste: cherche le max existant du jour)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastAnalysisToday = await prisma.analysis.findFirst({
      where: {
        orderNumber: {
          startsWith: dateStr
        }
      },
      orderBy: {
        orderNumber: 'desc'
      }
    });

    const creationTimestamp = new Date();

    let nextOrderNum = 1;
    if (lastAnalysisToday) {
      const lastPart = lastAnalysisToday.orderNumber.split('-')[1];
      nextOrderNum = parseInt(lastPart, 10) + 1;
    }
    const orderNumber = `${dateStr}-${nextOrderNum.toString().padStart(4, '0')}`;
    
    // Générer numéro de quittance (receiptNumber) - Robuste: cherche le max numérique
    const lastAnalysisAny = await prisma.analysis.findFirst({
      where: {
        receiptNumber: {
          startsWith: 'Q'
        }
      },
      orderBy: {
        receiptNumber: 'desc'
      }
    });

    let nextReceiptNum = 1;
    if (lastAnalysisAny && lastAnalysisAny.receiptNumber) {
      const match = lastAnalysisAny.receiptNumber.match(/Q(\d+)/);
      if (match) {
        nextReceiptNum = parseInt(match[1], 10) + 1;
      }
    }
    const receiptNumber = `Q${nextReceiptNum.toString().padStart(6, '0')}`;
    
    const { 
      dailyId,
      patientId, 
      selectedPatientId,
      patientFirstName, 
      patientLastName, 
      patientBirthDate,
      patientGender, 
      patientPhone,
      patientEmail,
      patientAddress,
      provenance,
      medecinPrescripteur,
      isUrgent,
      globalNote,
      globalNotePlacement,
      receiptNumber: receiptNumberFromBody,
      testsIds,
      insuranceProvider,
      insuranceNumber,
      insuranceCoverage,
    } = parsed.data;

    // Determine Patient UUID and Daily ID (handling naming inconsistencies)
    const finalPatientId = selectedPatientId || (typeof patientId === 'string' && patientId.includes('-') ? patientId : null);
    const finalDailyId = normalizeDailyId(
      dailyId || (typeof patientId === 'string' && !patientId.includes('-') ? patientId : patientId)
    );

    if (!finalDailyId) {
      return NextResponse.json(
        { error: 'Données invalides', details: 'Le numéro de paillasse est requis.' },
        { status: 400 }
      );
    }

    const dailyIdConflict = await findDailyIdConflict({
      dailyId: finalDailyId,
      referenceDate: creationTimestamp,
    });

    if (dailyIdConflict) {
      return NextResponse.json(
        {
          error: 'ID paillasse déjà utilisé',
          details: buildDailyIdConflictMessage(finalDailyId, dailyIdConflict.orderNumber),
        },
        { status: 409 }
      );
    }

    // If no existing patient selected, create one
    const parseDate = (d: string | null | undefined) => {
      if (!d) return null;
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    };

    const birthDateObj = parseDate(patientBirthDate);
    const calculatedAge = birthDateObj ? new Date().getFullYear() - birthDateObj.getFullYear() : null;

    const resolvedTestsIds = await resolveAnalysisTestIds(testsIds);
    
    // Calculate total price based on resolved tests
    const testsData = await prisma.test.findMany({
      where: { id: { in: resolvedTestsIds } },
      select: { price: true }
    });
    const totalPrice = testsData.reduce((sum, t) => sum + (t.price || 0), 0);

    const coveragePct = typeof insuranceCoverage === 'number' && insuranceCoverage > 0 ? insuranceCoverage : 0;
    const insuranceShare = coveragePct > 0 ? Math.round((totalPrice * coveragePct / 100) * 100) / 100 : 0;
    const patientShare = Math.round((totalPrice - insuranceShare) * 100) / 100;
    
    const analysis = await prisma.$transaction(async (tx) => {
      let transactionPatientId = finalPatientId;

      if (!transactionPatientId) {
        const newPatient = await tx.patient.create({
          data: {
            firstName: patientFirstName,
            lastName: patientLastName,
            gender: patientGender,
            birthDate: birthDateObj,
            phoneNumber: patientPhone,
            email: patientEmail,
            address: patientAddress,
            insuranceProvider: insuranceProvider || null,
            insuranceNumber: insuranceNumber || null,
          }
        });
        transactionPatientId = newPatient.id;
      }

      return tx.analysis.create({
        data: {
          orderNumber,
          dailyId: finalDailyId,
          patientId: transactionPatientId,
          creationDate: creationTimestamp,
          totalPrice: totalPrice,
          patientFirstName,
          patientLastName,
          patientAge: calculatedAge,
          patientGender,
          receiptNumber: receiptNumberFromBody || receiptNumber,
          provenance: provenance || null,
          medecinPrescripteur: medecinPrescripteur || null,
          isUrgent: Boolean(isUrgent),
          globalNote: globalNote?.trim() || null,
          globalNotePlacement: ['all', 'first', 'last'].includes(globalNotePlacement) ? globalNotePlacement : 'all',
          status: 'pending',
          insuranceProvider: insuranceProvider || null,
          insuranceCoverage: coveragePct > 0 ? coveragePct : null,
          insuranceShare,
          patientShare,
          results: {
            create: resolvedTestsIds.map((testId: string) => ({
              testId,
            }))
          }
        },
        include: {
          results: {
            include: {
              test: true
            }
          }
        }
      });
    });

    const learnedSettingsUpdates = await Promise.all([
      prepareLearnedSettingUpdate('provenance_options', [provenance]),
      prepareLearnedSettingUpdate('prescriber_options', [medecinPrescripteur]),
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
    
    // Notifications
    try {
      const session = await auth();
      const creatorId = session?.user?.id || '';

      // Notify all technicians and admins (excluding the creator)
      const techAdminIds = await getUserIdsByRoles(
        ['TECHNICIEN', 'ADMIN'], 
        creatorId
      );

      await notifyUsers({
        userIds: techAdminIds,
        type: 'new_analysis',
        title: 'Nouvelle analyse',
        message: `Nouvelle analyse pour ${analysis.patientLastName} ${analysis.patientFirstName} — ORD-${analysis.orderNumber}`,
        analysisId: analysis.id,
      });

      // If urgent: notify ALL active users immediately
      if (analysis.isUrgent) {
        const allUserIds = await getUserIdsByRoles(
          ['ADMIN', 'TECHNICIEN', 'MEDECIN', 'RECEPTIONNISTE'],
          creatorId
        );
        await notifyUsers({
          userIds: allUserIds,
          type: 'urgent',
          title: 'URGENT — Analyse prioritaire',
          message: `Analyse urgente créée pour ${analysis.patientLastName} ${analysis.patientFirstName} — ORD-${analysis.orderNumber}`,
          analysisId: analysis.id,
        });
      }
    } catch (e) {
      console.error('Error in analysis notifications:', e);
    }

    await createAuditLog({
      action: 'analysis.create',
      severity: analysis.isUrgent ? 'WARN' : 'INFO',
      entity: 'analysis',
      entityId: analysis.id,
      details: {
        orderNumber: analysis.orderNumber,
        patient: `${analysis.patientLastName || ''} ${analysis.patientFirstName || ''}`.trim(),
        totalPrice: analysis.totalPrice,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(analysis, { status: 201 });
  } catch (error: unknown) {
    if (isDailyIdConflictError(error)) {
      return NextResponse.json(
        {
          error: 'ID paillasse déjà utilisé',
          details: 'Cet ID paillasse est déjà utilisé aujourd’hui par un autre dossier.',
        },
        { status: 409 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Erreur POST /api/analyses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'analyse', details: errorMessage },
      { status: 500 }
    );
  }
}
