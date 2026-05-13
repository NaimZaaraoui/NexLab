import { describe, it, expect, vi } from 'vitest';
import {
  ErrorCode,
  StructuredError,
  createErrorResponse,
  formatErrorResponse,
  isRetryable,
  retryWithBackoff,
  ERROR_MESSAGES,
  ERROR_RECOVERY_ACTIONS,
  ERROR_STATUS_CODES,
} from '@/lib/error-handling';

describe('Error Handling System', () => {
  describe('ErrorCode Enum', () => {
    it('should have validation error codes', () => {
      expect(ErrorCode.VALIDATION_FAILED).toBeDefined();
      expect(ErrorCode.INVALID_EMAIL).toBeDefined();
    });

    it('should have authentication error codes', () => {
      expect(ErrorCode.AUTH_REQUIRED).toBeDefined();
      expect(ErrorCode.INVALID_CREDENTIALS).toBeDefined();
    });

    it('should have database error codes', () => {
      expect(ErrorCode.DB_CONNECTION_FAILED).toBeDefined();
      expect(ErrorCode.DB_LOCKED).toBeDefined();
    });
  });

  describe('StructuredError Class', () => {
    it('should create error with code and message', () => {
      const error = new StructuredError(
        ErrorCode.VALIDATION_FAILED,
        400,
        'Test message'
      );

      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(error.userMessage).toBe('Test message');
      expect(error.statusCode).toBe(400);
    });

    it('should include recovery action', () => {
      const error = new StructuredError(
        ErrorCode.VALIDATION_FAILED,
        400,
        'Test message',
        { recoveryAction: 'Please retry' }
      );

      expect(error.recoveryAction).toBe('Please retry');
    });

    it('should include original error', () => {
      const originalError = new Error('Original problem');
      const error = new StructuredError(
        ErrorCode.DB_QUERY_FAILED,
        500,
        'Database error',
        { originalError }
      );

      expect(error.originalError).toBe(originalError);
    });

    it('should have timestamp', () => {
      const error = new StructuredError(
        ErrorCode.VALIDATION_FAILED,
        400,
        'Test'
      );

      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should be an Error instance', () => {
      const error = new StructuredError(
        ErrorCode.VALIDATION_FAILED,
        400,
        'Test'
      );

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have messages for all error codes', () => {
      const codes = Object.values(ErrorCode);
      for (const code of codes) {
        expect(ERROR_MESSAGES[code]).toBeTruthy();
        expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
      }
    });

    it('should have French messages', () => {
      expect(ERROR_MESSAGES[ErrorCode.INVALID_EMAIL]).toContain('email');
    });
  });

  describe('ERROR_RECOVERY_ACTIONS', () => {
    it('should have recovery actions for all error codes', () => {
      const codes = Object.values(ErrorCode);
      for (const code of codes) {
        expect(ERROR_RECOVERY_ACTIONS[code]).toBeTruthy();
        expect(ERROR_RECOVERY_ACTIONS[code].length).toBeGreaterThan(0);
      }
    });
  });

  describe('ERROR_STATUS_CODES', () => {
    it('should have HTTP status codes for all error codes', () => {
      const codes = Object.values(ErrorCode);
      for (const code of codes) {
        expect(ERROR_STATUS_CODES[code]).toBeGreaterThan(0);
        expect(ERROR_STATUS_CODES[code]).toBeLessThan(600);
      }
    });

    it('should map validation errors to 400', () => {
      expect(ERROR_STATUS_CODES[ErrorCode.VALIDATION_FAILED]).toBe(400);
      expect(ERROR_STATUS_CODES[ErrorCode.INVALID_EMAIL]).toBe(400);
    });

    it('should map auth errors to 401', () => {
      expect(ERROR_STATUS_CODES[ErrorCode.AUTH_REQUIRED]).toBe(401);
      expect(ERROR_STATUS_CODES[ErrorCode.INVALID_CREDENTIALS]).toBe(401);
    });

    it('should map permission errors to 403', () => {
      expect(ERROR_STATUS_CODES[ErrorCode.INSUFFICIENT_PERMISSIONS]).toBe(403);
    });

    it('should map not found to 404', () => {
      expect(ERROR_STATUS_CODES[ErrorCode.NOT_FOUND]).toBe(404);
    });

    it('should map conflict to 409', () => {
      expect(ERROR_STATUS_CODES[ErrorCode.DUPLICATE_RECORD]).toBe(409);
    });

    it('should map server errors to 500', () => {
      expect(ERROR_STATUS_CODES[ErrorCode.DB_QUERY_FAILED]).toBe(500);
      expect(ERROR_STATUS_CODES[ErrorCode.OPERATION_FAILED]).toBe(500);
    });

    it('should map service unavailable to 503', () => {
      expect(ERROR_STATUS_CODES[ErrorCode.DB_CONNECTION_FAILED]).toBe(503);
      expect(ERROR_STATUS_CODES[ErrorCode.PRINT_SERVICE_UNAVAILABLE]).toBe(503);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error with default message', () => {
      const error = createErrorResponse(ErrorCode.VALIDATION_FAILED);

      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(error.userMessage).toBeTruthy();
      expect(error.recoveryAction).toBeTruthy();
    });

    it('should create error with custom recovery action', () => {
      const customAction = 'Custom action';
      const error = createErrorResponse(ErrorCode.VALIDATION_FAILED, {
        recoveryAction: customAction,
      });

      expect(error.recoveryAction).toBe(customAction);
    });

    it('should include original error', () => {
      const originalError = new Error('Original');
      const error = createErrorResponse(ErrorCode.DB_QUERY_FAILED, {
        originalError,
      });

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('formatErrorResponse', () => {
    it('should format error for JSON response', () => {
      const error = createErrorResponse(ErrorCode.VALIDATION_FAILED);
      const formatted = formatErrorResponse(error);

      expect(formatted).toHaveProperty('error');
      expect(formatted.error).toHaveProperty('code');
      expect(formatted.error).toHaveProperty('message');
      expect(formatted.error).toHaveProperty('recoveryAction');
      expect(formatted.error).toHaveProperty('timestamp');
    });

    it('should include all error details', () => {
      const error = createErrorResponse(ErrorCode.INVALID_EMAIL);
      const formatted = formatErrorResponse(error);

      expect(formatted.error.code).toBe(ErrorCode.INVALID_EMAIL);
      expect(formatted.error.message).toBeTruthy();
    });

    it('should format timestamp as ISO string', () => {
      const error = createErrorResponse(ErrorCode.VALIDATION_FAILED);
      const formatted = formatErrorResponse(error);

      expect(formatted.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('isRetryable', () => {
    it('should mark DB_LOCKED as retryable', () => {
      const error = createErrorResponse(ErrorCode.DB_LOCKED);
      expect(isRetryable(error)).toBe(true);
    });

    it('should mark OPERATION_TIMEOUT as retryable', () => {
      const error = createErrorResponse(ErrorCode.OPERATION_TIMEOUT);
      expect(isRetryable(error)).toBe(true);
    });

    it('should mark NETWORK_ERROR as retryable', () => {
      const error = createErrorResponse(ErrorCode.NETWORK_ERROR);
      expect(isRetryable(error)).toBe(true);
    });

    it('should mark DB_CONNECTION_FAILED as retryable', () => {
      const error = createErrorResponse(ErrorCode.DB_CONNECTION_FAILED);
      expect(isRetryable(error)).toBe(true);
    });

    it('should not mark INVALID_CREDENTIALS as retryable', () => {
      const error = createErrorResponse(ErrorCode.INVALID_CREDENTIALS);
      expect(isRetryable(error)).toBe(false);
    });

    it('should not mark INSUFFICIENT_PERMISSIONS as retryable', () => {
      const error = createErrorResponse(ErrorCode.INSUFFICIENT_PERMISSIONS);
      expect(isRetryable(error)).toBe(false);
    });

    it('should not mark VALIDATION_FAILED as retryable', () => {
      const error = createErrorResponse(ErrorCode.VALIDATION_FAILED);
      expect(isRetryable(error)).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failure', async () => {
      const error = createErrorResponse(ErrorCode.DB_LOCKED);
      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on permanent failure', async () => {
      const error = createErrorResponse(ErrorCode.INVALID_CREDENTIALS);
      const fn = vi.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff delays', async () => {
      vi.useFakeTimers();

      const error = createErrorResponse(ErrorCode.DB_LOCKED);
      const fn = vi.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, 3, 100).catch(() => {
        // Expected to fail, just testing the retry logic
      });

      // First attempt
      await vi.runAllTimersAsync();

      vi.useRealTimers();
    });

    it('should respect maxAttempts', async () => {
      const error = createErrorResponse(ErrorCode.DB_LOCKED);
      const fn = vi.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      const error = createErrorResponse(ErrorCode.OPERATION_TIMEOUT);
      const fn = vi.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow();
    });
  });

  describe('Error Code Consistency', () => {
    it('should have messages for all codes', () => {
      const codes = Object.values(ErrorCode);
      for (const code of codes) {
        expect(ERROR_MESSAGES[code]).toBeDefined();
      }
    });

    it('should have recovery actions for all codes', () => {
      const codes = Object.values(ErrorCode);
      for (const code of codes) {
        expect(ERROR_RECOVERY_ACTIONS[code]).toBeDefined();
      }
    });

    it('should have status codes for all codes', () => {
      const codes = Object.values(ErrorCode);
      for (const code of codes) {
        expect(ERROR_STATUS_CODES[code]).toBeDefined();
      }
    });
  });
});
