'use client';

import { useState, useCallback } from 'react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { NotificationToast } from '@/components/ui/notification-toast';
import { TestCatalogToolbar } from '@/components/tests/TestCatalogToolbar';
import { TestCatalogTable } from '@/components/tests/TestCatalogTable';
import { TestEditorModal } from '@/components/tests/TestEditorModal';
import { TestInventoryRulesModal } from '@/components/tests/TestInventoryRulesModal';
import { ImportTestsModal } from '@/components/tests/ImportTestsModal';
import { exportTestsAction } from '@/app/actions/export-tests';
import { createTestAction, deleteTestAction, deleteInventoryRuleAction, getInventoryRules, updateTestAction } from '@/app/actions/tests';
import * as XLSX from 'xlsx';
import type { CategoryOption, InventoryItemOption, InventoryRule, TestFormState, TestWithInventory, TestsLabSettings } from '@/components/tests/types';
import { EMPTY_TEST_FORM, EMPTY_INVENTORY_FORM } from '@/components/tests/types';

export function TestsList({
  filteredTests,
  allTests,
  categories,
  categoriesPresent,
  labSettings,
  searchTerm,
  selectedCategory,
  onSearchTermChange,
  onSelectedCategoryChange,
}: {
  filteredTests: TestWithInventory[];
  allTests: TestWithInventory[];
  categories: CategoryOption[];
  categoriesPresent: CategoryOption[];
  labSettings: TestsLabSettings;
  searchTerm: string;
  selectedCategory: string;
  onSearchTermChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const data = await exportTestsAction();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const cols = Object.keys(data[0] || {}).map((key) => ({ wch: Math.max(key.length, 15) }));
      worksheet['!cols'] = cols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analyses');
      XLSX.writeFile(workbook, 'Export_Analyses_NexLab.xlsx');
    } catch (error) {
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [newTest, setNewTest] = useState<TestFormState>(EMPTY_TEST_FORM);
  const [isSexBased, setIsSexBased] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ isOpen: false, title: '', message: '', action: () => {} });

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryTest, setInventoryTest] = useState<TestWithInventory | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [inventoryRules, setInventoryRules] = useState<InventoryRule[]>([]);
  const [inventoryForm, setInventoryForm] = useState(EMPTY_INVENTORY_FORM);
  const [editingInventoryRuleId, setEditingInventoryRuleId] = useState<string | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleEdit = useCallback((test: TestWithInventory) => {
    setEditingTestId(test.id);
    setNewTest({
      code: test.code,
      loincCode: test.loincCode || '',
      name: test.name,
      unit: test.unit || '',
      minValue: test.minValue?.toString() || '',
      maxValue: test.maxValue?.toString() || '',
      minValueM: test.minValueM?.toString() || '',
      maxValueM: test.maxValueM?.toString() || '',
      minValueF: test.minValueF?.toString() || '',
      maxValueF: test.maxValueF?.toString() || '',
      decimals: test.decimals?.toString() || '1',
      resultType: test.resultType || 'numeric',
      formula: test.resultType === 'calculated' ? (test.options || '') : '',
      categoryId: test.categoryId || '',
      parentId: test.parentId || '',
      options: test.options || '',
      isGroup: test.isGroup,
      isOptional: test.isOptional ?? false,
      sampleType: test.sampleType || '',
      sampleContainer: test.sampleContainer || '',
      price: test.price?.toString() || '0',
    });
    setIsSexBased(!!(test.minValueM || test.maxValueM || test.minValueF || test.maxValueF));
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingTestId(null);
    setIsSexBased(false);
    setNewTest(EMPTY_TEST_FORM);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTest.code || !newTest.name) {
      showNotification('error', 'Code et nom sont obligatoires');
      return;
    }

    const result = editingTestId
      ? await updateTestAction({ ...newTest, id: editingTestId } as unknown as Parameters<typeof updateTestAction>[0])
      : await createTestAction(newTest as unknown as Parameters<typeof createTestAction>[0]);

    if (result && 'success' in result && result.success) {
      showNotification('success', editingTestId ? 'Test modifié' : 'Test ajouté');
      handleCloseForm();
    } else if (result && 'error' in result) {
      showNotification('error', result.error || 'Erreur serveur');
    }
  }, [newTest, editingTestId, showNotification, handleCloseForm]);

  const handleDelete = useCallback((test: TestWithInventory) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer le test ?',
      message: `Êtes-vous sûr de vouloir supprimer "${test.name}" ? Cette action est irréversible.`,
      action: async () => {
        const result = await deleteTestAction(test.id);
        if (result && 'success' in result && result.success) {
          showNotification('success', 'Test supprimé');
        } else {
          showNotification('error', 'Erreur lors de la suppression');
        }
        setConfirmDialog({ isOpen: false, title: '', message: '', action: () => {} });
      },
    });
  }, [showNotification]);

  const openInventoryModal = useCallback(async (test: TestWithInventory) => {
    setInventoryTest(test);
    setShowInventoryModal(true);
    setInventoryLoading(true);
    setEditingInventoryRuleId(null);

    const data = await getInventoryRules(test.id);
    setInventoryItems(data.items as unknown as InventoryItemOption[]);
    setInventoryRules(data.rules as unknown as InventoryRule[]);
    setInventoryForm({ itemId: data.items?.[0]?.id || '', quantityPerTest: '' });
    setInventoryLoading(false);
  }, []);

  const closeInventoryModal = useCallback(() => {
    setShowInventoryModal(false);
    setInventoryTest(null);
    setInventoryItems([]);
    setInventoryRules([]);
    setInventoryForm(EMPTY_INVENTORY_FORM);
    setEditingInventoryRuleId(null);
    setInventoryLoading(false);
  }, []);

  const handleInventoryRuleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryTest) return;

    const isEditing = Boolean(editingInventoryRuleId);
    try {
      const url = isEditing
        ? `/api/inventory/rules/${editingInventoryRuleId}`
        : `/api/tests/${inventoryTest.id}/inventory`;
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? {} : { itemId: inventoryForm.itemId }),
          quantityPerTest: Number(inventoryForm.quantityPerTest),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Erreur lors de la sauvegarde');
        return;
      }
      showNotification('success', isEditing ? 'Règle de consommation modifiée' : 'Règle de consommation enregistrée');
      const refreshed = await getInventoryRules(inventoryTest.id);
      setInventoryItems(refreshed.items as unknown as InventoryItemOption[]);
      setInventoryRules(refreshed.rules as unknown as InventoryRule[]);
      setInventoryForm({ itemId: refreshed.items?.[0]?.id || '', quantityPerTest: '' });
      setEditingInventoryRuleId(null);
    } catch {
      showNotification('error', 'Erreur lors de la sauvegarde');
    }
  }, [inventoryTest, editingInventoryRuleId, inventoryForm, showNotification]);

  const handleInventoryRuleDelete = useCallback(async (ruleId: string) => {
    if (!inventoryTest) return;
    const result = await deleteInventoryRuleAction(ruleId);
    if (result && 'success' in result && result.success) {
      showNotification('success', 'Règle supprimée');
      const refreshed = await getInventoryRules(inventoryTest.id);
      setInventoryItems(refreshed.items as unknown as InventoryItemOption[]);
      setInventoryRules(refreshed.rules as unknown as InventoryRule[]);
    } else {
      showNotification('error', 'Erreur lors de la suppression');
    }
  }, [inventoryTest, showNotification]);

  const handleInventoryRuleEdit = useCallback((rule: InventoryRule) => {
    setEditingInventoryRuleId(rule.id);
    setInventoryForm({ itemId: rule.item.id, quantityPerTest: String(rule.quantityPerTest) });
  }, []);

  const cancelInventoryRuleEdit = useCallback(() => {
    setEditingInventoryRuleId(null);
    setInventoryForm((prev) => ({ ...prev, quantityPerTest: '' }));
  }, []);

  if (categoriesPresent.length === 0) {
    return (
      <div className="bento-panel py-24 text-center flex flex-col items-center opacity-80">
        <div className="w-16 h-16 bg-[var(--color-surface-muted)] text-slate-300 rounded-2xl flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2v8L8 14c0 1 1 3 3 3h2c2 0 2-2 2-2l-2-8V2" />
            <path d="M8.5 2h7" />
            <path d="M7 16h10" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Aucun test trouve</h3>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TestCatalogToolbar
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        categories={categories}
        onSearchTermChange={onSearchTermChange}
        onSelectedCategoryChange={onSelectedCategoryChange}
        onCreateTest={() => setShowForm(true)}
        onImportTests={() => setShowImportModal(true)}
        onExportTests={handleExport}
        isExporting={isExporting}
      />

      <TestCatalogTable
        categoriesPresent={categoriesPresent}
        filteredTests={filteredTests}
        allTests={allTests}
        labSettings={labSettings}
        onOpenInventory={openInventoryModal}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TestEditorModal
        open={showForm}
        editingTestId={editingTestId}
        form={newTest}
        isSexBased={isSexBased}
        categories={categories}
        tests={allTests}
        labSettings={labSettings}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        onFormChange={setNewTest}
        onSexBasedChange={setIsSexBased}
      />

      <ImportTestsModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
        }}
      />

      <TestInventoryRulesModal
        open={showInventoryModal}
        loading={inventoryLoading}
        test={inventoryTest}
        items={inventoryItems}
        rules={inventoryRules}
        form={inventoryForm}
        editingRuleId={editingInventoryRuleId}
        onClose={closeInventoryModal}
        onFormChange={setInventoryForm}
        onSubmit={handleInventoryRuleSubmit}
        onEditRule={handleInventoryRuleEdit}
        onDeleteRule={handleInventoryRuleDelete}
        onCancelEdit={cancelInventoryRuleEdit}
      />

      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
