import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTatMinutes,
  formatTatLabel,
  getTatTextClass,
  normalizeTatThresholds,
  DEFAULT_TAT_THRESHOLDS,
} from '@/lib/tat';

describe('TAT (Turnaround Time) Utilities', () => {
  let now: Date;

  beforeEach(() => {
    now = new Date('2026-04-19T12:00:00Z');
  });

  describe('getTatMinutes', () => {
    it('should calculate TAT from createdAt to now if no validation', () => {
      const analysis = {
        createdAt: new Date('2026-04-19T11:00:00Z'),
      };
      const minutes = getTatMinutes(analysis, now);
      expect(minutes).toBe(60);
    });

    it('should calculate TAT from createdAt to validatedTechAt', () => {
      const analysis = {
        createdAt: new Date('2026-04-19T11:00:00Z'),
        validatedTechAt: new Date('2026-04-19T11:30:00Z'),
      };
      const minutes = getTatMinutes(analysis, now);
      expect(minutes).toBe(30);
    });

    it('should prioritize validatedBioAt over validatedTechAt', () => {
      const analysis = {
        createdAt: new Date('2026-04-19T11:00:00Z'),
        validatedTechAt: new Date('2026-04-19T11:30:00Z'),
        validatedBioAt: new Date('2026-04-19T11:45:00Z'),
      };
      const minutes = getTatMinutes(analysis, now);
      expect(minutes).toBe(45);
    });

    it('should handle string dates', () => {
      const analysis = {
        createdAt: '2026-04-19T11:00:00Z',
        validatedTechAt: '2026-04-19T11:25:00Z',
      };
      const minutes = getTatMinutes(analysis, now);
      expect(minutes).toBe(25);
    });

    it('should return null if no start date', () => {
      const analysis = { validatedTechAt: new Date() };
      const minutes = getTatMinutes(analysis, now);
      expect(minutes).toBeNull();
    });

    it('should return 0 if end is before start (edge case)', () => {
      const analysis = {
        createdAt: new Date('2026-04-19T12:00:00Z'),
        validatedTechAt: new Date('2026-04-19T11:00:00Z'),
      };
      const minutes = getTatMinutes(analysis, now);
      expect(minutes).toBe(0);
    });

    it('should handle invalid date strings', () => {
      const analysis = {
        createdAt: 'invalid-date',
      };
      const minutes = getTatMinutes(analysis, now);
      expect(minutes).toBeNull();
    });
  });

  describe('formatTatLabel', () => {
    it('should format minutes less than 60', () => {
      expect(formatTatLabel(45)).toBe('45 min');
      expect(formatTatLabel(0)).toBe('0 min');
    });

    it('should format hours and minutes', () => {
      expect(formatTatLabel(65)).toBe('1 h 5 min');
      expect(formatTatLabel(125)).toBe('2 h 5 min');
      expect(formatTatLabel(60)).toBe('1 h 0 min');
    });

    it('should handle null', () => {
      expect(formatTatLabel(null)).toBe('—');
    });

    it('should handle large times', () => {
      expect(formatTatLabel(1440)).toBe('24 h 0 min'); // 24 hours
    });
  });

  describe('getTatTextClass', () => {
    it('should return soft text for null TAT', () => {
      const cssClass = getTatTextClass(null);
      expect(cssClass).toContain('text-[var(--color-text-soft)]');
    });

    it('should return normal class for TAT below threshold', () => {
      const cssClass = getTatTextClass(30);
      expect(cssClass).toContain('text-[var(--color-text-soft)]');
    });

    it('should return warning class for TAT at warn threshold', () => {
      const cssClass = getTatTextClass(45);
      expect(cssClass).toContain('text-[var(--color-warning)]');
      expect(cssClass).toContain('font-semibold');
    });

    it('should return critical class for TAT at alert threshold', () => {
      const cssClass = getTatTextClass(60);
      expect(cssClass).toContain('text-[var(--color-critical)]');
      expect(cssClass).toContain('font-semibold');
    });

    it('should respect custom thresholds', () => {
      const customThresholds = { warnMinutes: 30, alertMinutes: 45 };
      const warnClass = getTatTextClass(35, customThresholds);
      expect(warnClass).toContain('text-[var(--color-warning)]');

      const criticalClass = getTatTextClass(50, customThresholds);
      expect(criticalClass).toContain('text-[var(--color-critical)]');
    });
  });

  describe('normalizeTatThresholds', () => {
    it('should use defaults when given undefined', () => {
      const result = normalizeTatThresholds(undefined, undefined);
      expect(result).toEqual(DEFAULT_TAT_THRESHOLDS);
    });

    it('should use provided values when valid', () => {
      const result = normalizeTatThresholds(30, 50);
      expect(result.warnMinutes).toBe(30);
      expect(result.alertMinutes).toBe(50);
    });

    it('should handle string inputs', () => {
      const result = normalizeTatThresholds('40', '60');
      expect(result.warnMinutes).toBe(40);
      expect(result.alertMinutes).toBe(60);
    });

    it('should enforce alert > warn', () => {
      const result = normalizeTatThresholds(50, 30); // alert < warn
      expect(result.alertMinutes).toBeGreaterThan(result.warnMinutes);
    });

    it('should reject negative values', () => {
      const result = normalizeTatThresholds(-10, -20);
      expect(result).toEqual(DEFAULT_TAT_THRESHOLDS);
    });

    it('should reject non-numeric strings', () => {
      const result = normalizeTatThresholds('abc', 'xyz');
      expect(result).toEqual(DEFAULT_TAT_THRESHOLDS);
    });

    it('should handle zero as invalid', () => {
      const result = normalizeTatThresholds(0, 0);
      expect(result).toEqual(DEFAULT_TAT_THRESHOLDS);
    });
  });
});
