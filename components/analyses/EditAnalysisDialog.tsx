// components/analyses/EditAnalysisDialog.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { AvailableTestOption, EditAnalysisForm } from './types';

interface EditAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editForm: EditAnalysisForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditAnalysisForm>>;
  selectedTestIds: string[];
  toggleSelectedTest: (testId: string) => void;
  testSearch: string;
  setTestSearch: (val: string) => void;
  availableTests: AvailableTestOption[];
  provenanceOptions: string[];
  prescriberOptions: string[];
  saveAnalysisMeta: () => void;
  savingMeta: boolean;
}

export function EditAnalysisDialog({
  open,
  onOpenChange,
  editForm,
  setEditForm,
  selectedTestIds,
  toggleSelectedTest,
  testSearch,
  setTestSearch,
  availableTests,
  provenanceOptions,
  prescriberOptions,
  saveAnalysisMeta,
  savingMeta,
}: EditAnalysisDialogProps) {
  const updateEditForm = <K extends keyof EditAnalysisForm>(key: K, value: EditAnalysisForm[K]) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,31,51,0.10)] sm:max-w-2xl">
        <DialogHeader className="border-b border-[var(--color-border)] px-6 py-5">
          <DialogTitle>Modifier le dossier d&apos;analyse</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <input className="input-premium h-10 text-sm" placeholder="N° Paillasse" value={editForm.dailyId} onChange={(e) => updateEditForm('dailyId', e.target.value)} />
            <input className="input-premium h-10 text-sm" placeholder="Quittance" value={editForm.receiptNumber} onChange={(e) => updateEditForm('receiptNumber', e.target.value)} />
            <input className="input-premium h-10 text-sm" placeholder="Nom" value={editForm.patientLastName} onChange={(e) => updateEditForm('patientLastName', e.target.value)} />
            <input className="input-premium h-10 text-sm" placeholder="Prénom" value={editForm.patientFirstName} onChange={(e) => updateEditForm('patientFirstName', e.target.value)} />
            <input className="input-premium h-10 text-sm" placeholder="Âge" value={editForm.patientAge} onChange={(e) => updateEditForm('patientAge', e.target.value)} />
            <select className="input-premium h-10 text-sm" value={editForm.patientGender} onChange={(e) => updateEditForm('patientGender', e.target.value)}>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
            <input list="edit-provenance-options" className="input-premium h-10 text-sm col-span-2" placeholder="Provenance" value={editForm.provenance} onChange={(e) => updateEditForm('provenance', e.target.value)} />
            <datalist id="edit-provenance-options">
              {provenanceOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <input list="edit-prescriber-options" className="input-premium h-10 text-sm col-span-2" placeholder="Médecin prescripteur" value={editForm.medecinPrescripteur} onChange={(e) => updateEditForm('medecinPrescripteur', e.target.value)} />
            <datalist id="edit-prescriber-options">
              {prescriberOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <div className="col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateEditForm('isUrgent', false)}
                className={`h-10 px-4 rounded-xl text-xs font-bold border ${!editForm.isUrgent ? 'bg-[var(--color-surface-muted)] border-slate-300 text-slate-700' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-soft)]'}`}
              >
                Non urgent
              </button>
              <button
                type="button"
                onClick={() => updateEditForm('isUrgent', true)}
                className={`h-10 px-4 rounded-xl text-xs font-bold border ${editForm.isUrgent ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-soft)]'}`}
              >
                Urgent
              </button>
            </div>
            <div className="col-span-2 pt-3 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tests sélectionnés</span>
                <span className="text-xs font-semibold text-[var(--color-accent)]">{selectedTestIds.length} test(s)</span>
              </div>
              <input
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                placeholder="Rechercher un test (code ou nom)..."
                className="input-premium h-10 text-sm w-full mb-3"
              />
              <div className="max-h-56 overflow-y-auto border border-[var(--color-border)] rounded-xl p-2 space-y-1">
                {availableTests
                  .filter((test) => {
                    const q = testSearch.toLowerCase().trim();
                    if (!q) return true;
                    return test.code.toLowerCase().includes(q) || test.name.toLowerCase().includes(q);
                  })
                  .map((test) => (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => toggleSelectedTest(test.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                        selectedTestIds.includes(test.id)
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{test.code} - {test.name}</span>
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedTestIds.includes(test.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {selectedTestIds.includes(test.id) && <CheckCircle size={10} className="text-white" />}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
          <button onClick={() => onOpenChange(false)} className="btn-secondary">Annuler</button>
          <button onClick={saveAnalysisMeta} disabled={savingMeta} className="btn-primary">
            {savingMeta ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
