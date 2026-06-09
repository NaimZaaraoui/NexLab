'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DEFAULT_INVENTORY_CATEGORIES, type InventoryCategoryConfig } from '@/lib/inventory-categories';
import type { InventoryDetailItem, InventoryItemFormValues, TestOption } from '@/components/inventory/types';

export function useInventoryItem(itemId?: string) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';
  const canWrite = ['ADMIN', 'TECHNICIEN'].includes(role);
  const isAdmin = role === 'ADMIN';

  const [item, setItem] = useState<InventoryDetailItem | null>(null);
  const [tests, setTests] = useState<TestOption[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryConfig[]>(DEFAULT_INVENTORY_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showReceive, setShowReceive] = useState(false);
  const [showConsume, setShowConsume] = useState(false);
  const [showWaste, setShowWaste] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showRule, setShowRule] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [receiveForm, setReceiveForm] = useState({ lotNumber: '', expiryDate: '', quantity: '' });
  const [consumeForm, setConsumeForm] = useState({ quantity: '', lotNumber: '', reason: '' });
  const [wasteForm, setWasteForm] = useState({ quantity: '', lotNumber: '', reason: '' });
  const [adjustForm, setAdjustForm] = useState({ newStock: '', reason: '' });
  const [ruleForm, setRuleForm] = useState({ testId: '', quantityPerTest: '' });
  const [editForm, setEditForm] = useState<InventoryItemFormValues>({
    name: '',
    reference: '',
    category: DEFAULT_INVENTORY_CATEGORIES[0]?.name || 'Autre',
    unit: 'mL',
    minThreshold: '',
    storage: '',
    supplier: '',
    notes: '',
    kind: 'REAGENT',
  });

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadItem = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/${itemId}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du chargement');
      
      setItem(data);
      setEditForm({
        name: data.name || '',
        reference: data.reference || '',
        category: data.category || DEFAULT_INVENTORY_CATEGORIES[0]?.name || 'Autre',
        unit: data.unit || 'mL',
        minThreshold: String(data.minThreshold ?? ''),
        storage: data.storage || '',
        supplier: data.supplier || '',
        notes: data.notes || '',
        kind: data.kind || 'REAGENT',
      });
      setAdjustForm((prev) => ({ ...prev, newStock: String(data.currentStock ?? 0) }));
    } catch (error) {
      console.error(error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [itemId, showNotification]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/categories', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setCategories(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const loadTests = useCallback(async () => {
    try {
      const res = await fetch('/api/tests?includeGrouped=false', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTests(data);
        if (data.length > 0) {
          setRuleForm((prev) => ({ ...prev, testId: prev.testId || data[0].id }));
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadItem();
    loadTests();
    loadCategories();
  }, [loadItem, loadTests, loadCategories]);

  const handleReceive = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lotNumber: receiveForm.lotNumber,
        expiryDate: receiveForm.expiryDate,
        quantity: Number(receiveForm.quantity),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la réception');
      return;
    }

    setShowReceive(false);
    setReceiveForm({ lotNumber: '', expiryDate: '', quantity: '' });
    showNotification('success', 'Lot réceptionné');
    await loadItem();
  };

  const handleConsume = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: Number(consumeForm.quantity),
        lotNumber: consumeForm.lotNumber || null,
        reason: consumeForm.reason || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la consommation');
      return;
    }

    setShowConsume(false);
    setConsumeForm({ quantity: '', lotNumber: '', reason: '' });
    showNotification('success', 'Consommation enregistrée');
    await loadItem();
  };

  const handleAdjust = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStock: Number(adjustForm.newStock),
        reason: adjustForm.reason,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de l’ajustement');
      return;
    }

    setShowAdjust(false);
    setAdjustForm({ newStock: String(data.updatedItem.currentStock), reason: '' });
    showNotification('success', 'Stock ajusté');
    await loadItem();
  };

  const handleWaste = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/waste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: Number(wasteForm.quantity),
        lotNumber: wasteForm.lotNumber || null,
        reason: wasteForm.reason,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la mise au rebut');
      return;
    }

    setShowWaste(false);
    setWasteForm({ quantity: '', lotNumber: '', reason: '' });
    showNotification('success', 'Mise au rebut enregistrée');
    await loadItem();
  };

  const handleRuleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: ruleForm.testId,
        quantityPerTest: Number(ruleForm.quantityPerTest),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la sauvegarde de la règle');
      return;
    }

    setShowRule(false);
    setRuleForm((prev) => ({ ...prev, quantityPerTest: '' }));
    showNotification('success', 'Règle enregistrée');
    await loadItem();
  };

  const handleRuleDelete = async (ruleId: string) => {
    const res = await fetch(`/api/inventory/rules/${ruleId}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la suppression');
      return;
    }

    showNotification('success', 'Règle supprimée');
    await loadItem();
  };

  const handleDelete = async () => {
    if (!item) return;
    const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      setShowDeleteConfirm(false);
      showNotification('error', data.error || 'Erreur lors de la suppression');
      return;
    }

    router.push('/dashboard/inventory');
  };

  const handleToggleActive = async () => {
    if (!item) return;
    const res = await fetch(`/api/inventory/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-active' }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors du changement de statut');
      return;
    }

    showNotification('success', data.isActive ? 'Article réactivé' : 'Article désactivé');
    await loadItem();
  };

  const handleEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const res = await fetch(`/api/inventory/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        ...editForm,
        minThreshold: Number(editForm.minThreshold),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification('error', data.error || 'Erreur lors de la mise à jour');
      return;
    }

    setShowEdit(false);
    showNotification('success', 'Article mis à jour');
    await loadItem();
  };

  return {
    status,
    role,
    canWrite,
    isAdmin,
    item,
    tests,
    categories,
    loading,
    notification,

    showReceive, setShowReceive,
    showConsume, setShowConsume,
    showWaste, setShowWaste,
    showAdjust, setShowAdjust,
    showRule, setShowRule,
    showEdit, setShowEdit,
    showDeleteConfirm, setShowDeleteConfirm,

    receiveForm, setReceiveForm,
    consumeForm, setConsumeForm,
    wasteForm, setWasteForm,
    adjustForm, setAdjustForm,
    ruleForm, setRuleForm,
    editForm, setEditForm,

    handleReceive,
    handleConsume,
    handleAdjust,
    handleWaste,
    handleRuleSave,
    handleRuleDelete,
    handleDelete,
    handleToggleActive,
    handleEdit,
  };
}
