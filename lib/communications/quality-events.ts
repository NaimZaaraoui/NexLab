import { prisma } from '@/lib/db/prisma';

type AnalysisForQualityEvent = {
  id: string;
  orderNumber: string;
  patient?: {
    firstName: string;
    lastName: string;
  } | null;
};

type SpecimenForQualityEvent = {
  id: string;
  sampleType: string;
  containerType: string | null;
  barcode: string | null;
  status: string;
  condition: string | null;
  rejectionReason: string | null;
};

type SyncSpecimenQualityEventsInput = {
  analysis: AnalysisForQualityEvent;
  specimens: SpecimenForQualityEvent[];
  detectedById?: string | null;
  detectedByName?: string | null;
};

function specimenSourceKey(specimenId: string) {
  return `specimen:${specimenId}:rejected`;
}

function buildRejectedSpecimenDescription(specimen: SpecimenForQualityEvent) {
  const details = [
    `Type: ${specimen.sampleType}`,
    specimen.containerType ? `Contenant: ${specimen.containerType}` : null,
    specimen.barcode ? `Code-barres: ${specimen.barcode}` : null,
    specimen.condition ? `État: ${specimen.condition}` : null,
    specimen.rejectionReason ? `Motif: ${specimen.rejectionReason}` : 'Motif non renseigné',
  ].filter(Boolean);

  return details.join('\n');
}

export async function syncSpecimenQualityEvents({
  analysis,
  specimens,
  detectedById,
  detectedByName,
}: SyncSpecimenQualityEventsInput) {
  const patientName = `${analysis.patient?.lastName || ''} ${analysis.patient?.firstName || ''}`.trim() || null;
  const rejectedSpecimens = specimens.filter((specimen) => specimen.status === 'rejected');
  const rejectedIds = new Set(rejectedSpecimens.map((specimen) => specimen.id));

  await Promise.all(
    rejectedSpecimens.map((specimen) =>
      prisma.qualityEvent.upsert({
        where: { sourceKey: specimenSourceKey(specimen.id) },
        update: {
          severity: specimen.rejectionReason ? 'WARN' : 'CRITICAL',
          status: 'OPEN',
          title: `Échantillon rejeté - ${specimen.sampleType}`,
          description: buildRejectedSpecimenDescription(specimen),
          orderNumber: analysis.orderNumber,
          patientName,
          detectedById: detectedById || null,
          detectedByName: detectedByName || null,
          resolvedAt: null,
          resolution: null,
        },
        create: {
          sourceKey: specimenSourceKey(specimen.id),
          type: 'PRE_ANALYTICAL',
          source: 'SPECIMEN',
          severity: specimen.rejectionReason ? 'WARN' : 'CRITICAL',
          status: 'OPEN',
          title: `Échantillon rejeté - ${specimen.sampleType}`,
          description: buildRejectedSpecimenDescription(specimen),
          analysisId: analysis.id,
          specimenId: specimen.id,
          orderNumber: analysis.orderNumber,
          patientName,
          detectedById: detectedById || null,
          detectedByName: detectedByName || null,
        },
      })
    )
  );

  const resolvedSpecimenIds = specimens
    .filter((specimen) => !rejectedIds.has(specimen.id))
    .map((specimen) => specimen.id);

  if (resolvedSpecimenIds.length === 0) return;

  await prisma.qualityEvent.updateMany({
    where: {
      sourceKey: { in: resolvedSpecimenIds.map(specimenSourceKey) },
      status: { not: 'RESOLVED' },
    },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolution: 'Échantillon corrigé ou accepté lors de la mise à jour.',
    },
  });
}
