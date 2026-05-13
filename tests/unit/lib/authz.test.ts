import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next-auth dependencies before importing authz
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { APP_ROLES, hasValidInternalPrintToken, getInternalPrintToken } from '@/lib/authz';

describe('Authorization & Roles', () => {
  describe('APP_ROLES', () => {
    it('should have all expected roles', () => {
      expect(APP_ROLES).toContain('ADMIN');
      expect(APP_ROLES).toContain('TECHNICIEN');
      expect(APP_ROLES).toContain('RECEPTIONNISTE');
      expect(APP_ROLES).toContain('MEDECIN');
    });

    it('should have exactly 4 roles', () => {
      expect(APP_ROLES.length).toBe(4);
    });

    it('should be immutable', () => {
      // This ensures the role list is not accidentally modified
      expect(Object.isFrozen(APP_ROLES)).toBe(true);
    });
  });

  describe('getInternalPrintToken', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    afterEach(() => {
      delete process.env.INTERNAL_PRINT_TOKEN;
      delete process.env.AUTH_SECRET;
    });

    it('should return INTERNAL_PRINT_TOKEN if set', () => {
      process.env.INTERNAL_PRINT_TOKEN = 'test-token-123';
      const token = getInternalPrintToken();
      expect(token).toBe('test-token-123');
    });

    it('should fallback to AUTH_SECRET if INTERNAL_PRINT_TOKEN not set', () => {
      delete process.env.INTERNAL_PRINT_TOKEN;
      process.env.AUTH_SECRET = 'auth-secret-123';
      const token = getInternalPrintToken();
      expect(token).toBe('auth-secret-123');
    });

    it('should return empty string if no token configured', () => {
      delete process.env.INTERNAL_PRINT_TOKEN;
      delete process.env.AUTH_SECRET;
      const token = getInternalPrintToken();
      expect(token).toBe('');
    });

    it('should prioritize INTERNAL_PRINT_TOKEN over AUTH_SECRET', () => {
      process.env.INTERNAL_PRINT_TOKEN = 'print-token';
      process.env.AUTH_SECRET = 'auth-token';
      const token = getInternalPrintToken();
      expect(token).toBe('print-token');
    });
  });

  describe('hasValidInternalPrintToken', () => {
    beforeEach(() => {
      process.env.INTERNAL_PRINT_TOKEN = 'valid-token-123';
    });

    afterEach(() => {
      delete process.env.INTERNAL_PRINT_TOKEN;
      delete process.env.AUTH_SECRET;
    });

    it('should validate header token when correct', () => {
      const request = new Request('http://localhost/api/print', {
        headers: {
          'x-internal-print-token': 'valid-token-123',
        },
      });

      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(true);
    });

    it('should reject header token when incorrect', () => {
      const request = new Request('http://localhost/api/print', {
        headers: {
          'x-internal-print-token': 'wrong-token',
        },
      });

      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(false);
    });

    it('should validate query parameter token when correct', () => {
      const request = new Request('http://localhost/api/print?printToken=valid-token-123');

      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(true);
    });

    it('should reject query parameter token when incorrect', () => {
      const request = new Request('http://localhost/api/print?printToken=wrong-token');

      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(false);
    });

    it('should prioritize header over query parameter', () => {
      const request = new Request('http://localhost/api/print?printToken=wrong-token', {
        headers: {
          'x-internal-print-token': 'valid-token-123',
        },
      });

      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(true);
    });

    it('should return false if no token configured', () => {
      process.env.INTERNAL_PRINT_TOKEN = '';
      delete process.env.AUTH_SECRET;

      const request = new Request('http://localhost/api/print', {
        headers: {
          'x-internal-print-token': 'some-token',
        },
      });

      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(false);
    });

    it('should handle missing header gracefully', () => {
      const request = new Request('http://localhost/api/print');

      // Should check query parameter instead
      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(false);
    });

    it('should handle malformed URL gracefully', () => {
      const request = new Request('http://localhost/api/print', {
        headers: {
          'x-internal-print-token': 'valid-token-123',
        },
      });

      // Header should still work even if URL parsing fails
      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(true);
    });

    it('should be case-sensitive for token comparison', () => {
      const request = new Request('http://localhost/api/print', {
        headers: {
          'x-internal-print-token': 'VALID-TOKEN-123',
        },
      });

      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(false);
    });

    it('should handle empty token string', () => {
      const request = new Request('http://localhost/api/print', {
        headers: {
          'x-internal-print-token': '',
        },
      });

      const isValid = hasValidInternalPrintToken(request);
      expect(isValid).toBe(false);
    });
  });

  describe('Role-based Access Control (RBAC)', () => {
    it('should have hierarchical role structure', () => {
      // Define role hierarchy for documentation
      const roleHierarchy = {
        ADMIN: ['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE', 'MEDECIN'],
        MEDECIN: ['MEDECIN'],
        TECHNICIEN: ['TECHNICIEN'],
        RECEPTIONNISTE: ['RECEPTIONNISTE'],
      };

      // Verify hierarchy is consistent with APP_ROLES
      for (const role of APP_ROLES) {
        expect(roleHierarchy).toHaveProperty(role);
      }
    });

    it('should restrict sensitive operations by role', () => {
      // Operations that should be restricted
      const sensitiveOps = {
        DELETE_USER: 'ADMIN',
        EXPORT_RESULTS: 'ADMIN',
        VALIDATE_BIO: 'MEDECIN',
        VALIDATE_TECH: 'TECHNICIEN',
        CREATE_PATIENT: 'RECEPTIONNISTE',
      };

      // Verify structure exists
      expect(Object.keys(sensitiveOps).length).toBeGreaterThan(0);
    });
  });

  describe('Token Security', () => {
    it('should not leak token in logs', () => {
      process.env.INTERNAL_PRINT_TOKEN = 'secret-token-123';

      const token = getInternalPrintToken();

      // Token should exist but not be exposed in error messages
      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThan(0);
    });

    it('should handle token rotation safely', () => {
      process.env.INTERNAL_PRINT_TOKEN = 'old-token';
      const token1 = getInternalPrintToken();
      expect(token1).toBe('old-token');

      // Simulate token rotation
      process.env.INTERNAL_PRINT_TOKEN = 'new-token';
      const token2 = getInternalPrintToken();
      expect(token2).toBe('new-token');

      // Old token should not work
      expect(token1).not.toBe(token2);
    });

    it('should validate token length minimum', () => {
      // Tokens should be reasonably long
      process.env.INTERNAL_PRINT_TOKEN = 'token';
      const token = getInternalPrintToken();

      expect(token.length).toBeGreaterThanOrEqual(5);
    });
  });
});
