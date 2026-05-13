import { Loader2, Plus, Search, User, X } from 'lucide-react';
import type { AnalysePatientForm, PatientSearchItem } from './analyse-form-types';

interface InsuranceOption {
  value: string;
  label: string;
}

interface AnalysePatientPanelProps {
  patient: AnalysePatientForm;
  setPatient: React.Dispatch<React.SetStateAction<AnalysePatientForm>>;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchResults: PatientSearchItem[];
  isSearching: boolean;
  selectedPatientId: string | null;
  selectPatient: (patient: PatientSearchItem) => void;
  clearSelection: () => void;
  insuranceProvider: string;
  setInsuranceProvider: (value: string) => void;
  insuranceNumber: string;
  setInsuranceNumber: (value: string) => void;
  insuranceCoverage: string;
  setInsuranceCoverage: (value: string) => void;
  insuranceProviders: InsuranceOption[];
  coverageOptions: InsuranceOption[];
}

export function AnalysePatientPanel({
  patient,
  setPatient,
  searchTerm,
  setSearchTerm,
  searchResults,
  isSearching,
  selectedPatientId,
  selectPatient,
  clearSelection,
  insuranceProvider,
  setInsuranceProvider,
  insuranceNumber,
  setInsuranceNumber,
  insuranceCoverage,
  setInsuranceCoverage,
  insuranceProviders,
  coverageOptions,
}: AnalysePatientPanelProps) {
  return (
    <div className="bento-panel flex flex-1 flex-col gap-5 p-5 lg:p-6">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
          <User size={16} />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Patient</h2>
      </div>

      <div className="relative z-50">
        <div className="input-premium relative flex h-11 w-full max-w-sm items-center gap-2 rounded-md bg-[var(--color-surface-muted)] pr-2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-soft)]" />
          ) : (
            <Search className="h-4 w-4 text-slate-400 transition-colors" />
          )}
          <input
            placeholder="Chercher un patient existant ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-full w-full bg-[var(--color-surface-muted)] pr-4 text-sm font-medium outline-none"
            disabled={!!selectedPatientId}
          />
          {selectedPatientId && (
            <button
              onClick={clearSelection}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--color-surface-muted)] rounded-md hover:bg-slate-200 text-[var(--color-text-soft)] transition-colors"
              title="Effacer la sélection"
            >
              <X size={14} />
            </button>
          )}
        </div>

          {searchResults.length > 0 && !selectedPatientId && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[0_8px_20px_rgba(15,31,51,0.08)]">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectPatient(item)}
                className="group flex w-full items-center justify-between rounded-md p-2 text-left transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                <div>
                  <span className="block text-sm font-semibold text-slate-700">{item.lastName} {item.firstName}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-0.5">
                    <span>{item.birthDate ? new Date(item.birthDate).toLocaleDateString() : 'Age inconnu'}</span>
                    {item.phoneNumber && <span>• {item.phoneNumber}</span>}
                  </div>
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600">
                  <Plus size={14} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

        <div className={`space-y-4 transition-all duration-300 ${selectedPatientId ? 'opacity-85' : ''}`}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="section-label">Nom *</label>
            <input
              value={patient.patientLastName}
              onChange={(e) => setPatient((prev) => ({ ...prev, patientLastName: e.target.value.toUpperCase() }))}
              className={`input-premium h-11 rounded-md font-semibold ${selectedPatientId ? 'bg-[var(--color-surface-muted)]/50' : ''}`}
              readOnly={!!selectedPatientId}
            />
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Prénom *</label>
            <input
              value={patient.patientFirstName}
              onChange={(e) => setPatient((prev) => ({ ...prev, patientFirstName: e.target.value.toUpperCase() }))}
              className={`input-premium h-11 rounded-md font-semibold ${selectedPatientId ? 'bg-[var(--color-surface-muted)]/50' : ''}`}
              readOnly={!!selectedPatientId}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="section-label">Sexe *</label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!!selectedPatientId}
                onClick={() => setPatient((prev) => ({ ...prev, patientGender: 'M' }))}
                className={`flex-1 h-11 rounded-md border text-sm font-medium transition-colors ${
                  patient.patientGender === 'M'
                    ? 'border-slate-300 bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-slate-300'
                } ${selectedPatientId ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                M
              </button>
              <button
                type="button"
                disabled={!!selectedPatientId}
                onClick={() => setPatient((prev) => ({ ...prev, patientGender: 'F' }))}
                className={`flex-1 h-11 rounded-md border text-sm font-medium transition-colors ${
                  patient.patientGender === 'F'
                    ? 'border-slate-300 bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-slate-300'
                } ${selectedPatientId ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                F
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Date naissance</label>
            <input
              type="date"
              value={patient.patientBirthDate}
              onChange={(e) => setPatient((prev) => ({ ...prev, patientBirthDate: e.target.value }))}
              className={`input-premium h-11 rounded-md text-sm ${selectedPatientId ? 'bg-[var(--color-surface-muted)]/50' : ''}`}
              readOnly={!!selectedPatientId}
            />
          </div>
        </div>

        {!selectedPatientId && (
          <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-2">
            <div className="space-y-1.5">
              <label className="section-label">Téléphone</label>
              <input
                value={patient.patientPhone}
                onChange={(e) => setPatient((prev) => ({ ...prev, patientPhone: e.target.value }))}
                className="input-premium h-11 rounded-md text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Email</label>
              <input
                type="email"
                value={patient.patientEmail}
                onChange={(e) => setPatient((prev) => ({ ...prev, patientEmail: e.target.value }))}
                className="input-premium h-11 rounded-md text-sm"
              />
            </div>
          </div>
        )}

        <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
          <h3 className="section-label">Prise en charge (Tier Payant)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="section-label">Caisse</label>
              <select
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                className="input-premium h-11 rounded-md text-sm"
              >
                {insuranceProviders.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Matricule / N° Adhérent</label>
              <input
                value={insuranceNumber}
                onChange={(e) => setInsuranceNumber(e.target.value)}
                placeholder="Ex: 12345678/A"
                className="input-premium h-11 rounded-md text-sm"
              />
            </div>
          </div>
          {insuranceProvider && (
            <div className="space-y-1.5">
              <label className="section-label">Taux de couverture</label>
              <div className="flex gap-2 flex-wrap">
                {coverageOptions.slice(1).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInsuranceCoverage(option.value)}
                    className={`h-9 rounded-md border px-4 text-sm font-medium transition-colors ${
                      insuranceCoverage === option.value
                        ? 'border-slate-300 bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
