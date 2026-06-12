import { useState, useEffect, useCallback } from 'react';
import { Test } from '@/lib/types';
import { toLabDisplaySettings } from '@/lib/settings-schema';
import { validateFormula } from '@/lib/calculated-tests';
import {
  DEFAULT_TESTS_LAB_SETTINGS,
  EMPTY_INVENTORY_FORM,
  EMPTY_TEST_FORM,
  type CategoryOption,
  type InventoryItemOption,
  type InventoryRule,
  type TestFormState,
  type TestWithInventory,
  type TestsLabSettings,
} from '@/components/tests/types';

export function useTestCatalog() {
  const [tests, setTests] = useState<TestWithInventory[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [isSexBased, setIsSexBased] = useState(false);
  
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

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryTest, setInventoryTest] = useState<Test | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [inventoryRules, setInventoryRules] = useState<InventoryRule[]>([]);
  const [inventoryForm, setInventoryForm] = useState(EMPTY_INVENTORY_FORM);
  const [editingInventoryRuleId, setEditingInventoryRuleId] = useState<string | null>(null);
  const [labSettings, setLabSettings] = useState<TestsLabSettings>(DEFAULT_TESTS_LAB_SETTINGS);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const readResponseErrorMessage = useCallback(async (response: Response, fallback: string) => {
    const bodyText = await response.text();
    try {
      const parsed = JSON.parse(bodyText) as { error?: string; details?: string };
      return parsed.details || parsed.error || fallback;
    } catch {
      return bodyText || fallback;
    }
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setLabSettings(toLabDisplaySettings(data));
        }
      })
      .catch(console.error);
  }, []);
  
  const [newTest, setNewTest] = useState<TestFormState>(EMPTY_TEST_FORM);

  const loadTests = useCallback(async () => {
    try {
      const response = await fetch('/api/tests');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setTests(data);
    } catch {
      showNotification('error', 'Erreur lors du chargement des tests');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      showNotification('error', 'Erreur lors du chargement des catégories');
    }
  }, [showNotification]);

  useEffect(() => {
    loadTests();
    loadCategories();
  }, [loadCategories, loadTests]);

  const handleEdit = (test: Test) => {
    setEditingTestId(test.id);
    setNewTest({
      code: test.code,
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
      price: test.price?.toString() || '0'
    });
    setIsSexBased(!!(test.minValueM || test.maxValueM || test.minValueF || test.maxValueF));
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTestId(null);
    setIsSexBased(false);
    setNewTest(EMPTY_TEST_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTest.code || !newTest.name) {
      showNotification('error', 'Code et nom sont obligatoires');
      return;
    }

    if (newTest.resultType === 'calculated') {
      const validation = validateFormula(
        newTest.formula,
        tests.filter((test) => test.id !== editingTestId),
        newTest.code
      );

      if (!validation.valid) {
        showNotification('error', validation.error || 'Formule invalide');
        return;
      }
    }

    const payload = {
      ...newTest,
      minValue: (newTest.resultType === 'numeric' || newTest.resultType === 'calculated') && newTest.minValue ? parseFloat(newTest.minValue) : null,
      maxValue: (newTest.resultType === 'numeric' || newTest.resultType === 'calculated') && newTest.maxValue ? parseFloat(newTest.maxValue) : null,
      minValueM: (newTest.resultType === 'numeric' || newTest.resultType === 'calculated') && isSexBased && newTest.minValueM ? parseFloat(newTest.minValueM) : null,
      maxValueM: (newTest.resultType === 'numeric' || newTest.resultType === 'calculated') && isSexBased && newTest.maxValueM ? parseFloat(newTest.maxValueM) : null,
      minValueF: (newTest.resultType === 'numeric' || newTest.resultType === 'calculated') && isSexBased && newTest.minValueF ? parseFloat(newTest.minValueF) : null,
      maxValueF: (newTest.resultType === 'numeric' || newTest.resultType === 'calculated') && isSexBased && newTest.maxValueF ? parseFloat(newTest.maxValueF) : null,
      decimals: newTest.resultType === 'numeric' || newTest.resultType === 'calculated' ? parseInt(newTest.decimals) : 1,
      options: newTest.resultType === 'dropdown'
        ? newTest.options
        : newTest.resultType === 'calculated'
          ? newTest.formula.trim()
          : '',
    };

    try {
      const url = '/api/tests';
      const method = editingTestId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTestId ? { id: editingTestId, ...payload } : payload)
      });

      if (!response.ok) {
        showNotification('error', await readResponseErrorMessage(response, 'Erreur lors de l\'enregistrement'));
        return;
      }

      await response.json();
      await loadTests();
      if (editingTestId) {
        showNotification('success', 'Test modifié');
      } else {
        showNotification('success', 'Test ajouté');
      }
      handleCloseForm();
    } catch {
       showNotification('error', 'Erreur serveur');
    }
  };

  const handleDelete = (test: Test) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      icon: 'warning',
      title: 'Supprimer le test ?',
      message: `Êtes-vous sûr de vouloir supprimer "${test.name}" ? Cette action est irréversible.`,
      action: async () => {
        try {
          const res = await fetch(`/api/tests?id=${test.id}`, { method: 'DELETE' });
          if (res.ok) {
            setTests(tests.filter(t => t.id !== test.id));
            showNotification('success', 'Test supprimé');
          } else {
            showNotification('error', 'Erreur lors de la suppression');
          }
        } catch {
          showNotification('error', 'Erreur lors de la suppression');
        }
      }
    });
  };

  const openInventoryModal = async (test: Test) => {
    setInventoryTest(test);
    setShowInventoryModal(true);
    setInventoryLoading(true);
    setEditingInventoryRuleId(null);

    try {
      const res = await fetch(`/api/tests/${test.id}/inventory`, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        showNotification('error', data.error || 'Erreur lors du chargement des consommations');
        return;
      }

      setInventoryItems(Array.isArray(data.items) ? data.items : []);
      setInventoryRules(Array.isArray(data.rules) ? data.rules : []);
      setInventoryForm({
        itemId: data.items?.[0]?.id || '',
        quantityPerTest: '',
      });
    } catch {
      showNotification('error', 'Erreur lors du chargement des consommations');
    } finally {
      setInventoryLoading(false);
    }
  };

  const closeInventoryModal = () => {
    setShowInventoryModal(false);
    setInventoryTest(null);
    setInventoryItems([]);
    setInventoryRules([]);
    setInventoryForm(EMPTY_INVENTORY_FORM);
    setEditingInventoryRuleId(null);
    setInventoryLoading(false);
  };

  const handleInventoryRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryTest) return;

    try {
      const isEditing = Boolean(editingInventoryRuleId);
      const res = await fetch(
        isEditing ? `/api/inventory/rules/${editingInventoryRuleId}` : `/api/tests/${inventoryTest.id}/inventory`,
        {
        method: isEditing ? 'PATCH' : 'POST',
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
      await openInventoryModal(inventoryTest);
      setInventoryForm((prev) => ({ ...prev, quantityPerTest: '' }));
      setEditingInventoryRuleId(null);
    } catch {
      showNotification('error', 'Erreur lors de la sauvegarde');
    }
  };

  const handleInventoryRuleDelete = async (ruleId: string) => {
    if (!inventoryTest) return;

    try {
      const res = await fetch(`/api/inventory/rules/${ruleId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        showNotification('error', data.error || 'Erreur lors de la suppression');
        return;
      }

      showNotification('success', 'Règle supprimée');
      await openInventoryModal(inventoryTest);
    } catch {
      showNotification('error', 'Erreur lors de la suppression');
    }
  };

  const handleInventoryRuleEdit = (rule: InventoryRule) => {
    setEditingInventoryRuleId(rule.id);
    setInventoryForm({
      itemId: rule.item.id,
      quantityPerTest: String(rule.quantityPerTest),
    });
  };

  const cancelInventoryRuleEdit = () => {
    setEditingInventoryRuleId(null);
    setInventoryForm((prev) => ({
      ...prev,
      quantityPerTest: '',
    }));
  };

  const filteredTests = tests.filter(test =>
    (test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     test.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === 'all' || test.categoryId === selectedCategory)
  );

  const visibleCategoryMap = new Map<string, { name: string; rank: number; icon?: string | null }>();
  filteredTests.forEach((test) => {
    const categoryId = test.categoryId || 'uncategorized';
    const categoryName = test.categoryRel?.name || 'Divers';
    const categoryRank = test.categoryRel?.rank ?? 9999;
    const categoryIcon = test.categoryRel?.icon || null;

    if (!visibleCategoryMap.has(categoryId)) {
      visibleCategoryMap.set(categoryId, {
        name: categoryName,
        rank: categoryRank,
        icon: categoryIcon,
      });
    }
  });

  const categoriesPresent = Array.from(visibleCategoryMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.name.localeCompare(b.name)));

  return {
    tests,
    categories,
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showForm,
    setShowForm,
    showImportModal,
    setShowImportModal,
    editingTestId,
    isSexBased,
    setIsSexBased,
    confirmModal,
    setConfirmModal,
    notification,
    setNotification,
    showInventoryModal,
    inventoryLoading,
    inventoryTest,
    inventoryItems,
    inventoryRules,
    inventoryForm,
    setInventoryForm,
    editingInventoryRuleId,
    labSettings,
    newTest,
    setNewTest,
    filteredTests,
    categoriesPresent,
    handleEdit,
    handleCloseForm,
    handleSubmit,
    handleDelete,
    openInventoryModal,
    closeInventoryModal,
    handleInventoryRuleSubmit,
    handleInventoryRuleDelete,
    handleInventoryRuleEdit,
    cancelInventoryRuleEdit,
  };
}
