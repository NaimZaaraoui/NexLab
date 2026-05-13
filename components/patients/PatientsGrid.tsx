'use client';

import { Calendar, ChevronRight, Edit2, Mail, Phone, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { calculatePatientAge } from '@/components/patients/patient-helpers';
import type { PatientListItem } from '@/components/patients/types';

interface PatientsGridProps {
  patients: PatientListItem[];
  loading: boolean;
  role: string;
  onEdit: (patient: PatientListItem) => void;
  onNewAnalysis: (patientId: string) => void;
}

export function PatientsGrid({ patients, loading, role, onEdit, onNewAnalysis }: PatientsGridProps) {
  if (loading && patients.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="skeleton-card h-[260px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {patients.map((patient) => (
        <div
          key={patient.id}
          className="group flex flex-col rounded-lg border bg-[var(--color-surface)] p-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)] transition-colors hover:bg-[var(--color-surface-muted)]"
        >
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-sm font-semibold ${
                  patient.gender === 'F' ? 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                }`}
              >
                {patient.firstName[0]}
                {patient.lastName[0]}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold leading-tight text-[var(--color-text)]">
                  {patient.lastName} {patient.firstName}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      patient.gender === 'M'
                        ? 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {patient.gender === 'M' ? 'Homme' : 'Femme'}
                  </span>
                  <span className="rounded-sm bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-soft)]">
                    {calculatePatientAge(patient.birthDate)} ans
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {role !== 'MEDECIN' && (
                <button
                  onClick={() => onNewAnalysis(patient.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
                  title="Nouvelle Analyse"
                >
                  <Plus size={18} />
                </button>
              )}

              <button
                onClick={() => onEdit(patient)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              >
                <Edit2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  <Phone size={10} /> Téléphone
                </div>
                <div className="truncate text-xs font-semibold text-slate-700">{patient.phoneNumber || '—'}</div>
              </div>
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  <Calendar size={10} /> Naissance
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  {patient.birthDate
                    ? new Date(patient.birthDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
              </div>
            </div>

            {patient.email && (
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  <Mail size={10} /> Email
                </div>
                <div className="truncate text-xs font-medium text-[var(--color-text-secondary)]">{patient.email}</div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Link href={`/dashboard/patients/${patient.id}`} className="btn-secondary-sm w-full justify-between text-[11px] uppercase tracking-wide">
              Voir le dossier complet
              <ChevronRight size={14} className="transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      ))}

      {patients.length === 0 && !loading && (
        <div className="empty-state col-span-full py-24">
          <div className="empty-state-icon h-20 w-20 rounded-full bg-slate-200/50">
            <Users size={40} />
          </div>
          <h3 className="empty-state-title mb-2 text-xl">Aucun patient trouvé</h3>
          <p className="empty-state-text mx-auto max-w-sm text-sm">
            Ajustez votre recherche ou créez une fiche pour un nouveau patient.
          </p>
        </div>
      )}
    </div>
  );
}
