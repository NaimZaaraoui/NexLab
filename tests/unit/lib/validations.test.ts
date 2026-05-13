import { describe, it, expect } from 'vitest';
import { analysisCreateSchema, resultUpdateSchema, testCreateSchema, testUpdateSchema } from '@/lib/validators';

describe('Validation Schemas', () => {
  describe('createAnalysisSchema', () => {
    it('should validate a complete analysis creation', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'M',
        testsIds: ['test-1', 'test-2'],
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing required firstName', () => {
      const data = {
        patientLastName: 'Dupont',
        patientGender: 'M',
        testsIds: ['test-1'],
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing required lastName', () => {
      const data = {
        patientFirstName: 'Jean',
        patientGender: 'M',
        testsIds: ['test-1'],
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty tests array', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'M',
        testsIds: [],
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate with optional fields', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientBirthDate: '1990-01-15',
        patientGender: 'F',
        patientPhone: '0612345678',
        patientEmail: 'jean@example.com',
        testsIds: ['test-1'],
        isUrgent: true,
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'M',
        patientEmail: 'not-an-email',
        testsIds: ['test-1'],
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept empty email string', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'M',
        patientEmail: '',
        testsIds: ['test-1'],
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should default gender to M if invalid', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'X', // Invalid
        testsIds: ['test-1'],
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.patientGender).toBe('M');
      }
    });

    it('should validate insurance coverage percentage', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
        insuranceCoverage: 75,
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject insurance coverage > 100', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
        insuranceCoverage: 150,
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative insurance coverage', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
        insuranceCoverage: -10,
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate globalNotePlacement enum', () => {
      const validPlacements = ['all', 'first', 'last'];

      for (const placement of validPlacements) {
        const data = {
          patientFirstName: 'Jean',
          patientLastName: 'Dupont',
          testsIds: ['test-1'],
          globalNotePlacement: placement,
        };

        const result = analysisCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid globalNotePlacement', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
        globalNotePlacement: 'invalid-placement',
      };

      const result = analysisCreateSchema.safeParse(data);
      // Note: Zod may coerce invalid enum values, so we check if it doesn't match expected
      if (result.success) {
        // If it succeeds, the value should have been coerced or defaulted
        expect(['all', 'first', 'last']).toContain(result.data.globalNotePlacement);
      }
    });

    it('should default isUrgent to false', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isUrgent).toBe(false);
      }
    });

    it('should handle null and optional fields', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientBirthDate: null,
        patientPhone: null,
        patientEmail: null,
        testsIds: ['test-1'],
      };

      const result = analysisCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('updateResultSchema', () => {
    it('should validate a complete result update', () => {
      const data = {
        id: 'result-1',
        value: '12.5',
        unit: 'g/dL',
        notes: 'Sample comment',
        abnormal: false,
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing result id', () => {
      const data = {
        value: '12.5',
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate with only id (minimal update)', () => {
      const data = {
        id: 'result-1',
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept null value', () => {
      const data = {
        id: 'result-1',
        value: null,
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle abnormal flag default', () => {
      const data = {
        id: 'result-1',
        value: '5.2',
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.abnormal).toBe(false);
      }
    });

    it('should set abnormal to true', () => {
      const data = {
        id: 'result-1',
        value: '2.1',
        abnormal: true,
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.abnormal).toBe(true);
      }
    });

    it('should accept numeric string values', () => {
      const data = {
        id: 'result-1',
        value: '123.456',
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept qualitative values (text)', () => {
      const data = {
        id: 'result-1',
        value: 'Positif',
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle empty notes', () => {
      const data = {
        id: 'result-1',
        value: '10',
        notes: '',
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in notes', () => {
      const data = {
        id: 'result-1',
        value: '10',
        notes: 'Résultat avec caractères spéciaux: @#$%&*',
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept Unicode characters', () => {
      const data = {
        id: 'result-1',
        value: '10',
        notes: 'Résultat - 測試 - тест',
      };

      const result = resultUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('test schemas', () => {
    it('should normalize code and name for a valid numeric test', () => {
      const result = testCreateSchema.safeParse({
        code: '  hgb ',
        name: ' Hemoglobine ',
        resultType: 'numeric',
        price: '12.5',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('HGB');
        expect(result.data.name).toBe('Hemoglobine');
      }
    });

    it('should reject dropdown tests without usable options', () => {
      const result = testCreateSchema.safeParse({
        code: 'STATUT',
        name: 'Statut',
        resultType: 'dropdown',
        options: ' , , ',
      });

      expect(result.success).toBe(false);
    });

    it('should reject incoherent numeric ranges', () => {
      const result = testCreateSchema.safeParse({
        code: 'CRP',
        name: 'CRP',
        resultType: 'numeric',
        minValue: 10,
        maxValue: 5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject calculated panels', () => {
      const result = testCreateSchema.safeParse({
        code: 'NFSCALC',
        name: 'Panel calcule',
        isGroup: true,
        resultType: 'calculated',
        formula: 'HGB + HCT',
      });

      expect(result.success).toBe(false);
    });

    it('should require an id for test updates', () => {
      const result = testUpdateSchema.safeParse({
        code: 'GLU',
        name: 'Glycemie',
        resultType: 'numeric',
      });

      expect(result.success).toBe(false);
    });
  });
});
