'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  FolderKanban,
  RefreshCw,
} from 'lucide-react';
import { BilanCard } from '@/components/bilans/BilanCard';
import { BilanEditorModal } from '@/components/bilans/BilanEditorModal';
import type { BilanItem, BilanTest } from '@/components/bilans/types';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PageBackLink } from '@/components/ui/PageBackLink';

export default function BilansPage() {
  const [bilans, setBilans] = useState<BilanItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [tests, setTests] = useState<BilanTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBilan, setEditingBilan] = useState<BilanItem | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    icon: 'logout' | 'reset' | 'deactivate' | 'activate' | 'warning';
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    type: 'info',
    icon: 'warning',
    title: '',
    message: '',
    action: () => {},
  });

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [resBilans, resTests] = await Promise.all([
        fetch('/api/bilans'),
        fetch('/api/tests')
      ]);
      const bilansData = await resBilans.json();
      const testsData = await resTests.json();
      setBilans(bilansData);
      setTests(testsData);
    } catch {
      showNotification('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (bilan?: BilanItem) => {
    if (bilan) {
      setEditingBilan(bilan);
      setFormData({ name: bilan.name, code: bilan.code || '' });
      setSelectedTests(bilan.tests.map(t => t.id));
    } else {
      setEditingBilan(null);
      setFormData({ name: '', code: '' });
      setSelectedTests([]);
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showNotification('error', 'Le nom est requis');
      return;
    }

    try {
      const url = editingBilan ? `/api/bilans/${editingBilan.id}` : '/api/bilans';
      const method = editingBilan ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          testIds: selectedTests
        })
      });

      if (res.ok) {
        showNotification('success', editingBilan ? 'Bilan modifié' : 'Bilan créé');
        setShowModal(false);
        fetchData();
      } else {
        showNotification('error', 'Erreur lors de l\'enregistrement');
      }
    } catch {
       showNotification('error', 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = (bilan: BilanItem) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      icon: 'warning',
      title: 'Supprimer le bilan ?',
      message: `Êtes-vous sûr de vouloir supprimer "${bilan.name}" ? Cette action est irréversible.`,
      action: async () => {
        try {
          const res = await fetch(`/api/bilans/${bilan.id}`, { method: 'DELETE' });
          if (res.ok) {
            showNotification('success', 'Bilan supprimé');
            fetchData();
          } else {
            showNotification('error', 'Erreur lors de la suppression');
          }
        } catch {
          showNotification('error', 'Erreur lors de la suppression');
        }
      }
    });
  };

  const toggleTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId) 
        : [...prev, testId]
    );
  };

  const filteredTests = tests.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-2xl border bg-[var(--color-surface)] p-5 shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
        <PageBackLink href="/dashboard/settings" />
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              <FolderKanban size={18} />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)] tracking-tight">Raccourcis et Bilans</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Gérez vos groupes de tests rapides et bilans standards.</p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="btn-secondary-md bg-slate-900 text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            <span>Nouveau Bilan</span>
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border bg-[var(--color-surface)] p-20 text-slate-400 shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
          <RefreshCw size={34} className="animate-spin text-slate-500" />
          <p className="font-bold uppercase tracking-widest text-xs">Chargement des bilans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {bilans.map((bilan) => (
            <BilanCard key={bilan.id} bilan={bilan} onEdit={handleOpenModal} onDelete={handleDelete} />
          ))}

          {bilans.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border bg-[var(--color-surface)] p-20 text-slate-400 shadow-[0_6px_18px_rgba(15,31,51,0.04)]">
               <FolderKanban size={40} className="text-slate-300" />
               <p className="font-bold uppercase tracking-widest text-xs text-center">Aucun bilan configuré.<br/>Commencez par en créer un nouveau.</p>
            </div>
          )}
        </div>
      )}

      <BilanEditorModal
        mounted={mounted}
        open={showModal}
        editingBilan={editingBilan}
        formData={formData}
        selectedTests={selectedTests}
        searchQuery={searchQuery}
        filteredTests={filteredTests}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
        onSearchQueryChange={setSearchQuery}
        onToggleTest={toggleTest}
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
      
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        icon={confirmModal.icon}
      />
    </div>
  );
}
