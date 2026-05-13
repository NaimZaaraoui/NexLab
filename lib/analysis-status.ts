export type AnalysisStatus = 'pending' | 'in_progress' | 'validated_tech' | 'validated_bio' | 'completed' | 'cancelled';

export interface StatusMeta {
  label: string;
  classes: string;
  stepNumber: number;
}

export const ANALYSIS_STATUSES: Record<AnalysisStatus, StatusMeta> = {
  pending: { label: 'En attente', classes: 'bg-amber-50 text-amber-700 border border-amber-200/70', stepNumber: 1 },
  in_progress: { label: 'En cours', classes: 'bg-blue-50 text-blue-700 border border-blue-200/70', stepNumber: 1 },
  validated_tech: { label: 'Validé Tech', classes: 'bg-cyan-50 text-cyan-700 border border-cyan-200/70', stepNumber: 2 },
  validated_bio: { label: 'Validé Bio', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70', stepNumber: 2 },
  completed: { label: 'Validé', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70', stepNumber: 2 },
  cancelled: { label: 'Annulé', classes: 'bg-rose-50 text-rose-700 border border-rose-200/70', stepNumber: 0 },
};

export function getAnalysisStatusMeta(status: string | null | undefined): StatusMeta {
  if (!status) return ANALYSIS_STATUSES.pending;
  return ANALYSIS_STATUSES[status as AnalysisStatus] || ANALYSIS_STATUSES.pending;
}

export function isAnalysisFinalValidated(status: string | null | undefined): boolean {
  return status === 'validated_bio' || status === 'completed';
}
