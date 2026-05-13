import type { Result } from '@/lib/types';

export type AnalysisNotePlacement = 'all' | 'first' | 'last';
export type AnalysisResultValues = Record<string, string>;
export type AnalysisResultHistory = Record<string, Result | null>;
export type ReportSettingsMap = Record<string, string>;
export type AnalysisInputsMap = Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>;

export interface AvailableTestOption {
  id: string;
  code: string;
  name: string;
}

export interface EditAnalysisForm {
  dailyId: string;
  receiptNumber: string;
  patientFirstName: string;
  patientLastName: string;
  patientAge: string;
  patientGender: string;
  provenance: string;
  medecinPrescripteur: string;
  isUrgent: boolean;
}

export const DEFAULT_EDIT_ANALYSIS_FORM: EditAnalysisForm = {
  dailyId: '',
  receiptNumber: '',
  patientFirstName: '',
  patientLastName: '',
  patientAge: '',
  patientGender: 'M',
  provenance: '',
  medecinPrescripteur: '',
  isUrgent: false,
};

export interface AnalysisQcReadiness {
  ready: boolean;
  blockers: Array<{
    materialName: string;
    lotNumber: string;
    status: 'missing' | 'fail';
    tests: string[];
  }>;
  relevantLots: number;
}

export interface DiatronPreviewItem {
  index: number;
  sampleId: string;
  date: string;
  time: string;
}

export type ResultWithRenderCategory = Result & {
  renderCategory?: string;
};

export type AnalysisNotification = {
  type: 'success' | 'error';
  message: string;
};
