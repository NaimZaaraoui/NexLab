import { describe, expect, it } from 'vitest';
import {
  applyCalculatedTestFormulas,
  evaluateFormula,
  extractFormulaDependencies,
  isCalculatedFormulaTest,
  validateFormula,
} from '@/lib/calculated-tests';
import type { Analysis } from '@/lib/types';

describe('Calculated Tests', () => {
  describe('validateFormula', () => {
    const availableTests = [
      { code: 'HGB', resultType: 'numeric', options: null, decimals: 1, isGroup: false },
      { code: 'HCT', resultType: 'numeric', options: null, decimals: 1, isGroup: false },
      { code: 'RBC', resultType: 'numeric', options: null, decimals: 1, isGroup: false },
      { code: 'CCMH', resultType: 'calculated', options: '(HGB / HCT) * 100', decimals: 1, isGroup: false },
      { code: 'COMMENT', resultType: 'text', options: null, decimals: 1, isGroup: false },
    ];

    it('accepts a valid formula with existing dependencies', () => {
      const result = validateFormula('(HGB / HCT) * 100', availableTests, 'MCHC');
      expect(result.valid).toBe(true);
      expect(result.dependencies).toEqual(['HGB', 'HCT']);
    });

    it('rejects missing dependencies', () => {
      const result = validateFormula('(HGB / UNKNOWN) * 100', availableTests, 'MCHC');
      expect(result.valid).toBe(false);
    });

    it('rejects self references', () => {
      const result = validateFormula('(HGB / CCMH) * 100', availableTests, 'CCMH');
      expect(result.valid).toBe(false);
    });

    it('rejects dependencies on calculated tests in V1', () => {
      const result = validateFormula('(CCMH / HCT) * 10', availableTests, 'VGM2');
      expect(result.valid).toBe(false);
    });

    it('rejects non-numeric dependencies', () => {
      const result = validateFormula('(COMMENT / HCT) * 10', availableTests, 'TESTX');
      expect(result.valid).toBe(false);
    });
  });

  describe('extractFormulaDependencies', () => {
    it('returns unique normalized dependencies', () => {
      expect(extractFormulaDependencies('(hgb / HCT) * hgb')).toEqual(['HGB', 'HCT']);
    });
  });

  describe('evaluateFormula', () => {
    it('evaluates arithmetic expressions with test codes', () => {
      const result = evaluateFormula('(HGB / HCT) * 100', { HGB: '14', HCT: '42' }, 1);
      expect(result.ok).toBe(true);
      expect(result.value).toBe('33,3');
    });

    it('handles missing dependencies', () => {
      const result = evaluateFormula('(HGB / HCT) * 100', { HGB: '14' }, 1);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('missing_dependency');
    });

    it('handles division by zero', () => {
      const result = evaluateFormula('(HGB / HCT) * 100', { HGB: '14', HCT: '0' }, 1);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('division_by_zero');
    });
  });

  describe('isCalculatedFormulaTest', () => {
    it('detects formula-based calculated tests', () => {
      expect(isCalculatedFormulaTest({ resultType: 'calculated', options: '(HGB / HCT) * 100', code: 'CCMH', decimals: 1, isGroup: false })).toBe(true);
      expect(isCalculatedFormulaTest({ resultType: 'numeric', options: '(HGB / HCT) * 100', code: 'CCMH', decimals: 1, isGroup: false })).toBe(false);
    });
  });

  describe('applyCalculatedTestFormulas', () => {
    it('fills calculated results from source values', () => {
      const analysis = {
        id: 'a1',
        orderNumber: '1',
        receiptNumber: null,
        dailyId: null,
        isUrgent: false,
        provenance: null,
        medecinPrescripteur: null,
        globalNote: null,
        globalNotePlacement: 'all',
        totalPrice: 0,
        amountPaid: 0,
        paymentStatus: 'UNPAID',
        patientId: null,
        patientFirstName: null,
        patientLastName: null,
        patientAge: null,
        patientGender: 'M',
        creationDate: new Date(),
        drawingDate: null,
        status: 'pending',
        printedAt: null,
        histogramData: null,
        results: [
          { id: 'r1', analysisId: 'a1', testId: 't1', value: null, unit: null, notes: null, abnormal: false, createdAt: new Date(), updatedAt: new Date(), test: { id: 't1', code: 'HGB', name: 'HGB', unit: 'g/dL', minValue: null, maxValue: null, minValueM: null, maxValueM: null, minValueF: null, maxValueF: null, decimals: 1, resultType: 'numeric', categoryId: null, rank: 0, options: null, isGroup: false, sampleType: null, price: 0, parentId: null, createdAt: new Date(), updatedAt: new Date() } },
          { id: 'r2', analysisId: 'a1', testId: 't2', value: null, unit: null, notes: null, abnormal: false, createdAt: new Date(), updatedAt: new Date(), test: { id: 't2', code: 'HCT', name: 'HCT', unit: '%', minValue: null, maxValue: null, minValueM: null, maxValueM: null, minValueF: null, maxValueF: null, decimals: 1, resultType: 'numeric', categoryId: null, rank: 0, options: null, isGroup: false, sampleType: null, price: 0, parentId: null, createdAt: new Date(), updatedAt: new Date() } },
          { id: 'r3', analysisId: 'a1', testId: 't3', value: null, unit: null, notes: null, abnormal: false, createdAt: new Date(), updatedAt: new Date(), test: { id: 't3', code: 'CCMH2', name: 'CCMH2', unit: '%', minValue: null, maxValue: null, minValueM: null, maxValueM: null, minValueF: null, maxValueF: null, decimals: 1, resultType: 'calculated', categoryId: null, rank: 0, options: '(HGB / HCT) * 100', isGroup: false, sampleType: null, price: 0, parentId: null, createdAt: new Date(), updatedAt: new Date() } },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Analysis;

      const computed = applyCalculatedTestFormulas(analysis, {
        r1: '14',
        r2: '42',
        r3: '',
      });

      expect(computed.r3).toBe('33,3');
    });
  });
});
