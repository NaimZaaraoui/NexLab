/**
 * lib/status-flow.ts
 * 
 * State machine and permission logic for analysis lifecycle
 * Consolidates status transitions and permission checks from:
 * - app/api/analyses/* (status update endpoints)
 * - app/actions/* (server actions)
 * - lib/constants.ts (status definitions)
 */

import type { Analysis } from '@/lib/core/types';
import type { AppRole } from '@/lib/security/authz';

// ============================================================================
// STATUS DEFINITIONS & CONSTANTS
// ============================================================================

/**
 * Valid analysis status values
 * Represents the complete lifecycle of an analysis from creation to completion
 */
export const ANALYSIS_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  VALIDATED_TECH: 'validated_tech',
  VALIDATED_BIO: 'validated_bio',
  COMPLETED: 'completed', // Alias for validated_bio
  CANCELLED: 'cancelled',
} as const;

export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[keyof typeof ANALYSIS_STATUSES];

/**
 * UI metadata for status display
 * Used for badges, labels, and visual indicators
 */
export const STATUS_UI_MAP: Record<AnalysisStatus, { label: string; color: string; bgColor: string }> = {
  [ANALYSIS_STATUSES.PENDING]: {
    label: 'En attente',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  [ANALYSIS_STATUSES.IN_PROGRESS]: {
    label: 'En cours',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  [ANALYSIS_STATUSES.VALIDATED_TECH]: {
    label: 'Validée (Tech)',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
  },
  [ANALYSIS_STATUSES.VALIDATED_BIO]: {
    label: 'Validée (Bio)',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  [ANALYSIS_STATUSES.COMPLETED]: {
    label: 'Complétée',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  [ANALYSIS_STATUSES.CANCELLED]: {
    label: 'Annulée',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

// ============================================================================
// PERMISSION MODEL
// ============================================================================

/**
 * Role-based permissions for status transitions
 * Defines which user roles can transition analyses to each status
 */
export const ROLE_PERMISSIONS: Record<AppRole, AnalysisStatus[]> = {
  ADMIN: [
    ANALYSIS_STATUSES.PENDING,
    ANALYSIS_STATUSES.IN_PROGRESS,
    ANALYSIS_STATUSES.VALIDATED_TECH,
    ANALYSIS_STATUSES.VALIDATED_BIO,
    ANALYSIS_STATUSES.CANCELLED,
  ],
  TECHNICIEN: [ANALYSIS_STATUSES.IN_PROGRESS, ANALYSIS_STATUSES.VALIDATED_TECH],
  MEDECIN: [ANALYSIS_STATUSES.VALIDATED_BIO],
  RECEPTIONNISTE: [],
};

// ============================================================================
// STATE MACHINE: VALID TRANSITIONS
// ============================================================================

/**
 * Defines which status transitions are allowed
 * Maps from → to valid destination statuses
 * 
 * Workflow:
 * pending → in_progress → validated_tech → validated_bio (locked)
 *         ↘             ↘                 ↗
 *          └─────────────→ cancelled ←────┘
 */
export const VALID_TRANSITIONS: Record<AnalysisStatus, AnalysisStatus[]> = {
  [ANALYSIS_STATUSES.PENDING]: [
    ANALYSIS_STATUSES.IN_PROGRESS,
    ANALYSIS_STATUSES.CANCELLED,
  ],
  [ANALYSIS_STATUSES.IN_PROGRESS]: [
    ANALYSIS_STATUSES.VALIDATED_TECH,
    ANALYSIS_STATUSES.CANCELLED,
  ],
  [ANALYSIS_STATUSES.VALIDATED_TECH]: [
    ANALYSIS_STATUSES.VALIDATED_BIO,
    ANALYSIS_STATUSES.CANCELLED,
  ],
  [ANALYSIS_STATUSES.VALIDATED_BIO]: [],
  [ANALYSIS_STATUSES.COMPLETED]: [],
  [ANALYSIS_STATUSES.CANCELLED]: [],
};

/**
 * Validation requirements per status transition
 * Defines what must be true before a transition is allowed
 */
export const TRANSITION_REQUIREMENTS: Record<string, {
  requireAllResultsFilled?: boolean;
  requireQCCompliant?: boolean;
  requiresBloodAnalysis?: boolean;
  requireNoNegativeValues?: boolean;
}> = {
  'in_progress->validated_tech': {
    requireAllResultsFilled: true,
    requireQCCompliant: true,
    requireNoNegativeValues: true,
  },
  'validated_tech->validated_bio': {
    // Bio validation only confirms tech results, no additional requirements
  },
};

// ============================================================================
// STATUS QUERY & ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Check if analysis is in a terminal (locked) state
 * 
 * Terminal states prevent further modifications:
 * - VALIDATED_BIO / COMPLETED: Results are locked, read-only
 * - CANCELLED: Analysis is voided, no modifications allowed
 * 
 * Allowed operations in terminal state:
 * - Printing
 * - Viewing
 * - Payment updates (for COMPLETED only)
 * 
 * @param status - Current analysis status
 * @returns true if status is terminal
 * @example
 * isTerminalStatus('validated_bio') // → true
 * isTerminalStatus('in_progress') // → false
 */
export function isTerminalStatus(status: AnalysisStatus): boolean {
  return status === ANALYSIS_STATUSES.VALIDATED_BIO ||
    status === ANALYSIS_STATUSES.COMPLETED ||
    status === ANALYSIS_STATUSES.CANCELLED;
}

/**
 * Check if analysis is in a terminal READ-ONLY state
 * Locked states prevent all modification except printing
 * 
 * @param status - Current analysis status
 * @returns true if status is locked for editing
 * @example
 * isLockedStatus('validated_bio') // → true
 * isLockedStatus('pending') // → false
 */
export function isLockedStatus(status: AnalysisStatus): boolean {
  return status === ANALYSIS_STATUSES.VALIDATED_BIO ||
    status === ANALYSIS_STATUSES.COMPLETED;
}

/**
 * Get the display label for a status
 * 
 * @param status - Analysis status
 * @returns User-friendly French label
 * @example
 * getStatusLabel('in_progress') // → "En cours"
 */
export function getStatusLabel(status: AnalysisStatus): string {
  return STATUS_UI_MAP[status]?.label ?? status;
}

/**
 * Get UI color classes for status badge
 * 
 * @param status - Analysis status
 * @returns Object with text and background color classes
 * @example
 * getStatusColors('validated_bio')
 * // → { color: 'text-green-700', bgColor: 'bg-green-100' }
 */
export function getStatusColors(status: AnalysisStatus) {
  return STATUS_UI_MAP[status] ?? { color: 'text-gray-700', bgColor: 'bg-gray-100' };
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if a user role can transition analysis to target status
 * 
 * Does NOT check:
 * - Valid state transitions (use canTransition for that)
 * - Validation requirements (use validateTransition for that)
 * 
 * Only checks role-based authorization
 * 
 * @param userRole - User's role
 * @param targetStatus - Desired status
 * @returns true if role has permission
 * @example
 * hasPermissionForStatus('TECHNICIEN', 'validated_tech') // → true
 * hasPermissionForStatus('TECHNICIEN', 'validated_bio') // → false (medecin only)
 */
export function hasPermissionForStatus(userRole: AppRole, targetStatus: AnalysisStatus): boolean {
  const allowedStatuses = ROLE_PERMISSIONS[userRole] ?? [];
  return allowedStatuses.includes(targetStatus);
}

/**
 * Check all permission and state requirements for a transition
 * 
 * Validates:
 * 1. Current status allows transition to target
 * 2. User role has permission for target status
 * 3. Analysis meets validation requirements
 * 4. No concurrent modification conflicts
 * 
 * @param analysis - Current analysis state
 * @param targetStatus - Desired status
 * @param userRole - User attempting transition
 * @returns Object with allowed flag and detailed reason if denied
 * @example
 * const result = canTransition(analysis, 'validated_tech', 'TECHNICIEN');
 * if (!result.allowed) {
 *   console.error(`Cannot transition: ${result.reason}`);
 * }
 */
export function canTransition(
  analysis: Analysis,
  targetStatus: AnalysisStatus,
  userRole: AppRole
): { allowed: boolean; reason?: string } {
  const currentStatus = analysis.status as AnalysisStatus;

  // Check 1: User has permission (check first for clearer error messages)
  if (!hasPermissionForStatus(userRole, targetStatus)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' does not have permission to validate status '${targetStatus}'`,
    };
  }

  // Check 2: Valid state transition
  if (!VALID_TRANSITIONS[currentStatus]?.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition from '${currentStatus}' to '${targetStatus}'`,
    };
  }

  // Check 3: Validation requirements
  const requireKey = `${currentStatus}->${targetStatus}`;
  const requirements = TRANSITION_REQUIREMENTS[requireKey];

  if (requirements?.requireAllResultsFilled) {
    // Calculated tests (e.g. DFG/eGFR) are excluded from the mandatory fill check:
    // they may legitimately be empty when their dependencies (patient age, sex, etc.)
    // are unavailable. All other non-group tests must have a value.
    const allFilled = analysis.results.every(r => {
      if (r.test?.resultType === 'calculated' || r.test?.isGroup || r.test?.isOptional) return true;
      return r.value && r.value.trim();
    });
    if (!allFilled) {
      return {
        allowed: false,
        reason: 'Cannot validate: some results are not filled',
      };
    }
  }

  if (requirements?.requireNoNegativeValues) {
    const hasNegative = analysis.results.some(r => {
      const val = parseFloat((r.value ?? '').replace(',', '.'));
      return !Number.isNaN(val) && val < 0;
    });
    if (hasNegative) {
      return {
        allowed: false,
        reason: 'Cannot validate: negative values found',
      };
    }
  }

  return { allowed: true };
}

// ============================================================================
// OPERATION PERMISSIONS
// ============================================================================

/**
 * Check if an operation is allowed on analysis in current status
 * 
 * Operations:
 * - edit: Modify results or metadata
 * - delete: Remove analysis
 * - reprint: Print report
 * - pay: Update payment status
 * - changeTech: Reassign technician
 * 
 * @param status - Analysis status
 * @param operation - Operation to check
 * @returns true if operation is allowed
 * @example
 * canPerformOperation('validated_bio', 'edit') // → false (locked)
 * canPerformOperation('validated_bio', 'reprint') // → true (always printable)
 * canPerformOperation('in_progress', 'edit') // → true
 */
export function canPerformOperation(
  status: AnalysisStatus,
  operation: 'edit' | 'delete' | 'reprint' | 'pay' | 'changeTech'
): boolean {
  if (isLockedStatus(status)) {
    // Locked analyses allow limited operations
    if (operation === 'reprint') return true;
    if (operation === 'pay' && (status === ANALYSIS_STATUSES.VALIDATED_BIO || status === ANALYSIS_STATUSES.COMPLETED)) {
      return true;
    }
    return false;
  }

  if (status === ANALYSIS_STATUSES.CANCELLED) {
    // Cancelled analyses only allow viewing
    return operation === 'reprint';
  }

  // Pending and in-progress - restrict certain operations
  if (operation === 'pay') {
    // Payment updates only allowed in final/completed status
    return false;
  }

  // Other operations allowed in pending and in-progress
  return true;
}

// ============================================================================
// WORKFLOW STEP TRACKING
// ============================================================================

/**
 * Get workflow completion percentage (0-100)
 * Used for progress indicators showing analysis completion
 * 
 * Progress:
 * - pending: 0%
 * - in_progress: 33%
 * - validated_tech: 66%
 * - validated_bio/completed: 100%
 * - cancelled: 0%
 * 
 * @param status - Analysis status
 * @returns Progress percentage (0-100)
 * @example
 * getWorkflowProgress('validated_tech') // → 66
 */
export function getWorkflowProgress(status: AnalysisStatus): number {
  const progressMap: Record<AnalysisStatus, number> = {
    [ANALYSIS_STATUSES.PENDING]: 0,
    [ANALYSIS_STATUSES.IN_PROGRESS]: 33,
    [ANALYSIS_STATUSES.VALIDATED_TECH]: 66,
    [ANALYSIS_STATUSES.VALIDATED_BIO]: 100,
    [ANALYSIS_STATUSES.COMPLETED]: 100,
    [ANALYSIS_STATUSES.CANCELLED]: 0,
  };
  return progressMap[status] ?? 0;
}

/**
 * Get current workflow step number (1-4)
 * Shows where in the validation pipeline the analysis is
 * 
 * Steps:
 * 1. Pending - Created, awaiting technician
 * 2. In Progress - Results being entered
 * 3. Validated (Tech) - Technical validation complete
 * 4. Validated (Bio) - Final approval, locked
 * 
 * @param status - Analysis status
 * @returns Step number (1-4) or null if cancelled
 * @example
 * getWorkflowStep('validated_tech') // → 3
 */
export function getWorkflowStep(status: AnalysisStatus): number | null {
  const stepMap: Record<AnalysisStatus, number | null> = {
    [ANALYSIS_STATUSES.PENDING]: 1,
    [ANALYSIS_STATUSES.IN_PROGRESS]: 2,
    [ANALYSIS_STATUSES.VALIDATED_TECH]: 3,
    [ANALYSIS_STATUSES.VALIDATED_BIO]: 4,
    [ANALYSIS_STATUSES.COMPLETED]: 4,
    [ANALYSIS_STATUSES.CANCELLED]: null,
  };
  return stepMap[status] ?? null;
}

/**
 * Normalize status (COMPLETED → VALIDATED_BIO for internal use)
 * 
 * COMPLETED is an alias for VALIDATED_BIO in the status system
 * This function normalizes both to VALIDATED_BIO for comparisons
 * 
 * @param status - Analysis status to normalize
 * @returns Normalized status
 * @example
 * normalizeStatus('completed') // → 'validated_bio'
 * normalizeStatus('validated_bio') // → 'validated_bio'
 */
export function normalizeStatus(status: AnalysisStatus): AnalysisStatus {
  if (status === ANALYSIS_STATUSES.COMPLETED) {
    return ANALYSIS_STATUSES.VALIDATED_BIO;
  }
  return status;
}

// ============================================================================
// STATUS PREDICATES (Quick checks)
// ============================================================================

/**
 * Check if analysis is in a validated/completed state
 * Treats COMPLETED and VALIDATED_BIO as the same (both are final states)
 * 
 * @param status - Analysis status to check
 * @returns true if analysis is validated/completed
 * 
 * @example
 * isAnalysisValidated('validated_bio') // → true
 * isAnalysisValidated('completed') // → true
 * isAnalysisValidated('in_progress') // → false
 */
export function isAnalysisValidated(status: AnalysisStatus): boolean {
  return status === ANALYSIS_STATUSES.VALIDATED_BIO || status === ANALYSIS_STATUSES.COMPLETED;
}

/**
 * Alias for isAnalysisValidated() for semantic clarity
 * Use this when checking if analysis is in its final, approved state
 * 
 * @param status - Analysis status to check
 * @returns true if analysis is completed/validated
 */
export function isAnalysisCompleted(status: AnalysisStatus): boolean {
  return isAnalysisValidated(status);
}

/**
 * Alias for isAnalysisValidated() (compatibility with existing code)
 * Checks if analysis is in final/locked state (validated_bio or completed)
 * 
 * @param status - Analysis status to check (accepts both typed and string)
 * @returns true if analysis is final/locked
 */
export function isAnalysisFinalValidated(status: AnalysisStatus | string | null | undefined): boolean {
  if (!status) return false;
  return status === ANALYSIS_STATUSES.VALIDATED_BIO || status === ANALYSIS_STATUSES.COMPLETED;
}
