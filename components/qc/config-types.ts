export type QcTarget = {
  id: string;
  testId: string | null;
  testCode: string;
  testName: string;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  mean: number;
  sd: number | null;
  minAcceptable: number | null;
  maxAcceptable: number | null;
  unit: string | null;
};

export type QcLot = {
  id: string;
  lotNumber: string;
  expiryDate: string;
  openedAt?: string | null;
  isActive: boolean;
  resultsCount30d?: number;
  targets: QcTarget[];
};

export type Material = {
  id: string;
  name: string;
  level: string;
  manufacturer: string | null;
  isActive?: boolean;
  lots: QcLot[];
};

export type TestOption = {
  id: string;
  code: string;
  name: string;
  unit: string | null;
};

export type TargetRow = {
  testId: string;
  testCode: string;
  testName: string;
  mean: string;
  sd: string;
  unit: string;
  inputMode: 'sd' | 'range';
  minValue: string;
  maxValue: string;
};

export type RangeBasis = '1sd' | '2sd' | '3sd';

export type MaterialFormState = {
  name: string;
  level: string;
  manufacturer: string;
};

export type LotFormState = {
  materialId: string;
  lotNumber: string;
  expiryDate: string;
  openedAt: string;
};

export type EditingLot = {
  id: string;
  lotNumber: string;
  expiryDate: string;
  openedAt: string;
};

export const LEVELS = ['Normal', 'Pathologique', 'Critique'];

export const EMPTY_TARGET_ROW: TargetRow = {
  testId: '',
  testCode: '',
  testName: '',
  mean: '',
  sd: '',
  unit: '',
  inputMode: 'range',
  minValue: '',
  maxValue: '',
};
