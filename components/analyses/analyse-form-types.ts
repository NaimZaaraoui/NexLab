export interface BilanOption {
  id: string;
  name: string;
  tests: Array<{ id: string }>;
}

export interface PatientSearchItem {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  gender: string;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
}

export interface AnalysePatientForm {
  patientFirstName: string;
  patientLastName: string;
  patientBirthDate: string;
  patientGender: string;
  patientPhone: string;
  patientEmail: string;
  patientAddress: string;
}
