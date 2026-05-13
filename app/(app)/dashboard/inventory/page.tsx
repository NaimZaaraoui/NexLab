'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FolderCog, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { InventoryAnalyticsPanel } from '@/components/inventory/InventoryAnalyticsPanel';
import { InventoryAttentionPanel } from '@/components/inventory/InventoryAttentionPanel';
import { InventoryCategoryManagerModal } from '@/components/inventory/InventoryCategoryManagerModal';
import { InventoryItemFormModal } from '@/components/inventory/InventoryItemFormModal';
import { InventoryItemsTable } from '@/components/inventory/InventoryItemsTable';
import { InventoryReorderPanel, type InventoryReorderItem } from '@/components/inventory/InventoryReorderPanel';
import { InventorySummaryStats } from '@/components/inventory/InventorySummaryStats';
import { computeReorderSuggestion } from '@/lib/inventory-shared';
import { DEFAULT_INVENTORY_CATEGORIES, type InventoryCategoryConfig } from '@/lib/inventory-categories';
import {
  type InventoryAnalytics,
  type InventoryItemFormValues,
  type InventoryItemSummary,
} from '@/components/inventory/types';

export default function InventoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';

  const [items, setItems] = useState<InventoryItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'critical' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [categories, setCategories] = useState<InventoryCategoryConfig[]>(DEFAULT_INVENTORY_CATEGORIES);
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [categoryDrafts, setCategoryDrafts] = useState<InventoryCategoryConfig[]>(DEFAULT_INVENTORY_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [form, setForm] = useState<InventoryItemFormValues>({
    name: '',
    reference: '',
    category: DEFAULT_INVENTORY_CATEGORIES[0]?.name || 'Autre',
    unit: 'mL',
    minThreshold: '',
    currentStock: '0',
    storage: '',
    supplier: '',
    notes: '',
    kind: 'REAGENT',
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showNotification('error', "Erreur lors du chargement de l'inventaire");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/categories', { cache: 'no-store' });
      const data = await res.json();
      const nextCategories = Array.isArray(data) && data.length > 0 ? data : DEFAULT_INVENTORY_CATEGORIES;
      setCategories(nextCategories);
      setCategoryDrafts(nextCategories);
      setForm((prev) => ({
        ...prev,
        category: nextCategories.some((category) => category.name === prev.category)
          ? prev.category
          : nextCategories[0]?.name || prev.category,
      }));
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors du chargement des catégories inventaire');
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/analytics', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadCategories();
    loadAnalytics();
  }, [loadAnalytics, loadCategories, loadItems]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      low: items.filter((item) => item.status === 'low').length,
      critical: items.filter((item) => item.status === 'critical').length,
      expired: items.filter((item) => item.status === 'expired').length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!keyword) return true;
      return item.name.toLowerCase().includes(keyword) || item.category.toLowerCase().includes(keyword);
    });
  }, [items, filter, search]);

  const criticalItems = items.filter((item) => item.status === 'critical');
  const lowItems = items.filter((item) => item.status === 'low');
  const expiredItems = items.filter((item) => item.status === 'expired');
  const expiringSoonItems = items.filter(
    (item) => item.daysUntilExpiry !== null && item.daysUntilExpiry > 0 && item.daysUntilExpiry <= 30
  );
  const attentionItems = items
    .filter(
      (item) =>
        item.status === 'expired' ||
        item.status === 'critical' ||
        item.status === 'low' ||
        (item.daysUntilExpiry !== null && item.daysUntilExpiry > 0 && item.daysUntilExpiry <= 30)
    )
    .sort((a, b) => {
      const aScore = a.status === 'expired' ? 0 : a.status === 'critical' ? 1 : a.status === 'low' ? 2 : 3;
      const bScore = b.status === 'expired' ? 0 : b.status === 'critical' ? 1 : b.status === 'low' ? 2 : 3;
      if (aScore !== bScore) return aScore - bScore;
      return (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999);
    })
    .slice(0, 5);
  const reorderSuggestions: InventoryReorderItem[] = items
    .map((item) => ({
      ...item,
      reorder: computeReorderSuggestion({
        currentStock: item.currentStock,
        minThreshold: item.minThreshold,
        unit: item.unit,
        status: item.status,
        daysUntilExpiry: item.daysUntilExpiry,
        avgDailyConsumption30d: item.avgDailyConsumption30d,
      }),
    }))
    .filter((item) => item.reorder.shouldReorder)
    .sort((a, b) => {
      const aRank = itemUrgencyRank(a.reorder.urgency);
      const bRank = itemUrgencyRank(b.reorder.urgency);
      if (aRank !== bRank) return aRank - bRank;
      return b.reorder.suggestedQuantity - a.reorder.suggestedQuantity;
    })
    .slice(0, 6);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        reference: form.reference.trim() || null,
        category: form.category,
        unit: form.unit,
        minThreshold: Number(form.minThreshold),
        currentStock: Number(form.currentStock || 0),
        storage: form.storage.trim() || null,
        supplier: form.supplier.trim() || null,
        notes: form.notes.trim() || null,
        kind: form.kind,
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        showNotification('error', error.error || 'Erreur lors de la création');
        return;
      }

      showNotification('success', 'Réactif créé');
      setShowCreate(false);
      setForm({
        name: '',
        reference: '',
        category: categories.find((category) => category.isActive)?.name || DEFAULT_INVENTORY_CATEGORIES[0].name,
        unit: 'mL',
        minThreshold: '',
        currentStock: '0',
        storage: '',
        supplier: '',
        notes: '',
        kind: 'REAGENT',
      });
      await loadItems();
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erreur lors de la création');
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] px-6 py-5 shadow-sm ring-1 ring-slate-900/5 md:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Inventaire des réactifs</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Vue d’ensemble des stocks, lots et seuils critiques.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/api/inventory?format=csv&mode=inventory"
              className="inline-flex h-11 items-center gap-2 rounded-md border bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              <Download className="h-4 w-4" />
              Export inventaire
            </Link>
            <Link
              href="/api/inventory?format=csv&mode=reorder"
              className="inline-flex h-11 items-center gap-2 rounded-md border bg-[var(--color-surface-muted)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              <Download className="h-4 w-4" />
              Export réappro.
            </Link>
            <div className="rounded-md border bg-[var(--color-surface-muted)] px-3 py-2 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Total</div>
              <div className="text-lg font-semibold text-[var(--color-text)]">{items.length}</div>
            </div>
            {role === 'ADMIN' && (
              <>
                <button onClick={() => setShowCategoryManager(true)} className="btn-secondary-md px-4">
                  <FolderCog className="h-4 w-4" />
                  Catégories
                </button>
                <button onClick={() => setShowCreate(true)} className="btn-primary-md px-4">
                  <Plus className="h-4 w-4" />
                  Ajouter un réactif
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="input-premium h-11 flex items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou catégorie"
            className="h-full w-full border-0 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: 'all', label: 'Tous', count: counts.all },
            { key: 'low', label: 'En alerte', count: counts.low },
            { key: 'critical', label: 'Stock critique', count: counts.critical },
            { key: 'expired', label: 'Expirés', count: counts.expired },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                filter === tab.key
                  ? 'border-blue-600/30 bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]'
              }`}
            >
              {tab.label}
              <span className="ml-2 rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      <InventorySummaryStats
        criticalCount={criticalItems.length}
        lowCount={lowItems.length}
        expiringSoonCount={expiringSoonItems.length}
        expiredCount={expiredItems.length}
      />

      {analytics && <InventoryAnalyticsPanel analytics={analytics} categories={categories} />}

      <InventoryAttentionPanel items={attentionItems} formatReason={formatAttentionReason} />

      <InventoryReorderPanel items={reorderSuggestions} />

      <InventoryItemsTable items={filtered} loading={loading} isAdmin={role === 'ADMIN'} onCreate={() => setShowCreate(true)} />

      <InventoryItemFormModal
        open={showCreate}
        title="Nouveau réactif"
        subtitle="Configurez les informations principales."
        submitLabel="Enregistrer"
        form={form}
        categories={categories}
        showInitialStock
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        onFormChange={setForm}
      />

      <InventoryCategoryManagerModal
        open={showCategoryManager}
        categoryDrafts={categoryDrafts}
        newCategoryName={newCategoryName}
        onClose={() => setShowCategoryManager(false)}
        onCategoryDraftsChange={setCategoryDrafts}
        onNewCategoryNameChange={setNewCategoryName}
        onSave={async () => {
          const cleaned = categoryDrafts
            .map((category, rank) => ({ ...category, name: category.name.trim(), rank }))
            .filter((category) => category.name);
          const res = await fetch('/api/inventory/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categories: cleaned }),
          });
          const data = await res.json();
          if (!res.ok) {
            showNotification('error', data.error || 'Erreur lors de la sauvegarde des catégories');
            return;
          }
          setCategories(data);
          setCategoryDrafts(data);
          setForm((prev) => ({
            ...prev,
            category: data.some((category: InventoryCategoryConfig) => category.name === prev.category)
              ? prev.category
              : data[0]?.name || prev.category,
          }));
          setShowCategoryManager(false);
          showNotification('success', 'Catégories inventaire mises à jour');
        }}
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}

function formatAttentionReason(item: InventoryItemSummary) {
  if (item.status === 'expired') {
    return 'Lot expiré à traiter immédiatement';
  }
  if (item.status === 'critical') {
    return `Rupture critique: ${item.currentStock} ${item.unit}`;
  }
  if (item.status === 'low') {
    return `Sous seuil: ${item.currentStock}/${item.minThreshold} ${item.unit}`;
  }
  if (item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30) {
    return `Expiration proche dans ${item.daysUntilExpiry} jour(s)`;
  }
  return 'Surveillance standard';
}

function itemUrgencyRank(urgency: 'normal' | 'warning' | 'critical') {
  if (urgency === 'critical') return 0;
  if (urgency === 'warning') return 1;
  return 2;
}
