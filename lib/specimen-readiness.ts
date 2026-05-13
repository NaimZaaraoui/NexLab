import type { Specimen } from '@/lib/types';

export type SpecimenReadinessBlocker = {
  specimenId: string;
  sampleType: string;
  containerType: string | null;
  status: string;
  reason: string;
};

export type SpecimenReadiness = {
  ready: boolean;
  blockers: SpecimenReadinessBlocker[];
};

type SpecimenLike = Pick<Specimen, 'id' | 'sampleType' | 'containerType' | 'barcode' | 'status' | 'rejectionReason'>;

export function getSpecimenReadiness(specimens: SpecimenLike[] | null | undefined): SpecimenReadiness {
  const blockers: SpecimenReadinessBlocker[] = [];
  const specimenList = specimens || [];

  if (specimenList.length === 0) {
    return {
      ready: false,
      blockers: [
        {
          specimenId: 'missing',
          sampleType: 'Échantillon',
          containerType: null,
          status: 'missing',
          reason: 'Aucun échantillon enregistré',
        },
      ],
    };
  }

  for (const specimen of specimenList) {
    const base = {
      specimenId: specimen.id,
      sampleType: specimen.sampleType,
      containerType: specimen.containerType,
      status: specimen.status,
    };

    if (!specimen.barcode || !specimen.barcode.trim()) {
      blockers.push({
        ...base,
        reason: 'Code-barres manquant',
      });
    }

    if (specimen.status === 'rejected') {
      blockers.push({
        ...base,
        reason: specimen.rejectionReason?.trim()
          ? `Échantillon rejeté: ${specimen.rejectionReason.trim()}`
          : 'Échantillon rejeté sans motif',
      });
      continue;
    }

    if (specimen.status === 'expected' || specimen.status === 'collected') {
      blockers.push({
        ...base,
        reason: 'Échantillon non reçu',
      });
    }
  }

  return {
    ready: blockers.length === 0,
    blockers,
  };
}

export function formatSpecimenBlocker(blocker: SpecimenReadinessBlocker) {
  const label = [blocker.sampleType, blocker.containerType].filter(Boolean).join(' / ');
  return `${label || 'Échantillon'}: ${blocker.reason}`;
}
