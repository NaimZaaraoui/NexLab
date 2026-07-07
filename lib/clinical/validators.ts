import { z } from 'zod';

export const analysisCreateSchema = z.object({
  dailyId: z.string().optional().nullable(),
  patientId: z.string().optional().nullable(),
  selectedPatientId: z.string().optional().nullable(),
  patientFirstName: z.string().min(1, 'Le prénom est requis'),
  patientLastName: z.string().min(1, 'Le nom est requis'),
  patientBirthDate: z.string().nullable().optional(),
  patientGender: z.enum(['M', 'F']).catch('M'),
  patientPhone: z.string().nullable().optional(),
  patientEmail: z.string().email('Email invalide').nullable().optional().or(z.literal('')),
  patientAddress: z.string().nullable().optional(),
  provenance: z.string().nullable().optional(),
  medecinPrescripteur: z.string().nullable().optional(),
  isUrgent: z.boolean().catch(false),
  globalNote: z.string().nullable().optional(),
  globalNotePlacement: z.enum(['all', 'first', 'last']).catch('all'),
  receiptNumber: z.string().nullable().optional(),
  testsIds: z.array(z.string()).min(1, 'Au moins un test doit être sélectionné'),
  insuranceProvider: z.string().nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
  insuranceCoverage: z.number().min(0).max(100).nullable().optional(),
});

export const resultUpdateSchema = z.object({
  id: z.string().min(1, 'ID du résultat manquant'),
  value: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  abnormal: z.boolean().catch(false),
});

export const TEST_RESULT_TYPES = ['numeric', 'text', 'long_text', 'dropdown', 'calculated'] as const;

const requiredTrimmedString = (message: string) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    return value.trim();
  }, z.string().min(1, message));

const codeString = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase();
}, z.string().min(1, 'Le code du test est requis'));

const optionalNullableString = z.preprocess((value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}, z.string().nullable());

const optionalNullableNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;
    return Number(normalized);
  }
  return value;
}, z.number().finite().nullable());

const optionalIntegerNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return null;
    return Number(normalized);
  }
  return value;
}, z.number().int().min(0, 'Le nombre de décimales doit être positif').max(6, 'Le nombre de décimales est trop élevé').nullable());

const testSchemaObject = z.object({
  code: codeString,
  loincCode: optionalNullableString.optional(),
  name: requiredTrimmedString('Le nom du test est requis'),
  unit: optionalNullableString.optional(),
  minValue: optionalNullableNumber.optional(),
  maxValue: optionalNullableNumber.optional(),
  minValueM: optionalNullableNumber.optional(),
  maxValueM: optionalNullableNumber.optional(),
  minValueF: optionalNullableNumber.optional(),
  maxValueF: optionalNullableNumber.optional(),
  decimals: optionalIntegerNumber.optional(),
  resultType: z.enum(TEST_RESULT_TYPES).catch('numeric'),
  formula: optionalNullableString.optional(),
  categoryId: optionalNullableString.optional(),
  parentId: optionalNullableString.optional(),
  options: optionalNullableString.optional(),
  isGroup: z.boolean().catch(false),
  isOptional: z.boolean().catch(false),
  sampleType: optionalNullableString.optional(),
  sampleContainer: optionalNullableString.optional(),
  price: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'string') {
      const normalized = value.trim().replace(',', '.');
      if (!normalized) return 0;
      return Number(normalized);
    }
    return value;
  }, z.number().finite().min(0, 'Le montant ne peut pas être négatif')),
});

function splitOptionValues(raw: string | null | undefined) {
  if (!raw) return [];
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

type TestRuleData = z.infer<typeof testSchemaObject> & {
  id?: string;
};

function withTestRules<T extends z.ZodType<TestRuleData>>(schema: T) {
  return schema.superRefine((data: TestRuleData, ctx) => {
    const numericLike = !data.isGroup && (data.resultType === 'numeric' || data.resultType === 'calculated');

    if (data.isGroup && data.resultType === 'calculated') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resultType'],
        message: 'Un panel ne peut pas être de type calculé.',
      });
    }

    if (!data.isGroup && data.resultType === 'dropdown' && splitOptionValues(data.options).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Ajoutez au moins une option pour une liste déroulante.',
      });
    }

    if (!data.isGroup && data.resultType === 'calculated' && !data.formula) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['formula'],
        message: 'La formule est obligatoire pour un test calculé.',
      });
    }

    if (
      numericLike &&
      data.minValue !== undefined &&
      data.minValue !== null &&
      data.maxValue !== undefined &&
      data.maxValue !== null &&
      data.minValue > data.maxValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minValue'],
        message: 'La valeur minimale standard doit être inférieure ou égale à la valeur maximale.',
      });
    }

    if (
      numericLike &&
      data.minValueM !== undefined &&
      data.minValueM !== null &&
      data.maxValueM !== undefined &&
      data.maxValueM !== null &&
      data.minValueM > data.maxValueM
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minValueM'],
        message: 'La plage homme est incohérente.',
      });
    }

    if (
      numericLike &&
      data.minValueF !== undefined &&
      data.minValueF !== null &&
      data.maxValueF !== undefined &&
      data.maxValueF !== null &&
      data.minValueF > data.maxValueF
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minValueF'],
        message: 'La plage femme est incohérente.',
      });
    }
  });
}

export const testCreateSchema = withTestRules(testSchemaObject);
export const testUpdateSchema = withTestRules(
  testSchemaObject.extend({
    id: requiredTrimmedString('ID du test manquant'),
  })
);

export type AnalysisCreateInput = z.infer<typeof analysisCreateSchema>;
export type ResultUpdateInput = z.infer<typeof resultUpdateSchema>;
export type TestCreateInput = z.infer<typeof testCreateSchema>;
export type TestUpdateInput = z.infer<typeof testUpdateSchema>;
