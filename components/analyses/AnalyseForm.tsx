'use client';

import { NotificationToast } from '@/components/ui/notification-toast';
import { AnalyseActionBar } from './AnalyseActionBar';
import { AnalysePatientPanel } from './AnalysePatientPanel';
import { AnalyseTestsPanel } from './AnalyseTestsPanel';
import { AnalyseOrderPanel } from './AnalyseOrderPanel';
import { useAnalyseForm } from './useAnalyseForm';
import { useLicense } from '@/components/providers/LicenseProvider';

const INSURANCE_PROVIDERS = [
  { value: '', label: '-- Aucune assurance --' },
  { value: 'CNAM', label: 'CNAM' },
  { value: 'CNSS', label: 'CNSS' },
  { value: 'CNRPS', label: 'CNRPS' },
  { value: 'PRIVATE', label: 'Assurance Privée' },
];

const COVERAGE_OPTIONS = [
  { value: '', label: '-- Choisir --' },
  { value: '100', label: '100% (Exonéré)' },
  { value: '80', label: '80%' },
  { value: '70', label: '70%' },
  { value: '50', label: '50%' },
];

function splitSettingsList(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AnalyseForm() {
  const state = useAnalyseForm();
  const { isExpired } = useLicense();
  const totalAmount = state.tests
    .filter((test) => state.selectedTests.includes(test.id))
    .reduce((sum, test) => sum + (test.price || 0), 0);

  if (state.loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
         <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 pb-0 animate-fade-in">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">Nouveau dossier d&apos;analyse</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Enregistrez le dossier, rattachez le patient et sélectionnez les examens demandés.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <span className="status-pill rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[var(--color-text-secondary)]">
              {state.selectedTests.length} examen(s)
            </span>
            <span className={`status-pill rounded-md px-2.5 py-1 ${state.isUrgent ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'}`}>
              {state.isUrgent ? 'Urgent' : 'Routine'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-5">
         <AnalyseOrderPanel
            dailyId={state.dailyId}
            setDailyId={state.setDailyId}
            receiptNumber={state.receiptNumber}
            setReceiptNumber={state.setReceiptNumber}
            provenance={state.provenance}
            setProvenance={state.setProvenance}
            medecinPrescripteur={state.medecinPrescripteur}
            setMedecinPrescripteur={state.setMedecinPrescripteur}
            provenanceOptions={splitSettingsList(state.labSettings.provenance_options)}
            prescriberOptions={splitSettingsList(state.labSettings.prescriber_options)}
            isUrgent={state.isUrgent}
            setIsUrgent={state.setIsUrgent}
         />

         <AnalysePatientPanel
            patient={state.patientState.patient}
            setPatient={state.patientState.setPatient}
            searchTerm={state.patientState.searchTerm}
            setSearchTerm={state.patientState.setSearchTerm}
            searchResults={state.patientState.searchResults}
            isSearching={state.patientState.isSearching}
            selectedPatientId={state.patientState.selectedPatientId}
            selectPatient={state.patientState.selectPatient}
            clearSelection={state.patientState.clearSelection}
            insuranceProvider={state.patientState.insuranceProvider}
            setInsuranceProvider={state.patientState.setInsuranceProvider}
            insuranceNumber={state.patientState.insuranceNumber}
            setInsuranceNumber={state.patientState.setInsuranceNumber}
            insuranceCoverage={state.patientState.insuranceCoverage}
            setInsuranceCoverage={state.patientState.setInsuranceCoverage}
            insuranceProviders={INSURANCE_PROVIDERS}
            coverageOptions={COVERAGE_OPTIONS}
         />
      </div>

      <div className="w-full flex flex-col gap-5">
         <AnalyseTestsPanel
            searchTest={state.searchTest}
            setSearchTest={state.setSearchTest}
            bilans={state.bilans}
            selectedTests={state.selectedTests}
            toggleBilan={state.toggleBilan}
            groupedTests={state.groupedTests}
            toggleTest={state.toggleTest}
         />
      </div>

      <AnalyseActionBar
        selectedCount={state.selectedTests.length}
        totalAmount={totalAmount}
        amountUnit={state.labSettings.amount_unit}
        isUrgent={state.isUrgent}
        isExpired={isExpired}
        submitting={state.submitting}
        submitDisabled={state.submitting || state.selectedTests.length === 0 || isExpired}
        onCancel={() => state.router.back()}
        onSubmit={() => {
          void state.handleSubmit();
        }}
      />

      {state.notification && (
        <NotificationToast type={state.notification.type} message={state.notification.message} />
      )}
    </div>
  );
}
