import { describe, it, expect } from 'vitest';
import {
  normalizeTestCode,
  matchesAnyAlias,
  isHematologyTest,
  getTestSortPosition,
  sortTestsByCategory,
  hasGenderSpecificRanges,
  hasReferenceRange,
  getTestReferenceRange,
  isInBilan,
  TEST_CATEGORIES,
  CATEGORY_DISPLAY_ORDER,
  NFS_TEST_CODES,
} from '@/lib/test-classification';
import type { Test } from '@/lib/types';

describe('Test Classification Module', () => {
  describe('normalizeTestCode', () => {
    it('should normalize VGM aliases to VGM', () => {
      expect(normalizeTestCode('VGM')).toBe('VGM');
      expect(normalizeTestCode('MCV')).toBe('VGM');
      expect(normalizeTestCode('mcv')).toBe('VGM');
    });

    it('should normalize RBC aliases to RBC', () => {
      expect(normalizeTestCode('RBC')).toBe('RBC');
      expect(normalizeTestCode('GR')).toBe('RBC');
      expect(normalizeTestCode('gr')).toBe('RBC');
    });

    it('should normalize HGB aliases to HGB', () => {
      expect(normalizeTestCode('HGB')).toBe('HGB');
      expect(normalizeTestCode('HB')).toBe('HGB');
      expect(normalizeTestCode('hb')).toBe('HGB');
    });

    it('should return input if no alias found', () => {
      expect(normalizeTestCode('UNKNOWN')).toBe('UNKNOWN');
      expect(normalizeTestCode('GLY')).toBe('GLY');
    });
  });

  describe('matchesAnyAlias', () => {
    it('should match exact codes', () => {
      expect(matchesAnyAlias('VGM', ['VGM', 'MCV'])).toBe(true);
      expect(matchesAnyAlias('MCV', ['VGM', 'MCV'])).toBe(true);
    });

    it('should match case-insensitively', () => {
      expect(matchesAnyAlias('vgm', ['VGM', 'MCV'])).toBe(true);
      expect(matchesAnyAlias('mcv', ['VGM', 'MCV'])).toBe(true);
      expect(matchesAnyAlias('GR', ['GR', 'RBC'])).toBe(true);
    });

    it('should not match unrelated codes', () => {
      expect(matchesAnyAlias('HGB', ['VGM', 'MCV'])).toBe(false);
      expect(matchesAnyAlias('GLY', ['GR', 'RBC'])).toBe(false);
    });
  });

  describe('isHematologyTest', () => {
    it('should identify hematology tests', () => {
      expect(isHematologyTest('VGM')).toBe(true);
      expect(isHematologyTest('MCV')).toBe(true); // Alias
      expect(isHematologyTest('GB')).toBe(true);
      expect(isHematologyTest('WBC')).toBe(true); // Alias
      expect(isHematologyTest('PLT')).toBe(true);
    });

    it('should not identify non-hematology tests', () => {
      expect(isHematologyTest('GLY')).toBe(false);
      expect(isHematologyTest('UREE')).toBe(false);
      expect(isHematologyTest('UNKNOWN')).toBe(false);
    });
  });

  describe('getTestSortPosition', () => {
    it('should return position for NFS tests', () => {
      expect(getTestSortPosition('GB')).toBe(0);
      expect(getTestSortPosition('RBC')).toBe(21);
      expect(getTestSortPosition('VGM')).toBeGreaterThan(0);
    });

    it('should return Infinity for non-NFS tests', () => {
      expect(getTestSortPosition('GLY')).toBe(Infinity);
      expect(getTestSortPosition('UNKNOWN')).toBe(Infinity);
    });

    it('should be case-insensitive', () => {
      expect(getTestSortPosition('gb')).toBe(0);
      expect(getTestSortPosition('RbC')).toBe(21);
    });
  });

  describe('hasGenderSpecificRanges', () => {
    const unisexTest: Test = {
      id: '1',
      code: 'PLT',
      name: 'Platelets',
      minValue: 150,
      maxValue: 450,
      minValueM: null,
      maxValueM: null,
      minValueF: null,
      maxValueF: null,
      unit: '10^3/µL',
      decimals: 0,
      resultType: 'numeric',
      categoryId: '1',
      rank: 1,
      isGroup: false,
      price: 10,
      options: null,
      sampleType: 'Sang',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
    };

    const genderTest: Test = {
      ...unisexTest,
      code: 'CREA',
      minValueM: 7,
      maxValueM: 13,
      minValueF: 6,
      maxValueF: 11,
    };

    it('should detect gender-specific ranges', () => {
      expect(hasGenderSpecificRanges(genderTest)).toBe(true);
    });

    it('should not detect gender-specific for unisex tests', () => {
      expect(hasGenderSpecificRanges(unisexTest)).toBe(false);
    });
  });

  describe('hasReferenceRange', () => {
    const testWithRange: Test = {
      id: '1',
      code: 'TEST',
      name: 'Test',
      minValue: 0,
      maxValue: 100,
      minValueM: null,
      maxValueM: null,
      minValueF: null,
      maxValueF: null,
      unit: 'units',
      decimals: 1,
      resultType: 'numeric',
      categoryId: '1',
      rank: 1,
      isGroup: false,
      price: 10,
      options: null,
      sampleType: 'Sang',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
    };

    const testNoRange: Test = {
      ...testWithRange,
      minValue: null,
      maxValue: null,
    };

    it('should detect tests with reference ranges', () => {
      expect(hasReferenceRange(testWithRange)).toBe(true);
    });

    it('should not detect tests without ranges', () => {
      expect(hasReferenceRange(testNoRange)).toBe(false);
    });
  });

  describe('getTestReferenceRange', () => {
    const genderTest: Test = {
      id: '1',
      code: 'CREA',
      name: 'Creatinine',
      minValue: 6,
      maxValue: 13,
      minValueM: 7,
      maxValueM: 13,
      minValueF: 6,
      maxValueF: 11,
      unit: 'mg/L',
      decimals: 1,
      resultType: 'numeric',
      categoryId: '1',
      rank: 1,
      isGroup: false,
      price: 10,
      options: null,
      sampleType: 'Sang',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
    };

    it('should return male-specific range', () => {
      const range = getTestReferenceRange(genderTest, 'M');
      expect(range).toEqual({ min: 7, max: 13 });
    });

    it('should return female-specific range', () => {
      const range = getTestReferenceRange(genderTest, 'F');
      expect(range).toEqual({ min: 6, max: 11 });
    });

    it('should return unisex range as fallback', () => {
      const range = getTestReferenceRange(genderTest, null);
      expect(range).toEqual({ min: 6, max: 13 });
    });

    it('should return null for tests without range', () => {
      const noRangeTest: Test = { ...genderTest, minValue: null, maxValue: null, minValueM: null, maxValueM: null, minValueF: null, maxValueF: null };
      expect(getTestReferenceRange(noRangeTest, 'M')).toBe(null);
    });
  });

  describe('isInBilan', () => {
    it('should identify tests in NFS bilan', () => {
      expect(isInBilan('VGM', 'NFS')).toBe(true);
      expect(isInBilan('GB', 'NFS')).toBe(true);
      expect(isInBilan('MCV', 'NFS')).toBe(true); // Alias
    });

    it('should not identify non-NFS tests in NFS bilan', () => {
      expect(isInBilan('GLY', 'NFS')).toBe(false);
      expect(isInBilan('UREE', 'NFS')).toBe(false);
    });

    it('should identify tests in metabolic bilan', () => {
      expect(isInBilan('GLY', 'BILAN_METABOLIQUE')).toBe(true);
      expect(isInBilan('UREE', 'BILAN_METABOLIQUE')).toBe(true);
      expect(isInBilan('CREA', 'BILAN_METABOLIQUE')).toBe(true);
    });

    it('should not identify non-metabolic tests', () => {
      expect(isInBilan('VGM', 'BILAN_METABOLIQUE')).toBe(false);
      expect(isInBilan('GB', 'BILAN_METABOLIQUE')).toBe(false);
    });
  });

  describe('Test Categories', () => {
    it('should define all standard categories', () => {
      expect(TEST_CATEGORIES.HEMATOLOGIE).toBe('Hématologie');
      expect(TEST_CATEGORIES.BIOCHIMIE).toBe('Biochimie');
      expect(TEST_CATEGORIES.IMMUNOLOGIE).toBe('Immunologie');
      expect(TEST_CATEGORIES.MICROBIOLOGIE).toBe('Microbiologie');
      expect(TEST_CATEGORIES.COAGULATION).toBe('Coagulation');
      expect(TEST_CATEGORIES.UROLOGIE).toBe('Urologie');
      expect(TEST_CATEGORIES.AUTRE).toBe('Autre');
    });

    it('should have display order for all categories', () => {
      Object.values(TEST_CATEGORIES).forEach((cat) => {
        expect(CATEGORY_DISPLAY_ORDER[cat]).toBeDefined();
        expect(typeof CATEGORY_DISPLAY_ORDER[cat]).toBe('number');
      });
    });
  });

  describe('NFS Tests', () => {
    it('should list hematology tests', () => {
      expect(NFS_TEST_CODES).toContain('GB');
      expect(NFS_TEST_CODES).toContain('GR');
      expect(NFS_TEST_CODES).toContain('PLT');
      expect(NFS_TEST_CODES).toContain('VGM');
    });

    it('should not include non-hematology tests', () => {
      expect(NFS_TEST_CODES).not.toContain('GLY');
      expect(NFS_TEST_CODES).not.toContain('UREE');
    });
  });
});
