
'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Activity,
  Plus,
  TrendingUp as TrendingUpIcon,
  Info,
  Edit,
  Calendar,
  IdCard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDirectPrint } from '@/lib/hooks/useDirectPrint';

import { TrendChart } from '@/components/patients/TrendChart';
import { PatientEditModal } from '@/components/patients/PatientEditModal';
import { PatientHistoryTab } from '@/components/patients/PatientHistoryTab';
import { calculatePatientAge } from '@/components/patients/patient-helpers';
import type { PatientDetails } from '@/components/patients/types';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { PageBackLink } from '@/components/ui/PageBackLink';

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';
  const { id } = use(params);
  const router = useRouter();
  const { printUrl } = useDirectPrint();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'trends'>('history');
  const [mounted, setMounted] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientDetails | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ open: false, title: '', description: '', action: () => {} });


  const fetchPatientData = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${id}/history`);
      if (res.ok) {
        const data = await res.json();
        setPatient(data);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setMounted(true);
    fetchPatientData();
  }, [fetchPatientData]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    try {
      const res = await fetch(`/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPatient),
      });

      if (res.ok) {
        showNotification('success', 'Patient mis à jour');
        setEditingPatient(null);
        fetchPatientData();
      } else {
        showNotification('error', 'Erreur lors de la mise à jour');
      }
    } catch {
      showNotification('error', 'Erreur serveur');
    }
  };

  const handleDelete = async (patientId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        showNotification('success', 'Patient supprimé');
        router.push('/dashboard/patients');
      } else {
        showNotification('error', data.error || 'Erreur suppression');
      }
    } catch {
      showNotification('error', 'Erreur serveur');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="skeleton-card h-40" />
        <div className="skeleton-card h-96" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-400">
         <p>Patient introuvable</p>
      </div>
    );
  }

  // Process data for trends
  const trendData: Record<string, { unit?: string; points: { date: string; value: number; label: string }[] }> = {};
  
  patient.analyses.forEach(analysis => {
    analysis.results.forEach(res => {
      // Safety check to prevent crash if value or test is missing
      if (!res.value || !res.test) return;

      const numValue = parseFloat(res.value.toString().replace(',', '.'));
      if (!isNaN(numValue)) {
        if (!trendData[res.test.name]) {
          trendData[res.test.name] = { unit: res.test.unit, points: [] };
        }
        trendData[res.test.name].points.push({
          date: analysis.creationDate,
          value: numValue,
          label: analysis.orderNumber
        });
      }
    });
  });

  // Filter tests that have at least 2 points for a meaningful trend
  const parameterTrends = Object.entries(trendData)
    .filter(([, data]) => data.points.length >= 2)
    .sort((a, b) => b[1].points.length - a[1].points.length);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
       {/* Breadcrumbs / Back */}
       <div className="flex items-center justify-between">
         <PageBackLink href="/dashboard/patients" className="mb-0" iconSize={20} />

         <div className="flex gap-2">
            <button
               onClick={() => printUrl(`/print/patient-card/${patient.id}?autoprint=1&_t=${Date.now()}`)}
               className="btn-secondary-md px-6"
            >
              <IdCard size={16} /> Carte patient
            </button>
            <button 
               onClick={() => setEditingPatient(patient)}
               className="btn-secondary-md px-6"
            >
              <Edit size={16} /> Modifier la fiche
            </button>
             {role !== 'MEDECIN' && (
               <button 
               onClick={() => router.push(`/analyses/nouvelle?patientId=${id}`)}
                  className="btn-primary-md px-6"
               >
                 <Plus size={18} /> Nouvelle Analyse
               </button>
             )}

         </div>
       </div>

       {/* Patient Profile Bento */}
       <div className="rounded-xl border bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-start">
             <div className="flex gap-8 items-center flex-1">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-semibold shadow-inner ${
                    patient.gender === 'F' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                }`}>
                   {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-2">
                     <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">{patient.lastName} {patient.firstName}</h1>
                     <span className={`rounded-md px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${patient.gender === 'M' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                       {patient.gender === 'M' ? 'Homme' : 'Femme'}
                     </span>
                   </div>
                   <div className="flex flex-wrap gap-6 text-sm font-medium text-[var(--color-text-soft)]">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-300" />
                        <span>{calculatePatientAge(patient.birthDate)} ans <span className="text-slate-200 ml-1">({patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : 'N/A'})</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-slate-300" />
                        <span>Dernière analyse il y a {patient.analyses.length > 0 ? 'qq jours' : 'jamais'}</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 w-full lg:w-72">
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 transition-all">
                   <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-2">
                      <Phone size={12} /> Téléphone
                   </div>
                   <div className="text-sm font-semibold text-slate-700">{patient.phoneNumber || '—'}</div>
                </div>
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 transition-all">
                   <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-2">
                      <Mail size={12} /> Email
                   </div>
                   <div className="text-sm font-semibold text-slate-700 truncate">{patient.email || '—'}</div>
                </div>
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 transition-all">
                   <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-2">
                      <MapPin size={12} /> Adresse
                   </div>
                   <div className="text-sm font-semibold text-slate-700 truncate">{patient.address || '—'}</div>
                </div>
             </div>
          </div>
       </div>

        {/* Tabs & Content */}
        <div className="space-y-6">
           <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-muted)] p-1 w-fit">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 rounded-md px-8 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] transition-all ${activeTab === 'history' ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-text-soft)] hover:text-slate-700'}`}
              >
                <Info size={14} /> Historique
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`flex items-center gap-2 rounded-md px-8 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] transition-all ${activeTab === 'trends' ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-text-soft)] hover:text-slate-700'}`}
              >
                <TrendingUpIcon size={14} /> Tendances
              </button>
           </div>

           {activeTab === 'history' ? (
             <PatientHistoryTab analyses={patient.analyses} />
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parameterTrends.length > 0 ? (
                  parameterTrends.map(([name, data]) => (
                    <TrendChart 
                      key={name}
                      testName={name}
                      unit={data.unit}
                      data={data.points}
                    />
                  ))
                ) : (
                  <div className="col-span-full empty-state py-24">
                    <div className="empty-state-icon w-16 h-16 rounded-full bg-[var(--color-surface-muted)]">
                        <TrendingUpIcon size={32} />
                     </div>
                     <p className="text-[var(--color-text-soft)] font-semibold max-w-sm mx-auto">
                      Pas assez de données pour afficher les tendances.<br />
                      <span className="text-xs font-medium text-slate-400 mt-2 block italic text-center">Les graphiques apparaissent automatiquement lorsqu&apos;un même paramètre est analysé au moins deux fois.</span>
                    </p>
                  </div>
                )}
             </div>
           )}
        </div>
      <PatientEditModal
        mounted={mounted}
        patient={editingPatient}
        confirmDialog={confirmDialog}
        onPatientChange={(nextPatient) => setEditingPatient(nextPatient as PatientDetails)}
        onClose={() => setEditingPatient(null)}
        onSubmit={handleUpdate}
        onDeleteRequest={(nextPatient) =>
          setConfirmDialog({
            open: true,
            title: 'Supprimer ce patient ?',
            description: 'Cette action est irréversible. Impossible si des analyses sont liées.',
            action: () => {
              handleDelete(nextPatient.id);
              setEditingPatient(null);
            },
          })
        }
        onConfirmDialogOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
