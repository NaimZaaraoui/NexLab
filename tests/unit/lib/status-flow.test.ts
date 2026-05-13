import { describe, it, expect } from 'vitest';
import {
  ANALYSIS_STATUSES,
  STATUS_UI_MAP,
  ROLE_PERMISSIONS,
  VALID_TRANSITIONS,
  isTerminalStatus,
  isLockedStatus,
  getStatusLabel,
  getStatusColors,
  hasPermissionForStatus,
  canTransition,
  canPerformOperation,
  getWorkflowProgress,
  getWorkflowStep,
  normalizeStatus,
} from '@/lib/status-flow';

describe('Status Flow Module', () => {
  // =========================================================================
  // STATUS CONSTANTS
  // =========================================================================

  describe('Status Constants', () => {
    it('should define all status values', () => {
      expect(ANALYSIS_STATUSES.PENDING).toBe('pending');
      expect(ANALYSIS_STATUSES.IN_PROGRESS).toBe('in_progress');
      expect(ANALYSIS_STATUSES.VALIDATED_TECH).toBe('validated_tech');
      expect(ANALYSIS_STATUSES.VALIDATED_BIO).toBe('validated_bio');
      expect(ANALYSIS_STATUSES.COMPLETED).toBe('completed');
      expect(ANALYSIS_STATUSES.CANCELLED).toBe('cancelled');
    });

    it('should have UI metadata for all statuses', () => {
      Object.values(ANALYSIS_STATUSES).forEach(status => {
        expect(STATUS_UI_MAP[status]).toBeDefined();
        expect(STATUS_UI_MAP[status]).toHaveProperty('label');
        expect(STATUS_UI_MAP[status]).toHaveProperty('color');
        expect(STATUS_UI_MAP[status]).toHaveProperty('bgColor');
      });
    });
  });

  // =========================================================================
  // PERMISSION MODEL
  // =========================================================================

  describe('Role Permissions', () => {
    it('should grant ADMIN all permissions', () => {
      const adminPerms = ROLE_PERMISSIONS.ADMIN;
      expect(adminPerms).toContain(ANALYSIS_STATUSES.PENDING);
      expect(adminPerms).toContain(ANALYSIS_STATUSES.IN_PROGRESS);
      expect(adminPerms).toContain(ANALYSIS_STATUSES.VALIDATED_TECH);
      expect(adminPerms).toContain(ANALYSIS_STATUSES.VALIDATED_BIO);
      expect(adminPerms).toContain(ANALYSIS_STATUSES.CANCELLED);
    });

    it('should grant TECHNICIEN only tech validation', () => {
      const techPerms = ROLE_PERMISSIONS.TECHNICIEN;
      expect(techPerms).toContain(ANALYSIS_STATUSES.IN_PROGRESS);
      expect(techPerms).toContain(ANALYSIS_STATUSES.VALIDATED_TECH);
      expect(techPerms).not.toContain(ANALYSIS_STATUSES.VALIDATED_BIO);
    });

    it('should grant MEDECIN only bio validation', () => {
      const medPerms = ROLE_PERMISSIONS.MEDECIN;
      expect(medPerms).toContain(ANALYSIS_STATUSES.VALIDATED_BIO);
      expect(medPerms).not.toContain(ANALYSIS_STATUSES.VALIDATED_TECH);
    });

    it('should grant RECEPTIONNISTE no edit permissions', () => {
      expect(ROLE_PERMISSIONS.RECEPTIONNISTE).toEqual([]);
    });
  });

  // =========================================================================
  // STATE MACHINE TRANSITIONS
  // =========================================================================

  describe('Valid Transitions', () => {
    it('should allow pending → in_progress', () => {
      expect(VALID_TRANSITIONS[ANALYSIS_STATUSES.PENDING]).toContain(ANALYSIS_STATUSES.IN_PROGRESS);
    });

    it('should allow in_progress → validated_tech', () => {
      expect(VALID_TRANSITIONS[ANALYSIS_STATUSES.IN_PROGRESS]).toContain(ANALYSIS_STATUSES.VALIDATED_TECH);
    });

    it('should allow validated_tech → validated_bio', () => {
      expect(VALID_TRANSITIONS[ANALYSIS_STATUSES.VALIDATED_TECH]).toContain(ANALYSIS_STATUSES.VALIDATED_BIO);
    });

    it('should block validated_bio transitions (terminal state)', () => {
      expect(VALID_TRANSITIONS[ANALYSIS_STATUSES.VALIDATED_BIO]).toHaveLength(0);
    });

    it('should block completed transitions (terminal state)', () => {
      expect(VALID_TRANSITIONS[ANALYSIS_STATUSES.COMPLETED]).toHaveLength(0);
    });

    it('should allow cancellation from any non-terminal state', () => {
      expect(VALID_TRANSITIONS[ANALYSIS_STATUSES.PENDING]).toContain(ANALYSIS_STATUSES.CANCELLED);
      expect(VALID_TRANSITIONS[ANALYSIS_STATUSES.IN_PROGRESS]).toContain(ANALYSIS_STATUSES.CANCELLED);
      expect(VALID_TRANSITIONS[ANALYSIS_STATUSES.VALIDATED_TECH]).toContain(ANALYSIS_STATUSES.CANCELLED);
    });
  });

  // =========================================================================
  // STATUS QUERY FUNCTIONS
  // =========================================================================

  describe('isTerminalStatus', () => {
    it('should identify validated_bio as terminal', () => {
      expect(isTerminalStatus(ANALYSIS_STATUSES.VALIDATED_BIO)).toBe(true);
    });

    it('should identify completed as terminal', () => {
      expect(isTerminalStatus(ANALYSIS_STATUSES.COMPLETED)).toBe(true);
    });

    it('should identify cancelled as terminal', () => {
      expect(isTerminalStatus(ANALYSIS_STATUSES.CANCELLED)).toBe(true);
    });

    it('should not identify in_progress as terminal', () => {
      expect(isTerminalStatus(ANALYSIS_STATUSES.IN_PROGRESS)).toBe(false);
    });
  });

  describe('isLockedStatus', () => {
    it('should identify validated_bio as locked', () => {
      expect(isLockedStatus(ANALYSIS_STATUSES.VALIDATED_BIO)).toBe(true);
    });

    it('should identify completed as locked', () => {
      expect(isLockedStatus(ANALYSIS_STATUSES.COMPLETED)).toBe(true);
    });

    it('should not identify cancelled as locked (no editing allowed either way)', () => {
      expect(isLockedStatus(ANALYSIS_STATUSES.CANCELLED)).toBe(false);
    });

    it('should not identify in_progress as locked', () => {
      expect(isLockedStatus(ANALYSIS_STATUSES.IN_PROGRESS)).toBe(false);
    });
  });

  describe('getStatusLabel', () => {
    it('should return French labels', () => {
      expect(getStatusLabel(ANALYSIS_STATUSES.PENDING)).toBe('En attente');
      expect(getStatusLabel(ANALYSIS_STATUSES.IN_PROGRESS)).toBe('En cours');
      expect(getStatusLabel(ANALYSIS_STATUSES.VALIDATED_TECH)).toBe('Validée (Tech)');
      expect(getStatusLabel(ANALYSIS_STATUSES.VALIDATED_BIO)).toBe('Validée (Bio)');
    });
  });

  describe('getStatusColors', () => {
    it('should return color classes', () => {
      const colors = getStatusColors(ANALYSIS_STATUSES.VALIDATED_BIO);
      expect(colors.color).toBe('text-green-700');
      expect(colors.bgColor).toBe('bg-green-100');
    });

    it('should handle unknown statuses', () => {
      const colors = getStatusColors('unknown' as any);
      expect(colors.color).toBe('text-gray-700');
      expect(colors.bgColor).toBe('bg-gray-100');
    });
  });

  // =========================================================================
  // PERMISSION CHECKING
  // =========================================================================

  describe('hasPermissionForStatus', () => {
    it('should allow TECHNICIEN to validate_tech', () => {
      expect(hasPermissionForStatus('TECHNICIEN', ANALYSIS_STATUSES.VALIDATED_TECH)).toBe(true);
    });

    it('should deny TECHNICIEN to validate_bio', () => {
      expect(hasPermissionForStatus('TECHNICIEN', ANALYSIS_STATUSES.VALIDATED_BIO)).toBe(false);
    });

    it('should allow MEDECIN to validate_bio', () => {
      expect(hasPermissionForStatus('MEDECIN', ANALYSIS_STATUSES.VALIDATED_BIO)).toBe(true);
    });

    it('should deny RECEPTIONNISTE all transitions', () => {
      expect(hasPermissionForStatus('RECEPTIONNISTE', ANALYSIS_STATUSES.IN_PROGRESS)).toBe(false);
      expect(hasPermissionForStatus('RECEPTIONNISTE', ANALYSIS_STATUSES.VALIDATED_TECH)).toBe(false);
    });
  });

  describe('canTransition', () => {
    const createAnalysis = (status: string, resultsFilled = true) => ({
      status,
      results: resultsFilled
        ? [
            { value: '100', test: { code: 'RBC' } },
            { value: '15', test: { code: 'HGB' } },
          ]
        : [
            { value: '', test: { code: 'RBC' } },
            { value: '15', test: { code: 'HGB' } },
          ],
    } as any);

    it('should allow valid transition with permission', () => {
      const analysis = createAnalysis(ANALYSIS_STATUSES.IN_PROGRESS);
      const result = canTransition(analysis, ANALYSIS_STATUSES.VALIDATED_TECH, 'TECHNICIEN');
      expect(result.allowed).toBe(true);
    });

    it('should deny permission violation', () => {
      const analysis = createAnalysis(ANALYSIS_STATUSES.IN_PROGRESS);
      const result = canTransition(analysis, ANALYSIS_STATUSES.VALIDATED_BIO, 'TECHNICIEN');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('permission');
    });

    it('should deny invalid state transition', () => {
      const analysis = createAnalysis(ANALYSIS_STATUSES.VALIDATED_BIO);
      const result = canTransition(analysis, ANALYSIS_STATUSES.IN_PROGRESS, 'ADMIN');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot transition');
    });

    it('should require all results filled for tech validation', () => {
      const analysis = createAnalysis(ANALYSIS_STATUSES.IN_PROGRESS, false);
      const result = canTransition(analysis, ANALYSIS_STATUSES.VALIDATED_TECH, 'TECHNICIEN');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not filled');
    });

    it('should reject negative values', () => {
      const analysis = {
        status: ANALYSIS_STATUSES.IN_PROGRESS,
        results: [
          { value: '-5', test: { code: 'RBC' } },
          { value: '15', test: { code: 'HGB' } },
        ],
      } as any;
      const result = canTransition(analysis, ANALYSIS_STATUSES.VALIDATED_TECH, 'TECHNICIEN');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('negative');
    });
  });

  // =========================================================================
  // OPERATION PERMISSIONS
  // =========================================================================

  describe('canPerformOperation', () => {
    it('should allow editing in in_progress', () => {
      expect(canPerformOperation(ANALYSIS_STATUSES.IN_PROGRESS, 'edit')).toBe(true);
    });

    it('should deny editing in locked status', () => {
      expect(canPerformOperation(ANALYSIS_STATUSES.VALIDATED_BIO, 'edit')).toBe(false);
    });

    it('should allow printing in any status', () => {
      expect(canPerformOperation(ANALYSIS_STATUSES.IN_PROGRESS, 'reprint')).toBe(true);
      expect(canPerformOperation(ANALYSIS_STATUSES.VALIDATED_BIO, 'reprint')).toBe(true);
      expect(canPerformOperation(ANALYSIS_STATUSES.CANCELLED, 'reprint')).toBe(true);
    });

    it('should deny payment update in in_progress', () => {
      expect(canPerformOperation(ANALYSIS_STATUSES.IN_PROGRESS, 'pay')).toBe(false);
    });

    it('should allow payment update in completed', () => {
      expect(canPerformOperation(ANALYSIS_STATUSES.COMPLETED, 'pay')).toBe(true);
    });

    it('should deny all operations in cancelled', () => {
      expect(canPerformOperation(ANALYSIS_STATUSES.CANCELLED, 'edit')).toBe(false);
      expect(canPerformOperation(ANALYSIS_STATUSES.CANCELLED, 'delete')).toBe(false);
      expect(canPerformOperation(ANALYSIS_STATUSES.CANCELLED, 'changeTech')).toBe(false);
    });
  });

  // =========================================================================
  // WORKFLOW TRACKING
  // =========================================================================

  describe('getWorkflowProgress', () => {
    it('should return progress percentage', () => {
      expect(getWorkflowProgress(ANALYSIS_STATUSES.PENDING)).toBe(0);
      expect(getWorkflowProgress(ANALYSIS_STATUSES.IN_PROGRESS)).toBe(33);
      expect(getWorkflowProgress(ANALYSIS_STATUSES.VALIDATED_TECH)).toBe(66);
      expect(getWorkflowProgress(ANALYSIS_STATUSES.VALIDATED_BIO)).toBe(100);
      expect(getWorkflowProgress(ANALYSIS_STATUSES.COMPLETED)).toBe(100);
    });

    it('should return 0 for cancelled', () => {
      expect(getWorkflowProgress(ANALYSIS_STATUSES.CANCELLED)).toBe(0);
    });
  });

  describe('getWorkflowStep', () => {
    it('should return step numbers', () => {
      expect(getWorkflowStep(ANALYSIS_STATUSES.PENDING)).toBe(1);
      expect(getWorkflowStep(ANALYSIS_STATUSES.IN_PROGRESS)).toBe(2);
      expect(getWorkflowStep(ANALYSIS_STATUSES.VALIDATED_TECH)).toBe(3);
      expect(getWorkflowStep(ANALYSIS_STATUSES.VALIDATED_BIO)).toBe(4);
      expect(getWorkflowStep(ANALYSIS_STATUSES.COMPLETED)).toBe(4);
    });

    it('should return null for cancelled', () => {
      expect(getWorkflowStep(ANALYSIS_STATUSES.CANCELLED)).toBeNull();
    });
  });

  describe('normalizeStatus', () => {
    it('should normalize completed to validated_bio', () => {
      expect(normalizeStatus(ANALYSIS_STATUSES.COMPLETED)).toBe(ANALYSIS_STATUSES.VALIDATED_BIO);
    });

    it('should pass through other statuses unchanged', () => {
      expect(normalizeStatus(ANALYSIS_STATUSES.PENDING)).toBe(ANALYSIS_STATUSES.PENDING);
      expect(normalizeStatus(ANALYSIS_STATUSES.IN_PROGRESS)).toBe(ANALYSIS_STATUSES.IN_PROGRESS);
    });
  });
});
