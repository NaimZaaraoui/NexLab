import { describe, it, expect, vi } from 'vitest';
import { getHematologyInterpretations } from '@/lib/interpretations';
import { HEMATOLOGY_THRESHOLDS } from '@/lib/lab-rules';
import { Analysis } from '@/lib/types';

describe('Hematology Interpretations', () => {
  const createMockAnalysis = (overrides: Partial<Analysis> = {}): Analysis => ({
    id: 'test-1',
    patientId: 'patient-1',
    analyzeType: 'HEMATOLOGIE',
    status: 'pending',
    createdAt: new Date(),
    validatedTechAt: null,
    validatedBioAt: null,
    results: [],
    histogramData: '{}',
    ...(overrides as any),
  });

  describe('Leucopenia Detection', () => {
    it('should flag LEUCOPÉNIE when GB < threshold', () => {
      const analysis = createMockAnalysis({
        results: [
          { id: 'gb-result', test: { code: 'GB' }, value: null },
        ] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '3.5', // Below 4.0 threshold
      });

      expect(flags).toContain('LEUCOPÉNIE');
    });

    it('should not flag when GB is at threshold', () => {
      const analysis = createMockAnalysis({
        results: [{ id: 'gb-result', test: { code: 'GB' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '4.0', // At threshold
      });

      expect(flags).not.toContain('LEUCOPÉNIE');
    });

    it('should not flag when GB is above threshold', () => {
      const analysis = createMockAnalysis({
        results: [{ id: 'gb-result', test: { code: 'GB' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '7.5', // Normal
      });

      expect(flags).not.toContain('LEUCOPÉNIE');
    });
  });

  describe('Hyperleukocytosis Detection', () => {
    it('should flag HYPERLEUCOCYTOSE when GB > threshold', () => {
      const analysis = createMockAnalysis({
        results: [{ id: 'gb-result', test: { code: 'GB' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '11.0', // Above 10.0 threshold
      });

      expect(flags).toContain('HYPERLEUCOCYTOSE');
    });
  });

  describe('Anemia Detection (Gender-Specific)', () => {
    it('should flag ANÉMIE for male when HGB < 13.0', () => {
      const analysis = createMockAnalysis({
        patientGender: 'M',
        results: [{ id: 'hgb-result', test: { code: 'HGB' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'hgb-result': '12.0',
      });

      expect(flags).toContain('ANÉMIE');
    });

    it('should not flag ANÉMIE for male when HGB >= 13.0', () => {
      const analysis = createMockAnalysis({
        patientGender: 'M',
        results: [{ id: 'hgb-result', test: { code: 'HGB' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'hgb-result': '13.5',
      });

      expect(flags).not.toContain('ANÉMIE');
    });

    it('should flag ANÉMIE for female when HGB < 12.0', () => {
      const analysis = createMockAnalysis({
        patientGender: 'F',
        results: [{ id: 'hgb-result', test: { code: 'HGB' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'hgb-result': '11.5',
      });

      expect(flags).toContain('ANÉMIE');
    });

    it('should not flag ANÉMIE for female when HGB >= 12.0', () => {
      const analysis = createMockAnalysis({
        patientGender: 'F',
        results: [{ id: 'hgb-result', test: { code: 'HGB' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'hgb-result': '12.5',
      });

      expect(flags).not.toContain('ANÉMIE');
    });
  });

  describe('Thrombocyte Disorders', () => {
    it('should flag THROMBOPÉNIE when PLT < 150', () => {
      const analysis = createMockAnalysis({
        results: [{ id: 'plt-result', test: { code: 'PLT' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'plt-result': '100',
      });

      expect(flags).toContain('THROMBOPÉNIE');
    });

    it('should flag THROMBOCYTOSE when PLT > 450', () => {
      const analysis = createMockAnalysis({
        results: [{ id: 'plt-result', test: { code: 'PLT' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'plt-result': '500',
      });

      expect(flags).toContain('THROMBOCYTOSE');
    });
  });

  describe('RDW Anisocytosis', () => {
    it('should flag ANISOCYTOSE when RDW > 16.0', () => {
      const analysis = createMockAnalysis({
        results: [{ id: 'rdw-result', test: { code: 'RDW' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'rdw-result': '18.5',
      });

      expect(flags).toContain('ANISOCYTOSE');
    });

    it('should handle IDW alias for RDW', () => {
      const analysis = createMockAnalysis({
        results: [{ id: 'idw-result', test: { code: 'IDW' }, value: null }] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'idw-result': '17.0',
      });

      expect(flags).toContain('ANISOCYTOSE');
    });
  });

  describe('MCV Morphology', () => {
    it('should flag MICROCYTOSE when VGM < 80', () => {
      const analysis = createMockAnalysis({
        results: [
          { id: 'vgm-result', test: { code: 'VGM' }, value: null },
          { id: 'hgb-result', test: { code: 'HGB' }, value: null },
        ] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'vgm-result': '75',
        'hgb-result': '14.0',
      });

      expect(flags).toContain('MICROCYTOSE');
    });

    it('should flag MACROCYTOSE when VGM > 100', () => {
      const analysis = createMockAnalysis({
        results: [
          { id: 'vgm-result', test: { code: 'VGM' }, value: null },
          { id: 'hgb-result', test: { code: 'HGB' }, value: null },
        ] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'vgm-result': '105',
        'hgb-result': '14.0',
      });

      expect(flags).toContain('MACROCYTOSE');
    });
  });

  describe('Lymphocyte Disorders', () => {
    it('should flag LYMPHOCYTOSE when absolute lymphocyte > 4.0', () => {
      const analysis = createMockAnalysis({
        results: [
          { id: 'gb-result', test: { code: 'GB' }, value: null },
          { id: 'lym-result', test: { code: 'LYM%' }, value: null },
        ] as any,
      });

      // GB=10, LYM%=50 -> LYM_ABS = 5.0 > 4.0
      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '10',
        'lym-result': '50',
      });

      expect(flags).toContain('LYMPHOCYTOSE');
    });

    it('should flag LYMPHOPÉNIE when absolute lymphocyte < 1.0', () => {
      const analysis = createMockAnalysis({
        results: [
          { id: 'gb-result', test: { code: 'GB' }, value: null },
          { id: 'lym-result', test: { code: 'LYM%' }, value: null },
        ] as any,
      });

      // GB=10, LYM%=5 -> LYM_ABS = 0.5 < 1.0
      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '10',
        'lym-result': '5',
      });

      expect(flags).toContain('LYMPHOPÉNIE');
    });
  });

  describe('Neutrophil Disorders', () => {
    it('should flag POLYNUCLÉOSE NEUTROPHILE when neutrophil > 7.5', () => {
      const analysis = createMockAnalysis({
        results: [
          { id: 'gb-result', test: { code: 'GB' }, value: null },
          { id: 'gra-result', test: { code: 'GRA%' }, value: null },
        ] as any,
      });

      // GB=10, GRA%=90 -> PNN_ABS = 9.0 > 7.5
      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '10',
        'gra-result': '90',
      });

      expect(flags).toContain('POLYNUCLÉOSE NEUTROPHILE');
    });

    it('should flag NEUTROPÉNIE when neutrophil < 1.5', () => {
      const analysis = createMockAnalysis({
        results: [
          { id: 'gb-result', test: { code: 'GB' }, value: null },
          { id: 'gra-result', test: { code: 'GRA%' }, value: null },
        ] as any,
      });

      // GB=10, GRA%=10 -> PNN_ABS = 1.0 < 1.5
      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '10',
        'gra-result': '10',
      });

      expect(flags).toContain('NEUTROPÉNIE');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing test results gracefully', () => {
      const analysis = createMockAnalysis({
        results: [],
      });

      const flags = getHematologyInterpretations(analysis, {});

      expect(flags).toEqual([]);
    });

    it('should handle comma-separated decimals', () => {
      const analysis = createMockAnalysis({
        results: [{ id: 'gb-result', test: { code: 'GB' }, value: null }] as any,
      });

      // French uses commas for decimals
      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '3,5', // Should parse as 3.5
      });

      expect(flags).toContain('LEUCOPÉNIE');
    });

    it('should remove duplicate flags', () => {
      const analysis = createMockAnalysis({
        results: [
          { id: 'rdw-result', test: { code: 'RDW' }, value: null },
        ] as any,
        histogramData: JSON.stringify({ rbc: { flags: ['Aniso'] } }),
      });

      const flags = getHematologyInterpretations(analysis, {
        'rdw-result': '17.0',
      });

      // Should only have one ANISOCYTOSE, not duplicated
      const anisocytoseCount = flags.filter(f => f === 'ANISOCYTOSE').length;
      expect(anisocytoseCount).toBe(1);
    });

    it('should handle malformed histogram JSON', () => {
      const analysis = createMockAnalysis({
        results: [],
        histogramData: 'not valid json',
      });

      // Should not throw
      const flags = getHematologyInterpretations(analysis, {});

      expect(flags).toEqual([]);
    });
  });

  describe('Multiple Flags', () => {
    it('should return multiple flags for complex case', () => {
      const analysis = createMockAnalysis({
        patientGender: 'M',
        results: [
          { id: 'gb-result', test: { code: 'GB' }, value: null },
          { id: 'hgb-result', test: { code: 'HGB' }, value: null },
          { id: 'plt-result', test: { code: 'PLT' }, value: null },
          { id: 'vgm-result', test: { code: 'VGM' }, value: null },
        ] as any,
      });

      const flags = getHematologyInterpretations(analysis, {
        'gb-result': '3.0', // LEUCOPÉNIE
        'hgb-result': '10.0', // ANÉMIE
        'plt-result': '120', // THROMBOPÉNIE
        'vgm-result': '72', // MICROCYTOSE
      });

      expect(flags).toContain('LEUCOPÉNIE');
      expect(flags).toContain('ANÉMIE');
      expect(flags).toContain('THROMBOPÉNIE');
      expect(flags).toContain('MICROCYTOSE');
      expect(flags.length).toBe(4);
    });
  });
});
