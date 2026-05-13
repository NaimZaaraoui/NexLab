'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { QcMaterialsPanel } from '@/components/qc/QcMaterialsPanel';
import { LEVELS, type Material, type MaterialFormState } from '@/components/qc/config-types';

export default function QcMaterialsConfigPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialQuery, setMaterialQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [materialForm, setMaterialForm] = useState<MaterialFormState>({ name: '', level: LEVELS[0], manufacturer: '' });
  const [deleteMaterialState, setDeleteMaterialState] = useState<{ id: string; name: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      const res = await fetch('/api/qc?includeInactive=true', { cache: 'no-store' });
      if (res.ok) {
        setMaterials(await res.json());
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors du chargement des matériels');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMaterials = materials.filter((m) => {
    const q = materialQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.level.toLowerCase().includes(q) || (m.manufacturer || '').toLowerCase().includes(q);
  });

  if (status === 'loading') return <div className="p-10 text-center">Chargement de la session...</div>;
  if (!isAdmin) return <div className="p-10 text-center text-rose-600 font-semibold">Accès réservé aux administrateurs.</div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <button onClick={loadData} className="btn-secondary-md">
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Actualiser
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <QcMaterialsPanel
          materialForm={materialForm}
          materialQuery={materialQuery}
          filteredMaterials={filteredMaterials}
          onMaterialFormChange={setMaterialForm}
          onMaterialQueryChange={setMaterialQuery}
          onSubmit={async (event) => {
            event.preventDefault();
            const res = await fetch('/api/qc/materials', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(materialForm),
            });
            if (res.ok) {
              setMaterialForm({ name: '', level: LEVELS[0], manufacturer: '' });
              showNotification('success', 'Matériel QC créé');
              await loadData();
            } else {
              const data = await res.json();
              showNotification('error', data.error || 'Erreur lors de la création');
            }
          }}
          onDelete={(id, name) => setDeleteMaterialState({ id, name })}
        />
      </div>

      <ConfirmationModal
        isOpen={!!deleteMaterialState}
        onClose={() => setDeleteMaterialState(null)}
        onConfirm={async () => {
          if (!deleteMaterialState) return;
          const res = await fetch(`/api/qc/materials/${deleteMaterialState.id}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            showNotification('success', 'Matériel supprimé');
            await loadData();
          } else {
            const data = await res.json();
            showNotification('error', data.error || 'Erreur lors de la suppression');
          }
          setDeleteMaterialState(null);
        }}
        title="Supprimer le matériel"
        message={`Voulez-vous vraiment supprimer le matériel "${deleteMaterialState?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        icon="warning"
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
