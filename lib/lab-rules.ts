/**
 * Centralized Laboratory Business Rules
 * This file acts as the single source of truth for implicit clinical domain rules
 * that are not strictly data-driven via the database schema.
 */

export const QUALITATIVE_VALUES = {
  GENERAL: ['Positif', 'Négatif', 'Douteux'],
  PRESENCE: ['Présence', 'Absence', 'Traces'],
  URINE_ASPECT: ['Clair', 'Trouble', 'Hémorragique'],
  BLOOD_GROUP: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
} as const;

/**
 * Automate Machine Mapping.
 * Translates incoming keys from laboratory instruments (e.g. Diatron, Sysmex)
 * to the standardized NexLab analytical codes.
 * Key: NexLab Code
 * Value: Array of possible machine names/aliases for this test
 */
export const MACHINE_ALIASES: Record<string, string[]> = {
  'GB': ['WBC', 'GB'],
  'GR': ['RBC', 'GR'],
  'HB': ['HGB', 'HB'],
  'HT': ['HCT', 'HT'],
  'VGM': ['MCV', 'VGM'],
  'TCMH': ['MCH', 'TCMH'],
  'CCMH': ['MCHC', 'CCMH'],
  'IDRc': ['IDRc', 'IDR'],
  'IDR%': ['IDR%'],
  'PLT': ['PLT'],
  'LYM': ['LYM', 'LYM%'], 
  'MID': ['MID', 'MID%'],
  'GRA': ['GRA', 'GRA%'], 
  'LYM%': ['LYM%', 'LYM_P'],
  'MID%': ['MID%', 'MID_P'],
  'GRA%': ['GRA%', 'GRA_P']
};

/**
 * Hematology Default Clinical Thresholds
 * Used to trigger warning flags (ANÉMIE, LEUCOPÉNIE, etc.) automatically
 * based on numeric values in reports when they don't depend entirely on dynamic reference ranges.
 */
export const HEMATOLOGY_THRESHOLDS = {
  GB: {
    LEUCOPENIA: 4.0, // < 4.0
    HYPERLEUKOCYTOSIS: 10.0, // > 10.0
  },
  HGB: {
    ANEMIA_MALE: 13.0, // < 13.0
    ANEMIA_FEMALE: 12.0, // < 12.0
  },
  PLT: {
    THROMBOPENIA: 150, // < 150
    THROMBOCYTOSIS: 450, // > 450
  },
  LYM_ABS: {
    LYMPHOPENIA: 1.0, // < 1.0
    LYMPHOCYTOSIS: 4.0, // > 4.0
  },
  PNN_ABS: {
    NEUTROPENIA: 1.5, // < 1.5
    NEUTROPHILIA: 7.5, // > 7.5
  },
  VGM: {
    MICROCYTOSIS: 80, // < 80
    MACROCYTOSIS: 100, // > 100
  },
  RDW: {
    ANISOCYTOSIS: 16.0, // > 16.0
  }
} as const;
