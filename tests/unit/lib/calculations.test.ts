import { describe, it, expect } from 'vitest';
import {
  parseLocaleNumber,
  formatLocaleNumber,
  calculateMCV,
  calculateMCH,
  calculateMCHC,
  interpretRDW,
  calculateAbsoluteFromPercentage,
  calculatePercentageFromAbsolute,
  calculateHematologyIndices,
  isResultAbnormal,
  getHematologyFlags,
  getHistogramFlags,
  calculateEGFR,
  calculateEKFC,
  calculateSmartEGFR,
} from '@/lib/calculations';

describe('Calculations Module', () => {
  // =========================================================================
  // VALUE PARSING & FORMATTING TESTS
  // =========================================================================

  describe('parseLocaleNumber', () => {
    it('should parse comma-separated decimal numbers', () => {
      expect(parseLocaleNumber('123,45')).toBe(123.45);
      expect(parseLocaleNumber('0,5')).toBe(0.5);
      expect(parseLocaleNumber('1,0')).toBe(1);
    });

    it('should parse dot-separated decimal numbers', () => {
      expect(parseLocaleNumber('123.45')).toBe(123.45);
    });

    it('should parse integers', () => {
      expect(parseLocaleNumber('100')).toBe(100);
    });

    it('should handle null and empty values', () => {
      expect(parseLocaleNumber(null)).toBeNull();
      expect(parseLocaleNumber(undefined)).toBeNull();
      expect(parseLocaleNumber('')).toBeNull();
    });

    it('should return null for invalid values', () => {
      expect(parseLocaleNumber('abc')).toBeNull();
      // '12,34,56' becomes 12.34 (only first comma is replaced)
      expect(parseLocaleNumber('12,34,56')).toBe(12.34);
    });
  });

  describe('formatLocaleNumber', () => {
    it('should format numbers with comma decimal separator', () => {
      expect(formatLocaleNumber(123.45, 2)).toBe('123,45');
      expect(formatLocaleNumber(123.4, 1)).toBe('123,4');
      expect(formatLocaleNumber(123, 0)).toBe('123');
    });

    it('should use default decimal places of 1', () => {
      expect(formatLocaleNumber(123.4)).toBe('123,4');
      // 123.45 rounds to 123.5 with 1 decimal
      expect(formatLocaleNumber(123.45)).toBe('123,5');
    });

    it('should handle rounding', () => {
      expect(formatLocaleNumber(123.456, 2)).toBe('123,46');
    });
  });

  // =========================================================================
  // HEMATOLOGY INDEX CALCULATION TESTS
  // =========================================================================

  describe('calculateMCV', () => {
    it('should calculate MCV from hematocrit and RBC count', () => {
      expect(calculateMCV(42, 5.0)).toBe(84); // Normal
      expect(calculateMCV(36, 6.0)).toBe(60); // Microcytic
      expect(calculateMCV(48, 3.5)).toBeCloseTo(137.1, 1); // Macrocytic
    });

    it('should return null for invalid inputs', () => {
      expect(calculateMCV(null, 5.0)).toBeNull();
      expect(calculateMCV(42, null)).toBeNull();
      expect(calculateMCV(42, 0)).toBeNull();
    });
  });

  describe('calculateMCH', () => {
    it('should calculate MCH from hemoglobin and RBC count', () => {
      expect(calculateMCH(14, 5.0)).toBe(28); // Normal
      expect(calculateMCH(10, 5.0)).toBe(20); // Hypochromic
    });

    it('should return null for invalid inputs', () => {
      expect(calculateMCH(null, 5.0)).toBeNull();
      expect(calculateMCH(14, null)).toBeNull();
      expect(calculateMCH(14, 0)).toBeNull();
    });
  });

  describe('calculateMCHC', () => {
    it('should calculate MCHC from hemoglobin and hematocrit', () => {
      expect(calculateMCHC(14, 42)).toBeCloseTo(33.3, 1); // Normal
      expect(calculateMCHC(10, 36)).toBeCloseTo(27.8, 1); // Hypochromic
    });

    it('should return null for invalid inputs', () => {
      expect(calculateMCHC(null, 42)).toBeNull();
      expect(calculateMCHC(14, null)).toBeNull();
      expect(calculateMCHC(14, 0)).toBeNull();
    });
  });

  describe('calculateEGFR', () => {
    it('should calculate eGFR for a 50-year-old male with 1.0 mg/dL creatinine', () => {
      // CKD-EPI 2021: 
      // isFemale = false, kappa = 0.9, alpha = -0.302
      // Scr/kappa = 1.0/0.9 = 1.111 (> 1)
      // eGFR = 142 * (1)^-0.302 * (1.111)^-1.200 * (0.9938)^50 * 1.0
      // Expected: ~91.7
      const result = calculateEGFR(1.0, 50, 'M', 'mg/dL');
      expect(result).toBeCloseTo(91.7, 1);
    });

    it('should calculate eGFR for a 65-year-old female with 1.2 mg/dL creatinine', () => {
      // isFemale = true, kappa = 0.7, alpha = -0.241
      // Scr/kappa = 1.2/0.7 = 1.714 (> 1)
      // eGFR = 142 * (1)^-0.241 * (1.714)^-1.200 * (0.9938)^65 * 1.012
      // Expected: ~50.2
      const result = calculateEGFR(1.2, 65, 'F', 'mg/dL');
      expect(result).toBeCloseTo(50.2, 1);
    });

    it('should handle µmol/L unit conversion correctly', () => {
      // 88.4 µmol/L = 1.0 mg/dL
      const result = calculateEGFR(88.4, 50, 'M', 'µmol/L');
      expect(result).toBeCloseTo(91.7, 1);
    });

    it('should handle mg/L unit conversion correctly', () => {
      // 10 mg/L = 1.0 mg/dL
      const result = calculateEGFR(10, 50, 'M', 'mg/L');
      expect(result).toBeCloseTo(91.7, 1);
    });

    it('should return null for invalid inputs', () => {
      expect(calculateEGFR(null, 50, 'M')).toBeNull();
      expect(calculateEGFR(1.0, null, 'M')).toBeNull();
      expect(calculateEGFR(1.0, 50, null)).toBeNull();
      expect(calculateEGFR(0, 50, 'M')).toBeNull();
      expect(calculateEGFR(0.6, 10, 'F')).toBeNull();
      expect(calculateEGFR(1.0, 50, 'X')).toBeNull();
      expect(calculateEGFR(1.0, 50, 'f')).toBeCloseTo(68.6, 1);
    });
  });

  describe('calculateEKFC', () => {
    it('should calculate pediatric EKFC eGFR from creatinine', () => {
      const result = calculateEKFC(0.6, 10, 'F', 'mg/dL');
      expect(result).toBeCloseTo(89.3, 1);
    });

    it('should handle µmol/L unit conversion correctly', () => {
      const result = calculateEKFC(53.04, 10, 'F', 'µmol/L');
      expect(result).toBeCloseTo(89.3, 1);
    });

    it('should return null for unsupported age or invalid gender', () => {
      expect(calculateEKFC(0.3, 1, 'M')).toBeNull();
      expect(calculateEKFC(0.6, 10, 'X')).toBeNull();
    });
  });

  describe('calculateSmartEGFR', () => {
    it('should use EKFC for pediatric patients', () => {
      const result = calculateSmartEGFR(0.6, 10, 'F', 'mg/dL');
      expect(result).toEqual({
        value: 89,
        displayValue: '89',
        formula: 'EKFC_2021',
        warning: undefined,
      });
    });

    it('should use CKD-EPI 2021 for adults and display high values as > 90', () => {
      const result = calculateSmartEGFR(1.0, 50, 'M', 'mg/dL');
      expect(result?.value).toBe(92);
      expect(result?.displayValue).toBe('> 90');
      expect(result?.formula).toBe('CKD_EPI_2021');
      expect(result?.warning).toBeTruthy();
    });
  });

  describe('interpretRDW', () => {
    it('should detect anisocytosis above 15%', () => {
      expect(interpretRDW(16.5)).toBe(true);
      expect(interpretRDW(15.1)).toBe(true);
    });

    it('should return false for normal RDW', () => {
      expect(interpretRDW(13.5)).toBe(false);
      expect(interpretRDW(15.0)).toBe(false);
    });

    it('should handle null values', () => {
      expect(interpretRDW(null)).toBe(false);
    });
  });

  // =========================================================================
  // DIFFERENTIAL CALCULATIONS TESTS
  // =========================================================================

  describe('calculateAbsoluteFromPercentage', () => {
    it('should convert percentage to absolute count', () => {
      expect(calculateAbsoluteFromPercentage(60, 10.0)).toBe(6.0); // 60% of 10K
      expect(calculateAbsoluteFromPercentage(30, 8.0)).toBe(2.4); // 30% of 8K
    });

    it('should handle edge cases', () => {
      expect(calculateAbsoluteFromPercentage(0, 10.0)).toBe(0);
      expect(calculateAbsoluteFromPercentage(100, 10.0)).toBe(10.0);
    });

    it('should return null for invalid inputs', () => {
      expect(calculateAbsoluteFromPercentage(null, 10.0)).toBeNull();
      expect(calculateAbsoluteFromPercentage(60, null)).toBeNull();
      expect(calculateAbsoluteFromPercentage(60, 0)).toBeNull();
    });
  });

  describe('calculatePercentageFromAbsolute', () => {
    it('should convert absolute count to percentage', () => {
      expect(calculatePercentageFromAbsolute(6.0, 10.0)).toBe(60);
      expect(calculatePercentageFromAbsolute(2.4, 8.0)).toBe(30);
    });

    it('should return null for invalid inputs', () => {
      expect(calculatePercentageFromAbsolute(null, 10.0)).toBeNull();
      expect(calculatePercentageFromAbsolute(6.0, null)).toBeNull();
      expect(calculatePercentageFromAbsolute(6.0, 0)).toBeNull();
    });
  });

  // =========================================================================
  // BATCH HEMATOLOGY CALCULATIONS TESTS
  // =========================================================================

  describe('calculateHematologyIndices', () => {
    it('should calculate all hematology indices', () => {
      const indices = calculateHematologyIndices({
        RBC: 5.0,
        HGB: 14.0,
        HCT: 42.0,
        RDW: 13.5,
      });

      expect(indices.vgm).toBe(84);
      expect(indices.tcmh).toBe(28);
      expect(indices.ccmh).toBeCloseTo(33.3, 1);
      expect(indices.rdwAnisocytosis).toBe(false);
    });

    it('should handle alternative test codes', () => {
      const indices = calculateHematologyIndices({
        GR: 5.0, // Alternative for RBC
        HB: 14.0, // Alternative for HGB
        HT: 42.0, // Alternative for HCT
        IDW: 16.5, // Alternative for RDW
      });

      expect(indices.vgm).toBe(84);
      expect(indices.rdwAnisocytosis).toBe(true);
    });

    it('should omit null indices', () => {
      const indices = calculateHematologyIndices({
        RBC: 5.0,
        HGB: 14.0,
        // Missing HCT - can't calculate VGM/CCMH
      });

      expect(indices.tcmh).toBe(28);
      expect(indices.vgm).toBeUndefined();
      expect(indices.ccmh).toBeUndefined();
    });
  });

  // =========================================================================
  // ABNORMALITY DETECTION TESTS
  // =========================================================================

  describe('isResultAbnormal', () => {
    const normalTest = { minValue: 4.0, maxValue: 10.0 } as any;
    const noRangeTest = { minValue: null, maxValue: null } as any;
    
    const normalResult = { test: normalTest } as any;
    const noRangeResult = { test: noRangeTest } as any;

    it('should detect values exceeding max', () => {
      expect(isResultAbnormal('11,0', normalResult)).toBe(true);
      expect(isResultAbnormal('10,0', normalResult)).toBe(false);
    });

    it('should detect values below min', () => {
      expect(isResultAbnormal('3,9', normalResult)).toBe(true);
      expect(isResultAbnormal('4,0', normalResult)).toBe(false);
    });

    it('should handle locale number formatting', () => {
      expect(isResultAbnormal('11,5', normalResult)).toBe(true);
      expect(isResultAbnormal('9,5', normalResult)).toBe(false);
    });

    it('should return false when no reference range', () => {
      expect(isResultAbnormal('100', noRangeResult)).toBe(false);
    });

    it('should return false for empty values', () => {
      expect(isResultAbnormal('', normalResult)).toBe(false);
      expect(isResultAbnormal(null as any, normalResult)).toBe(false);
    });
  });

  // =========================================================================
  // CLINICAL INTERPRETATION TESTS
  // =========================================================================

  describe('getHematologyFlags', () => {
    it('should return empty array for normal results', () => {
      const analysis = {
        patientGender: 'M',
        results: [
          { test: { code: 'GB' }, id: '1' },
          { test: { code: 'HGB' }, id: '2' },
        ],
      } as any;
      const results = {
        '1': '7,0', // Normal WBC
        '2': '14,0', // Normal HGB for male
      };

      const flags = getHematologyFlags(analysis, results);
      expect(flags).toEqual([]);
    });

    it('should detect anemia in males', () => {
      const analysis = {
        patientGender: 'M',
        results: [{ test: { code: 'HGB' }, id: '1' }],
      } as any;
      const results = { '1': '11,0' }; // Below 13.0 threshold for males

      const flags = getHematologyFlags(analysis, results);
      expect(flags).toContain('ANÉMIE');
    });

    it('should detect anemia in females', () => {
      const analysis = {
        patientGender: 'F',
        results: [{ test: { code: 'HGB' }, id: '1' }],
      } as any;
      const results = { '1': '10,0' }; // Below 12.0 threshold for females

      const flags = getHematologyFlags(analysis, results);
      expect(flags).toContain('ANÉMIE');
    });
  });

  // =========================================================================
  // HISTOGRAM FLAGS TESTS
  // =========================================================================

  describe('getHistogramFlags', () => {
    it('should extract morphology flags from histogram data', () => {
      const histogramData = JSON.stringify({
        wbc: { flags: '' },
        rbc: { flags: 'Aniso' },
        plt: { flags: 'Aggr' },
      });

      const flags = getHistogramFlags(histogramData);
      expect(flags).toContain('ANISOCYTOSE');
      expect(flags).toContain("PRÉSENCE D'AGRÉGATS PLAQUETTAIRES");
    });

    it('should detect blast presence', () => {
      const histogramData = JSON.stringify({
        wbc: { flags: 'Blasts' },
        rbc: { flags: '' },
        plt: { flags: '' },
      });

      const flags = getHistogramFlags(histogramData);
      expect(flags).toContain('PRÉSENCE POSSIBLE DE BLASTES (À VÉRIFIER)');
    });

    it('should handle null/empty histogram data', () => {
      expect(getHistogramFlags(null)).toEqual([]);
      expect(getHistogramFlags(undefined)).toEqual([]);
      expect(getHistogramFlags('')).toEqual([]);
    });

    it('should handle malformed JSON gracefully', () => {
      expect(getHistogramFlags('invalid json')).toEqual([]);
    });
  });
});
