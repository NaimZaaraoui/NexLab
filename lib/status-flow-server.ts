import type { Analysis } from '@/lib/types';
import type { AppRole } from '@/lib/authz';
import { AnalysisStatus, canTransition, TRANSITION_REQUIREMENTS } from '@/lib/status-flow';
import { getAnalysisQcReadiness } from '@/lib/qc-readiness';

/**
 * Async version of canTransition that also enforces QC compliance.
 * Use this at the API layer before persisting a status change.
 * This is kept in a separate file to avoid bundling Prisma into client components.
 *
 * @param analysis - Current analysis state
 * @param targetStatus - Desired status
 * @param userRole - User attempting the transition
 * @returns Object with allowed flag and detailed reason if denied
 */
export async function canTransitionAsync(
  analysis: Analysis,
  targetStatus: AnalysisStatus,
  userRole: AppRole
): Promise<{ allowed: boolean; reason?: string }> {
  const syncResult = canTransition(analysis, targetStatus, userRole);
  if (!syncResult.allowed) return syncResult;

  const requireKey = `${analysis.status}->${targetStatus}`;
  const requirements = TRANSITION_REQUIREMENTS[requireKey];

  if (requirements?.requireQCCompliant) {
    try {
      const qcReadiness = await getAnalysisQcReadiness(analysis.id);
      if (!qcReadiness.ready) {
        const blockerSummary = qcReadiness.blockers
          .map(b => `${b.materialName} lot ${b.lotNumber} (${b.status})`)
          .join(', ');
        return {
          allowed: false,
          reason: `Contrôle qualité non conforme : ${blockerSummary}`,
        };
      }
    } catch {
      // QC check failure should not block validation — log and continue
      console.warn('[canTransitionAsync] QC readiness check failed, skipping QC enforcement');
    }
  }

  return { allowed: true };
}
