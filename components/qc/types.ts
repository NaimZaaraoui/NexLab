'use client';

export type QcValue = {
  id: string;
  testCode: string;
  testName: string;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  mean: number;
  sd: number | null;
  minAcceptable: number | null;
  maxAcceptable: number | null;
  unit: string | null;
  measured: number;
  zScore: number | null;
  inAcceptanceRange: boolean | null;
  flag: string;
  rule: string | null;
};

export type QcResult = {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  performedAt: string;
  values: QcValue[];
};

export type QcTarget = {
  id: string;
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
  isActive: boolean;
  targets: QcTarget[];
  targetsCount: number;
  resultsCount30d: number;
  lastResult: QcResult | null;
  todayResult: QcResult | null;
};

export type QcMaterial = {
  id: string;
  name: string;
  level: string;
  manufacturer: string | null;
  lots: QcLot[];
};

export type TodaySummary = {
  allPass: boolean;
  missing: number;
  warn: number;
  fail: number;
};
