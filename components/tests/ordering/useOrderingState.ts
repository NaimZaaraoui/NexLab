'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { buildCategoryTree, getChildCategories, getVisibleCategories } from './ordering-helpers';
import type { Category, ConfirmDialogState } from './types';

export function useOrderingState() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');
  const [newCategoryParent, setNewCategoryParent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    description: '',
    action: () => {},
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const testSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store', next: { revalidate: 0 } });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory((prev) => prev ?? data[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, [fetchCategories]);

  const updateOrder = async (model: 'category' | 'test', items: Array<{ id: string }>) => {
    setSaving(true);
    const updates = items.map((item, index) => ({ id: item.id, rank: index }));
    try {
      await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, updates }),
      });
    } catch (error) {
      console.error('Failed to save order', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) newSet.delete(categoryId);
      else newSet.add(categoryId);
      return newSet;
    });
  };

  const handleDragStartCategory = (event: DragStartEvent) => {
    setActiveCategoryId(event.active.id as string);
    setActiveDragWidth(event.active.rect.current.translated?.width ?? null);
  };

  const handleDragEndCategory = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCategoryId(null);
    setActiveDragWidth(null);

    if (active && over && active.id !== over.id) {
      const rootCats = buildCategoryTree(categories);
      const visibleCats = searchQuery
        ? filteredCategories
        : getVisibleCategories(rootCats, categories, expandedCategories);
      const oldIndex = visibleCats.findIndex((i) => i.id === active.id);
      const newIndex = visibleCats.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newVisibleOrder = arrayMove(visibleCats, oldIndex, newIndex).map((cat, index) => ({
          ...cat,
          rank: index,
        }));
        const visibleIds = new Set(newVisibleOrder.map((c) => c.id));
        const notVisible = categories.filter((c) => !visibleIds.has(c.id));
        const finalOrder = [...newVisibleOrder, ...notVisible];
        setCategories(finalOrder);
        updateOrder('category', finalOrder);
      }
    }
  };

  const handleDragStartTest = (event: DragStartEvent) => {
    setActiveTestId(event.active.id as string);
    setActiveDragWidth(event.active.rect.current.translated?.width ?? null);
  };

  const handleDragEndTest = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTestId(null);
    setActiveDragWidth(null);

    if (!selectedCategory || !active || !over || active.id === over.id) return;

    const oldIndex = selectedCategory.tests.findIndex((t) => t.id === active.id);
    const newIndex = selectedCategory.tests.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const updatedTests = arrayMove(selectedCategory.tests, oldIndex, newIndex).map((t, i) => ({ ...t, rank: i }));
      const newCategory = { ...selectedCategory, tests: updatedTests };
      setSelectedCategory(newCategory);
      setCategories((prev) => prev.map((c) => (c.id === newCategory.id ? newCategory : c)));
      updateOrder('test', updatedTests);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showNotification('error', 'Le nom de la catégorie est requis');
      return;
    }
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim(), icon: newCategoryIcon, parentId: newCategoryParent || null }),
      });
      if (res.ok) {
        showNotification('success', 'Catégorie créée avec succès');
        setShowCreateModal(false);
        setNewCategoryName('');
        setNewCategoryIcon('Folder');
        setNewCategoryParent('');
        fetchCategories();
      } else {
        const error = await res.json();
        showNotification('error', error.error || 'Erreur lors de la création');
      }
    } catch {
      showNotification('error', 'Erreur lors de la création');
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      showNotification('error', 'Le nom de la catégorie est requis');
      return;
    }
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
          parentId: newCategoryParent || null,
        }),
      });
      if (res.ok) {
        showNotification('success', 'Catégorie modifiée avec succès');
        setShowEditModal(false);
        setEditingCategory(null);
        setNewCategoryName('');
        setNewCategoryIcon('Folder');
        setNewCategoryParent('');
        fetchCategories();
      } else {
        const error = await res.json();
        showNotification('error', error.error || 'Erreur lors de la modification');
      }
    } catch {
      showNotification('error', 'Erreur lors de la modification');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      const res = await fetch(`/api/categories?id=${category.id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Catégorie supprimée avec succès');
        if (selectedCategory?.id === category.id) setSelectedCategory(null);
        fetchCategories();
      } else {
        const error = await res.json();
        showNotification('error', error.error || 'Erreur lors de la suppression');
      }
    } catch {
      showNotification('error', 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryIcon(category.icon || 'Folder');
    setNewCategoryParent(category.parentId || '');
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryIcon('Folder');
    setNewCategoryParent('');
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/api/categories/reset', { method: 'POST' });
      if (res.ok) {
        showNotification('success', 'Ordre réinitialisé avec succès');
        await fetchCategories();
      } else {
        showNotification('error', 'Erreur lors de la réinitialisation');
      }
    } catch {
      showNotification('error', 'Erreur lors de la réinitialisation');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTests =
    selectedCategory?.tests?.filter(
      (test) =>
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const rootCategories = buildCategoryTree(searchQuery ? filteredCategories : categories);
  const visibleCategories = searchQuery
    ? filteredCategories
    : getVisibleCategories(rootCategories, categories, expandedCategories);

  return {
    categories,
    mounted,
    selectedCategory,
    loading,
    saving,
    searchQuery,
    showCreateModal,
    showEditModal,
    editingCategory,
    newCategoryName,
    newCategoryIcon,
    newCategoryParent,
    expandedCategories,
    activeCategoryId,
    activeTestId,
    activeDragWidth,
    confirmDialog,
    notification,
    filteredCategories,
    filteredTests,
    visibleCategories,
    categorySensors,
    testSensors,
    setSelectedCategory,
    setSearchQuery,
    setShowCreateModal,
    setNewCategoryName,
    setNewCategoryIcon,
    setNewCategoryParent,
    setConfirmDialog,
    toggleExpanded,
    openEditModal,
    closeModal,
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleDragStartCategory,
    handleDragEndCategory,
    handleDragStartTest,
    handleDragEndTest,
    handleReset,
  };
}
