
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { NotificationToast } from '@/components/ui/notification-toast';
import { PatientEditModal } from '@/components/patients/PatientEditModal';
import { PatientsGrid } from '@/components/patients/PatientsGrid';
import { PatientsToolbar } from '@/components/patients/PatientsToolbar';
import type { PatientListItem } from '@/components/patients/types';
import { useSession } from 'next-auth/react';

export default function PatientsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';

  const router = useRouter();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useLocalStorageState<number>('patients:itemsPerPage', 10);
  const latestRequestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // UI State
  const [editingPatient, setEditingPatient] = useState<PatientListItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
      open: boolean;
      title: string;
      description: string;
      action: () => void;
  }>({ open: false, title: '', description: '', action: () => {} });

  const fetchPatients = useCallback(async (query: string, requestId: number) => {
    const isInitialLoad = !hasLoadedOnceRef.current;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsSearching(true);
    }
    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = query.trim()
        ? `/api/patients?query=${encodedQuery}&skip=0&limit=2000`
        : '/api/patients?skip=0&limit=2000';
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (requestId === latestRequestRef.current) {
          setPatients(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
        setIsSearching(false);
        hasLoadedOnceRef.current = true;
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    const delayDebounceFn = setTimeout(() => {
      fetchPatients(searchTerm, requestId);
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchPatients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

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
        body: JSON.stringify(editingPatient)
      });
      
      if (res.ok) {
        showNotification('success', 'Patient mis à jour');
        setEditingPatient(null);
        const requestId = ++latestRequestRef.current;
        fetchPatients(searchTerm, requestId);
      } else {
        showNotification('error', 'Erreur lors de la mise à jour');
      }
    } catch {
       showNotification('error', 'Erreur serveur');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        showNotification('success', 'Patient supprimé');
        const requestId = ++latestRequestRef.current;
        fetchPatients(searchTerm, requestId);
      } else {
         showNotification('error', data.error || 'Erreur suppression');
      }
    } catch {
        showNotification('error', 'Erreur serveur');
    }
  };

  const totalPages = Math.max(1, Math.ceil(patients.length / itemsPerPage));
  const paginatedPatients = patients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <PatientsToolbar
        total={patients.length}
        role={role}
        searchTerm={searchTerm}
        isSearching={isSearching}
        onSearchTermChange={setSearchTerm}
        onOpenExports={() => router.push('/dashboard/exports')}
        onNewAnalysis={() => router.push('/analyses/nouvelle')}
      />


      <PatientsGrid
        patients={paginatedPatients}
        loading={loading}
        role={role}
        onEdit={setEditingPatient}
        onNewAnalysis={(patientId) => router.push(`/analyses/nouvelle?patientId=${patientId}`)}
      />

      {!loading && patients.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-1 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="patients-items-per-page" className="text-sm text-[var(--color-text-soft)]">
              Lignes par page
            </label>
            <select
              id="patients-items-per-page"
              value={itemsPerPage}
              onChange={(event) => setItemsPerPage(Number(event.target.value))}
              className="input-premium h-10 w-[92px] rounded-md px-3"
            >
              {[10, 20, 50, 100].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      <PatientEditModal
        mounted={mounted}
        patient={editingPatient}
        confirmDialog={confirmDialog}
        onPatientChange={(patient) => setEditingPatient(patient as PatientListItem)}
        onClose={() => setEditingPatient(null)}
        onSubmit={handleUpdate}
        onDeleteRequest={(patient) =>
          setConfirmDialog({
            open: true,
            title: 'Supprimer ce patient ?',
            description: 'Cette action est irréversible. Impossible si des analyses sont liées.',
            action: () => {
              handleDelete(patient.id);
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
