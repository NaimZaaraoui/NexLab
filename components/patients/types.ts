'use client';

export interface PatientListItem {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  gender: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
}

export interface PatientAnalysisResult {
  id: string;
  test: {
    name: string;
    unit?: string;
  };
  value: string;
}

export interface PatientAnalysis {
  id: string;
  orderNumber: string;
  creationDate: string;
  status: string;
  results: PatientAnalysisResult[];
}

export interface PatientDetails extends PatientListItem {
  analyses: PatientAnalysis[];
}
