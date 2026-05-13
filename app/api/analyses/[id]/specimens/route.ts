import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { isAnalysisFinalValidated } from '@/lib/status-flow';
import { prepareLearnedSettingUpdate } from '@/lib/settings-learning';
import { syncSpecimenQualityEvents } from '@/lib/quality-events';

type SpecimenPayload = {
  id?: string | null;
  sampleType?: string | null;
  containerType?: string | null;
  barcode?: string | null;
  status?: string | null;
  condition?: string | null;
  collectedAt?: string | null;
  receivedAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
};

const ALLOWED_STATUSES = new Set([
  'expected',
  'collected',
  'received',
  'accepted',
  'rejected',
  'stored',
]);

function cleanText(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value: unknown) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeSpecimen(input: SpecimenPayload) {
  const sampleType = cleanText(input.sampleType);
  if (!sampleType) {
    throw new Error("Type d'échantillon requis");
  }

  const status = cleanText(input.status) || 'expected';
  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error("Statut d'échantillon invalide");
  }

  return {
    id: cleanText(input.id),
    data: {
      sampleType,
      containerType: cleanText(input.containerType),
      barcode: cleanText(input.barcode),
      status,
      condition: cleanText(input.condition),
      collectedAt: parseDate(input.collectedAt),
      receivedAt: parseDate(input.receivedAt),
      acceptedAt: parseDate(input.acceptedAt),
      rejectedAt: parseDate(input.rejectedAt),
      rejectionReason: cleanText(input.rejectionReason),
      notes: cleanText(input.notes),
    },
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = (await request.json()) as { specimens?: SpecimenPayload[] };
    const meta = getRequestMeta({ headers: request.headers });

    if (!Array.isArray(body.specimens)) {
      return NextResponse.json(
        { error: 'Liste des échantillons invalide' },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        orderNumber: true,
        patientFirstName: true,
        patientLastName: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analyse non trouvée' }, { status: 404 });
    }

    if (isAnalysisFinalValidated(analysis.status)) {
      return NextResponse.json(
        { error: 'Analyse validée: modification des échantillons interdite' },
        { status: 409 }
      );
    }

    const normalized = body.specimens.map(normalizeSpecimen);

    // Guard: duplicate barcodes within the same payload
    const incomingBarcodes = normalized.map((item) => item.data.barcode).filter(Boolean) as string[];
    const barcodeSet = new Set<string>();
    for (const bc of incomingBarcodes) {
      if (barcodeSet.has(bc)) {
        return NextResponse.json(
          { error: `Code-barres dupliqué dans la saisie : "${bc}". Chaque tube doit avoir un code-barres unique.` },
          { status: 422 }
        );
      }
      barcodeSet.add(bc);
    }

    // Guard: barcode already used by another analysis
    if (incomingBarcodes.length > 0) {
      const conflicts = await prisma.specimen.findMany({
        where: {
          barcode: { in: incomingBarcodes },
          analysisId: { not: id },
        },
        select: { barcode: true },
      });
      if (conflicts.length > 0) {
        const conflicting = conflicts.map((c) => `"${c.barcode}"`).join(', ');
        return NextResponse.json(
          { error: `Code-barres déjà utilisé dans une autre analyse : ${conflicting}.` },
          { status: 409 }
        );
      }
    }

    const learnedSettingsUpdates = await Promise.all([
      prepareLearnedSettingUpdate('sample_types', normalized.map((item) => item.data.sampleType)),
      prepareLearnedSettingUpdate('sample_containers', normalized.map((item) => item.data.containerType)),
      prepareLearnedSettingUpdate('sample_conditions', normalized.map((item) => item.data.condition)),
    ]);

    // Replace strategy: delete all existing specimens then recreate.
    // This avoids P2002 barcode unique-constraint violations that occur
    // when saving the same specimen data twice (e.g. double-save or multi-tab).
    await prisma.$transaction([
      prisma.specimen.deleteMany({ where: { analysisId: id } }),
      ...normalized.map((item) =>
        prisma.specimen.create({
          data: { ...item.data, analysisId: id },
        })
      ),
      ...learnedSettingsUpdates.map((setting) =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value },
        })
      ),
    ]);

    const specimens = await prisma.specimen.findMany({
      where: { analysisId: id },
      orderBy: [
        { sampleType: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    await syncSpecimenQualityEvents({
      analysis,
      specimens,
      detectedById: guard.userId,
      detectedByName: guard.session.user.name,
    });

    await createAuditLog({
      action: 'analysis.specimens_update',
      severity: normalized.some((item) => item.data.status === 'rejected') ? 'WARN' : 'INFO',
      entity: 'analysis',
      entityId: id,
      details: {
        orderNumber: analysis.orderNumber,
        patient: `${analysis.patientLastName || ''} ${analysis.patientFirstName || ''}`.trim(),
        specimens: normalized.map((item) => ({
          sampleType: item.data.sampleType,
          status: item.data.status,
          condition: item.data.condition,
          rejected: item.data.status === 'rejected',
        })),
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ specimens });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des échantillons';
    console.error('Erreur PUT /api/analyses/[id]/specimens:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
