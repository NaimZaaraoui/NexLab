import { FileDigit } from 'lucide-react';

interface Props {
  dailyId: string;
  setDailyId: (value: string) => void;
  receiptNumber: string;
  setReceiptNumber: (value: string) => void;
  provenance: string;
  setProvenance: (value: string) => void;
  medecinPrescripteur: string;
  setMedecinPrescripteur: (value: string) => void;
  provenanceOptions: string[];
  prescriberOptions: string[];
  isUrgent: boolean;
  setIsUrgent: (value: boolean) => void;
}

export function AnalyseOrderPanel({
  dailyId,
  setDailyId,
  receiptNumber,
  setReceiptNumber,
  provenance,
  setProvenance,
  medecinPrescripteur,
  setMedecinPrescripteur,
  provenanceOptions,
  prescriberOptions,
  isUrgent,
  setIsUrgent,
}: Props) {
  return (
    <div className="bento-panel flex flex-col gap-5 p-5 lg:p-6">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
            <FileDigit size={16} />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Dossier / Paillasse</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="section-label">N° Paillasse *</label>
            <input
                value={dailyId}
                onChange={(e) => setDailyId(e.target.value)}
                placeholder="Ex: 54"
                className="input-premium h-12 rounded-md text-center text-lg font-semibold text-[var(--color-text)]"
                required
                autoFocus
            />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="section-label">Quittance</label>
            <input
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="Optionnel"
                className="input-premium h-12 rounded-md text-center"
            />
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-4">
          <div className="space-y-1.5">
            <label className="section-label">Provenance</label>
            <input
                list="provenance-options"
                value={provenance}
                onChange={(e) => setProvenance(e.target.value)}
                placeholder="Consultation, Externe..."
                className="input-premium h-11 rounded-md text-sm"
            />
            <datalist id="provenance-options">
              {provenanceOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Médecin Prescripteur</label>
            <input
                list="prescriber-options"
                value={medecinPrescripteur}
                onChange={(e) => setMedecinPrescripteur(e.target.value)}
                placeholder="Dr. Nom Prénom"
                className="input-premium h-11 rounded-md text-sm"
            />
            <datalist id="prescriber-options">
              {prescriberOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
      </div>

      <div className="space-y-1.5 border-t border-[var(--color-border)] pt-4">
          <label className="section-label">Urgence</label>
          <div className="grid grid-cols-2 gap-2">
            <button
                type="button"
                onClick={() => setIsUrgent(false)}
                className={`h-11 rounded-md border text-sm font-medium transition-colors ${
                  !isUrgent
                    ? 'border-slate-300 bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-slate-300'
                }`}
            >
                Non urgent
            </button>
            <button
                type="button"
                onClick={() => setIsUrgent(true)}
                className={`h-11 rounded-md border text-sm font-medium transition-colors ${
                  isUrgent
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-slate-300'
                }`}
            >
                Urgent
            </button>
          </div>
      </div>
    </div>
  );
}
