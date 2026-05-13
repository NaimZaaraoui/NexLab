'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { QcLotEditModal } from '@/components/qc/QcLotEditModal';
import { QcLotsTargetsPanel } from '@/components/qc/QcLotsTargetsPanel';
import {
  EMPTY_TARGET_ROW,
  type EditingLot,
  type LotFormState,
  type Material,
  type QcTarget,
  type RangeBasis,
  type TargetRow,
  type TestOption,
} from '@/components/qc/config-types';
import { getRangeBasisLabel } from '@/components/qc/qc-config-helpers';

export default function QcLotsConfigPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [materials, setMaterials] = useState<Material[]>([]);
  const [tests, setTests] = useState<TestOption[]>([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [expandedMaterialIds, setExpandedMaterialIds] = useState<string[]>([]);
  const [globalRangeBasis, setGlobalRangeBasis] = useState<RangeBasis>('2sd');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lotForm, setLotForm] = useState<LotFormState>({ materialId: '', lotNumber: '', expiryDate: '', openedAt: '' });
  const [editingLot, setEditingLot] = useState<EditingLot | null>(null);
  const [savingLotEdit, setSavingLotEdit] = useState(false);
  const [deleteLotState, setDeleteLotState] = useState<{ id: string; lotNumber: string } | null>(null);
  const [targetRows, setTargetRows] = useState<TargetRow[]>([{ ...EMPTY_TARGET_ROW }]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async (autoSelectLotId?: string) => {
    setLoading(true);
    try {
      const [materialsRes, testsRes, settingsRes] = await Promise.all([
        fetch('/api/qc?includeInactive=true', { cache: 'no-store' }),
        fetch('/api/tests?includeGrouped=false', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
      ]);
      const [materialsData, testsData, settingsData] = await Promise.all([materialsRes.json(), testsRes.json(), settingsRes.json()]);
      
      if (materialsRes.ok) {
        setMaterials(materialsData);
        if (autoSelectLotId) {
          setSelectedLotId(autoSelectLotId);
          // Find materialId for this lot to expand it
          const material = materialsData.find((m: Material) => m.lots.some(l => l.id === autoSelectLotId));
          if (material) {
            setExpandedMaterialIds(prev => Array.from(new Set([...prev, material.id])));
          }
        } else if (!selectedLotId && materialsData.length > 0) {
          const firstLotId = materialsData.flatMap((material: Material) => material.lots)[0]?.id || '';
          setSelectedLotId(firstLotId);
          if (materialsData[0]?.id) {
             setExpandedMaterialIds([materialsData[0].id]);
          }
        }
      }
      if (testsRes.ok) setTests(testsData);
      if (settingsRes.ok && settingsData.qc_range_basis) setGlobalRangeBasis(settingsData.qc_range_basis);
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [selectedLotId]);

  const searchParams = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  // Gestion de l'expansion via paramètre d'URL
  useEffect(() => {
    const matId = searchParams.get('materialId');
    if (matId && materials.some(m => m.id === matId)) {
      setExpandedMaterialIds(prev => Array.from(new Set([...prev, matId])));
      // Optionnel: scroller vers le matériel ?
      setTimeout(() => {
        const el = document.getElementById(`material-${matId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [searchParams, materials]);

  const toggleMaterial = (id: string) => {
    setExpandedMaterialIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectLot = useCallback((lotId: string, matId: string) => {
    const isDeselect = selectedLotId === lotId;
    setSelectedLotId(isDeselect ? '' : lotId);
    setExpandedMaterialIds(prev => prev.includes(matId) ? prev : [...prev, matId]);
    
    if (isDeselect) {
      setTargetRows([{ ...EMPTY_TARGET_ROW }]);
      return;
    }

    // Charger une seule ligne vide par défaut pour un nouveau paramètre
    setTargetRows([{ ...EMPTY_TARGET_ROW }]);
  }, [selectedLotId]);

  const handleEditTarget = useCallback((target: QcTarget) => {
    setTargetRows([{
      testId: target.testId || '',
      testCode: target.testCode,
      testName: target.testName,
      unit: target.unit || '',
      mean: Number(target.mean).toFixed(2),
      sd: target.controlMode === 'STATISTICAL' ? Number(target.sd || 0).toFixed(2) : '',
      minValue: target.controlMode === 'ACCEPTANCE_RANGE' ? Number(target.minAcceptable || 0).toFixed(2) : '',
      maxValue: target.controlMode === 'ACCEPTANCE_RANGE' ? Number(target.maxAcceptable || 0).toFixed(2) : '',
      inputMode: target.controlMode === 'STATISTICAL' ? 'sd' : 'range'
    }]);
    // Scroller vers le bloc formulaire précisément
    setTimeout(() => {
      document.getElementById('qc-target-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  const saveEditedLot = async () => {
    if (!editingLot) return;
    setSavingLotEdit(true);
    const res = await fetch(`/api/qc/lots/${editingLot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingLot),
    });
    if (res.ok) {
      setEditingLot(null);
      showNotification('success', 'Lot mis à jour');
      await loadData();
    } else {
      showNotification('error', 'Erreur lors de la modification');
    }
    setSavingLotEdit(false);
  };

  const saveTargets = async (lotId: string) => {
    const payload = targetRows
      .map((row) => {
        const mean = Number(row.mean);
        const directSd = Number(row.sd);
        const minValue = Number(row.minValue);
        const maxValue = Number(row.maxValue);
        let computedSd = directSd;
        let controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE' = 'STATISTICAL';
        let minAcceptable: number | null = null;
        let maxAcceptable: number | null = null;

        if (row.inputMode === 'range' && Number.isFinite(minValue) && Number.isFinite(maxValue)) {
          const divisor = globalRangeBasis === '1sd' ? 2 : globalRangeBasis === '3sd' ? 6 : 4;
          computedSd = (maxValue - minValue) / divisor;
          controlMode = 'ACCEPTANCE_RANGE';
          minAcceptable = minValue;
          maxAcceptable = maxValue;
        } else if (row.inputMode === 'sd' && Number.isFinite(directSd) && directSd > 0) {
          minAcceptable = mean - directSd * 2;
          maxAcceptable = mean + directSd * 2;
        }

        return {
          testId: row.testId || null,
          testCode: row.testCode.trim(),
          testName: row.testName.trim(),
          controlMode,
          mean,
          sd: row.inputMode === 'sd' ? computedSd : null,
          minAcceptable,
          maxAcceptable,
          unit: row.unit.trim() || null,
        };
      })
      .filter((row) =>
        row.testCode &&
        row.testName &&
        Number.isFinite(row.mean) &&
        (
          (row.controlMode === 'STATISTICAL' && Number.isFinite(Number(row.sd)) && Number(row.sd) > 0) ||
          (row.controlMode === 'ACCEPTANCE_RANGE' && Number.isFinite(Number(row.minAcceptable)) && Number.isFinite(Number(row.maxAcceptable)))
        )
      );

    if (payload.length === 0 && targetRows.some(r => r.testCode || r.mean)) {
      showNotification('error', 'Veuillez remplir correctement la cible (Valeur + SD ou Plage)');
      return;
    }

    const res = await fetch(`/api/qc/lots/${lotId}/targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: payload }),
    });
    if (res.ok) {
      showNotification('success', 'Cibles enregistrées');
      setTargetRows([{ ...EMPTY_TARGET_ROW }]);
      await loadData();
    } else {
      const data = await res.json();
      showNotification('error', data.error || 'Erreur lors de l’enregistrement');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => loadData()} className="btn-secondary-md">
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Actualiser
        </button>
      </div>

      <QcLotsTargetsPanel
        materials={materials}
        filteredMaterials={materials}
        tests={tests}
        lotForm={lotForm}
        targetRows={targetRows}
        selectedLotId={selectedLotId}
        expandedMaterialIds={expandedMaterialIds}
        globalRangeBasis={globalRangeBasis}
        rangeBasisLabel={getRangeBasisLabel(globalRangeBasis)}
        onLoadSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch('/api/qc/lots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lotForm),
          });
          if (res.ok) {
            const data = await res.json();
            setLotForm({ ...lotForm, lotNumber: '', expiryDate: '', openedAt: '' });
            showNotification('success', 'Lot créé');
            await loadData(data.id); // Auto-select new lot
          } else {
            const data = await res.json();
            showNotification('error', data.error || 'Erreur de création');
          }
        }}
        onLotFormChange={setLotForm}
        onUpdateGlobalRangeBasis={async (v) => {
          setGlobalRangeBasis(v);
          await fetch('/api/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { qc_range_basis: v } }),
          });
        }}
        onToggleMaterial={toggleMaterial}
        onSelectLot={handleSelectLot}
        onUpdateLot={(id, l) => setEditingLot({ id, ...l, expiryDate: l.expiryDate.slice(0, 10), openedAt: l.openedAt?.slice(0, 10) || '' })}
        onToggleLot={async (id) => {
          await fetch(`/api/qc/lots/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle-active' }) });
          await loadData();
        }}
        onDeleteLot={(id, lotNumber) => setDeleteLotState({ id, lotNumber })}
        onEditTarget={handleEditTarget}
        onTargetRowsChange={setTargetRows}
        onSaveTargets={saveTargets}
      />

      <QcLotEditModal open={!!editingLot} saving={savingLotEdit} lot={editingLot} onClose={() => setEditingLot(null)} onChange={setEditingLot} onSave={saveEditedLot} />
      
      <ConfirmationModal
        isOpen={!!deleteLotState}
        onClose={() => setDeleteLotState(null)}
        onConfirm={async () => {
          if (!deleteLotState) return;
          const res = await fetch(`/api/qc/lots/${deleteLotState.id}`, { method: 'DELETE' });
          if (res.ok) {
            showNotification('success', 'Lot supprimé');
            await loadData();
          } else {
            const data = await res.json();
            showNotification('error', data.error || 'Erreur lors de la suppression');
          }
          setDeleteLotState(null);
        }}
        title="Supprimer le lot"
        message={`Voulez-vous supprimer le lot ${deleteLotState?.lotNumber}?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        icon="warning"
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
