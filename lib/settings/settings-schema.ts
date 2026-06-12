export const ALLOWED_SETTINGS_KEYS = [
  'lab_name', 'lab_subtitle', 'lab_parent',
  'lab_address_1', 'lab_address_2', 'lab_phone', 'lab_email',
  'lab_bio_name', 'lab_bio_title', 'lab_bio_onmpt',
  'lab_footer_text', 'lab_stamp_image', 'lab_bio_signature', 'tat_warn', 'tat_alert',
  'sample_types', 'sample_containers', 'sample_conditions', 'provenance_options', 'prescriber_options', 'clinical_units', 'amount_unit', 'qc_range_basis', 'maintenance_mode', 'maintenance_message',
  'database_backup_retention_count', 'database_recovery_retention_count', 'database_backup_external_target',
  'diatron_enabled',
  'lab_logo',
  'report_title', 'report_show_doctor', 'report_show_barcode', 'report_show_provenance', 'report_disclaimer', 'report_show_previous_result', 'report_show_cbc_indices',
] as const;

export type SettingKey = (typeof ALLOWED_SETTINGS_KEYS)[number];

export type LabSettingsMap = Record<SettingKey, string>;

export type LabDisplaySettings = Pick<LabSettingsMap, 'sample_types' | 'sample_containers' | 'sample_conditions' | 'provenance_options' | 'prescriber_options' | 'clinical_units' | 'amount_unit'>;

export const DEFAULT_SETTINGS: LabSettingsMap = {
  lab_name: '',
  lab_subtitle: '',
  lab_parent: '',
  lab_address_1: '',
  lab_address_2: '',
  lab_phone: '',
  lab_email: '',
  lab_bio_name: '',
  lab_bio_title: '',
  lab_bio_onmpt: '',
  lab_footer_text: '',
  lab_stamp_image: '',
  lab_bio_signature: '',
  tat_warn: '',
  tat_alert: '',
  sample_types: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
  sample_containers: 'Tube EDTA, Tube sec, Tube citrate, Tube héparine, Tube gel séparateur, Flacon urines, Écouvillon, Pot stérile',
  sample_conditions: 'Conforme, Hémolysé, Lipémique, Ictérique, Coagulé, Volume insuffisant, Tube mal identifié, Échantillon altéré',
  provenance_options: 'Consultation, Externe, Interne, Urgence, Médecin traitant, Maternité, Chirurgie',
  prescriber_options: '',
  clinical_units: 'g/L, mg/L, µg/L, mmol/L, µmol/L, nmol/L, U/L, %, Ratio, Log',
  amount_unit: 'DA',
  qc_range_basis: '',
  maintenance_mode: '',
  maintenance_message: '',
  database_backup_retention_count: '',
  database_recovery_retention_count: '',
  database_backup_external_target: '',
  diatron_enabled: 'false',
  lab_logo: '',
  report_title: '',
  report_show_doctor: 'true',
  report_show_barcode: 'true',
  report_show_provenance: 'false',
  report_show_previous_result: 'true',
  report_show_cbc_indices: 'true',
  report_disclaimer: 'Les résultats ont été obtenus par des méthodes validées et standardisées. Une interprétation clinique par votre médecin traitant est nécessaire.',
};

export function normalizeSettingsRecord(
  value: Partial<Record<string, string>> | null | undefined
): LabSettingsMap {
  return {
    ...DEFAULT_SETTINGS,
    ...Object.fromEntries(
      ALLOWED_SETTINGS_KEYS.map((key) => [key, value?.[key] ?? DEFAULT_SETTINGS[key]])
    ),
  } as LabSettingsMap;
}

export function toLabDisplaySettings(
  value: Partial<Record<string, string>> | null | undefined
): LabDisplaySettings {
  const normalized = normalizeSettingsRecord(value);
  return {
    sample_types: normalized.sample_types,
    sample_containers: normalized.sample_containers,
    sample_conditions: normalized.sample_conditions,
    provenance_options: normalized.provenance_options,
    prescriber_options: normalized.prescriber_options,
    clinical_units: normalized.clinical_units,
    amount_unit: normalized.amount_unit,
  };
}
