export interface Category {
  id: string;
  name: string;
  rank: number;
  icon: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Test {
    id: string;
    name: string;
    code: string;
    unit: string | null;
    minValue: number | null;
    maxValue: number | null;
    minValueM: number | null;
    maxValueM: number | null;
    minValueF: number | null;
    maxValueF: number | null;
    decimals: number | null;
    resultType: string;
    formula?: string | null;
    categoryId: string | null;
    rank: number;
    options: string | null;
    isGroup: boolean;
    isOptional: boolean;
    sampleType: string | null;
    sampleContainer: string | null;
    price: number | null;
    categoryRel?: Category;
    parentId: string | null;
    parent?: Test;
    children?: Test[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Analysis {
  id: string;
  orderNumber: string;
  receiptNumber: string | null;
  dailyId: string | null;
  isUrgent: boolean;
  provenance: string | null;
  medecinPrescripteur: string | null;
  globalNote: string | null;
  globalNotePlacement: 'all' | 'first' | 'last' | null;
  totalPrice: number | null;
  amountPaid: number | null;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | null;
  paymentMethod?: string | null;
  paidAt?: string | Date | null;
  insuranceProvider?: string | null;
  insuranceCoverage?: number | null;
  insuranceShare?: number;
  patientShare?: number;
  validatedTechAt?: string | Date;
  validatedTechBy?: string;
  validatedTechName?: string;
  validatedBioAt?: string | Date;
  validatedBioBy?: string;
  validatedBioName?: string;
  patientId: string | null;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientAge: number | null;
  patientGender: string | null;
  creationDate: Date;
  drawingDate: Date | null;
  status: string | null;
  printedAt: Date | null;
  emailedAt?: Date | null;
  histogramData: string | null;
  previousResults?: Record<string, string>;
  patient?: Patient;
  specimens?: Specimen[];
  results: Result[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Specimen {
  id: string;
  analysisId: string;
  sampleType: string;
  containerType: string | null;
  barcode: string | null;
  status: string;
  condition: string | null;
  collectedAt: Date | string | null;
  receivedAt: Date | string | null;
  acceptedAt: Date | string | null;
  rejectedAt: Date | string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Result {
  id: string;
  analysisId: string;
  testId: string;
  test?: Test;
  value: string | null;
  unit: string | null;
  notes: string | null;
  abnormal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  gender: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bilan {
  id: string;
  name: string;
  code: string | null;
  price: number | null;
  tests?: Test[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Input Types
export type CreateTestInput = {
  name: string;
  code: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  resultType?: string;
  formula?: string;
  category?: string;
  isGroup?: boolean;
  parentId?: string;
  options?: string;
};

export type CreateAnalysisInput = {
  patientId: string;
  isUrgent?: boolean;
  globalNote?: string;
  globalNotePlacement?: 'all' | 'first' | 'last';
  patientFirstName?: string;
  patientLastName?: string;
  patientAge?: number;
  patientGender?: string;
  testsIds: string[];
};
