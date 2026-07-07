import type { Test } from '@/lib/core/types';
import type { LabDisplaySettings } from '@/lib/settings/settings-schema';

export type CategoryOption = {
  id: string;
  name: string;
  rank: number;
  icon?: string | null;
  parentId?: string | null;
};

export type TestWithInventory = Test & {
  _count?: {
    inventoryRules: number;
  };
};

export type InventoryItemOption = {
  id: string;
  name: string;
  kind: string;
  unit: string;
  category: string;
  currentStock: number;
};

export type InventoryRule = {
  id: string;
  quantityPerTest: number;
  isActive: boolean;
  item: InventoryItemOption & { isActive: boolean };
};

export type TestFormState = {
  code: string;
  loincCode: string;
  name: string;
  unit: string;
  minValue: string;
  maxValue: string;
  minValueM: string;
  maxValueM: string;
  minValueF: string;
  maxValueF: string;
  decimals: string;
  resultType: string;
  formula: string;
  categoryId: string;
  parentId: string;
  options: string;
  isGroup: boolean;
  isOptional: boolean;
  sampleType: string;
  sampleContainer: string;
  price: string;
};

export type InventoryFormState = {
  itemId: string;
  quantityPerTest: string;
};

export type TestsLabSettings = LabDisplaySettings;

export const DEFAULT_TESTS_LAB_SETTINGS: TestsLabSettings = {
  sample_types: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
  sample_containers: 'Tube EDTA, Tube sec, Tube citrate, Tube héparine, Tube gel séparateur, Flacon urines, Écouvillon, Pot stérile',
  sample_conditions: 'Conforme, Hémolysé, Lipémique, Ictérique, Coagulé, Volume insuffisant, Tube mal identifié, Échantillon altéré',
  provenance_options: 'Consultation, Externe, Interne, Urgence, Médecin traitant, Maternité, Chirurgie',
  prescriber_options: '',
  clinical_units: 'g/L, mg/L, µg/L, mmol/L, µmol/L, nmol/L, U/L, %, Ratio, Log',
  amount_unit: 'DA',
};

export const EMPTY_TEST_FORM: TestFormState = {
  code: '',
  loincCode: '',
  name: '',
  unit: '',
  minValue: '',
  maxValue: '',
  minValueM: '',
  maxValueM: '',
  minValueF: '',
  maxValueF: '',
  decimals: '1',
  resultType: 'numeric',
  formula: '',
  categoryId: '',
  parentId: '',
  options: '',
  isGroup: false,
  isOptional: false,
  sampleType: '',
  sampleContainer: '',
  price: '0',
};

export const EMPTY_INVENTORY_FORM: InventoryFormState = {
  itemId: '',
  quantityPerTest: '',
};

export const RESULT_TYPES = [
  { value: 'numeric', label: 'Numérique' },
  { value: 'text', label: 'Texte court' },
  { value: 'long_text', label: 'Texte long' },
  { value: 'dropdown', label: 'Liste' },
  { value: 'calculated', label: 'Calculé' },
] as const;
