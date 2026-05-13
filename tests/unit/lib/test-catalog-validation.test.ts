import { describe, expect, it } from 'vitest';
import {
  assertCalculatedDependentsRemainValid,
  assertGroupCanBeConverted,
  assertValidParentAssignment,
  buildTestPersistenceData,
  normalizeDropdownOptions,
} from '@/lib/test-catalog-validation';

const baseTests = [
  {
    id: 'panel-a',
    code: 'PANELA',
    name: 'Panel A',
    parentId: null,
    isGroup: true,
    resultType: 'text',
    options: null,
    decimals: 1,
  },
  {
    id: 'panel-b',
    code: 'PANELB',
    name: 'Panel B',
    parentId: 'panel-a',
    isGroup: true,
    resultType: 'text',
    options: null,
    decimals: 1,
  },
  {
    id: 'test-hgb',
    code: 'HGB',
    name: 'Hemoglobine',
    parentId: 'panel-a',
    isGroup: false,
    resultType: 'numeric',
    options: null,
    decimals: 1,
  },
  {
    id: 'calc-mchc',
    code: 'MCHC',
    name: 'MCHC',
    parentId: null,
    isGroup: false,
    resultType: 'calculated',
    options: '(HGB / HCT) * 100',
    decimals: 1,
  },
  {
    id: 'test-hct',
    code: 'HCT',
    name: 'Hematocrite',
    parentId: null,
    isGroup: false,
    resultType: 'numeric',
    options: null,
    decimals: 1,
  },
] as const;

describe('test catalog validation', () => {
  it('normalizes dropdown options into a clean comma-separated string', () => {
    expect(normalizeDropdownOptions(' Positif, Negatif ; Positif \n Douteux ')).toBe('Positif, Negatif, Douteux');
  });

  it('rejects parent assignments that would create a cycle', () => {
    expect(() => assertValidParentAssignment([...baseTests], 'panel-b', 'panel-a')).toThrow(/boucle/i);
  });

  it('blocks converting a panel with children into an individual test', () => {
    expect(() => assertGroupCanBeConverted([...baseTests], 'panel-a', false)).toThrow(/enfants/i);
  });

  it('blocks changes that would break dependent calculated tests', () => {
    expect(() =>
      assertCalculatedDependentsRemainValid([...baseTests], 'test-hgb', {
        id: 'test-hgb',
        code: 'HGB',
        name: 'Hemoglobine',
        unit: null,
        minValue: null,
        maxValue: null,
        minValueM: null,
        maxValueM: null,
        minValueF: null,
        maxValueF: null,
        decimals: 1,
        resultType: 'calculated',
        formula: '(HCT / 2)',
        categoryId: null,
        parentId: 'panel-a',
        options: null,
        isGroup: false,
        sampleType: null,
        price: 0,
      })
    ).toThrow(/tests calculés dépendants/i);
  });

  it('builds safe persistence data for group tests', () => {
    const data = buildTestPersistenceData(
      {
        code: 'PANELA',
        name: 'Panel A',
        unit: 'g/L',
        minValue: 1,
        maxValue: 2,
        minValueM: null,
        maxValueM: null,
        minValueF: null,
        maxValueF: null,
        decimals: 2,
        resultType: 'numeric',
        formula: null,
        categoryId: null,
        parentId: null,
        options: 'A,B',
        isGroup: true,
        sampleType: 'Sérum',
        price: 10,
      },
      null
    );

    expect(data.resultType).toBe('text');
    expect(data.unit).toBeNull();
    expect(data.minValue).toBeNull();
  });
});
