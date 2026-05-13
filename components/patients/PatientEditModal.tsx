'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Save, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { type PatientDetails, type PatientListItem } from '@/components/patients/types';
import { GDPRPanel } from './GDPRPanel';

type EditablePatient = PatientListItem | PatientDetails;

interface PatientEditModalProps {
  mounted: boolean;
  patient: EditablePatient | null;
  confirmDialog: {
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  };
  onPatientChange: (patient: EditablePatient) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onDeleteRequest: (patient: EditablePatient) => void;
  onConfirmDialogOpenChange: (open: boolean) => void;
}

export function PatientEditModal({
  patient,
  confirmDialog,
  onPatientChange,
  onClose,
  onSubmit,
  onDeleteRequest,
  onConfirmDialogOpenChange,
}: PatientEditModalProps) {
  if (!patient) return null;

  return (
    <>
      <Dialog open={!!patient} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0 overflow-hidden">
          <DialogHeader className="flex items-center justify-between border-b border-[var(--color-border)] p-6">
            <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">Modifier le patient</DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Prénom</label>
                  <input
                    value={patient.firstName}
                    onChange={(event) => onPatientChange({ ...patient, firstName: event.target.value })}
                    className="input-premium h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Nom</label>
                  <input
                    value={patient.lastName}
                    onChange={(event) => onPatientChange({ ...patient, lastName: event.target.value })}
                    className="input-premium h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Date de naissance</label>
                <input
                  type="date"
                  value={patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : ''}
                  onChange={(event) => onPatientChange({ ...patient, birthDate: event.target.value })}
                  className="input-premium h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Sexe</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => onPatientChange({ ...patient, gender: 'M' })}
                    className={`flex-1 rounded-md border py-3 font-medium transition-all ${
                      patient.gender === 'M' ? 'border-indigo-200 bg-indigo-50 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-soft)]'
                    }`}
                  >
                    Homme
                  </button>
                  <button
                    type="button"
                    onClick={() => onPatientChange({ ...patient, gender: 'F' })}
                    className={`flex-1 rounded-md border py-3 font-medium transition-all ${
                      patient.gender === 'F' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-[var(--color-border)] text-[var(--color-text-soft)]'
                    }`}
                  >
                    Femme
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Téléphone</label>
                <input
                  value={patient.phoneNumber || ''}
                  onChange={(event) => onPatientChange({ ...patient, phoneNumber: event.target.value })}
                  className="input-premium h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Email</label>
                <input
                  value={patient.email || ''}
                  onChange={(event) => onPatientChange({ ...patient, email: event.target.value })}
                  className="input-premium h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Adresse</label>
                <input
                  value={patient.address || ''}
                  onChange={(event) => onPatientChange({ ...patient, address: event.target.value })}
                  className="input-premium h-11"
                />
              </div>

              {/* SECTION RGPD UNIQUEMENT POUR PATIENTS EXISTANTS */}
              {patient.id && !patient.id.startsWith('new') && (
                <div className="pt-6 border-t border-[var(--color-border)] mt-4">
                  <GDPRPanel 
                    patientId={patient.id} 
                    patientName={`${patient.firstName} ${patient.lastName}`} 
                    onPurgeSuccess={() => {
                        onClose();
                        window.location.reload(); 
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--color-border)] p-6">
              <button
                type="button"
                onClick={() => onDeleteRequest(patient)}
                className="flex items-center gap-2 rounded-md px-4 py-2 font-medium text-rose-500 transition-colors hover:bg-rose-50"
              >
                <Trash2 size={16} /> Supprimer
              </button>

              <button type="submit" className="btn-primary-md px-6">
                <Save size={16} /> Enregistrer
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={onConfirmDialogOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
      />
    </>
  );
}
