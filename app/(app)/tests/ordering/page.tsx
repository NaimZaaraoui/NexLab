'use client';

import { Loader2, PlusCircle, RotateCcw, Save, Search } from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageBackLink } from '@/components/ui/PageBackLink';
import { CategoryListPanel } from '@/components/tests/ordering/CategoryListPanel';
import { TestListPanel } from '@/components/tests/ordering/TestListPanel';
import { CategoryFormModal } from '@/components/tests/ordering/CategoryFormModal';
import { useOrderingState } from '@/components/tests/ordering/useOrderingState';

export default function OrderingPage() {
  const {
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
  } = useOrderingState();

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="bento-panel p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageBackLink href="/tests" className="mb-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] tracking-tight">
              Organisation du Laboratoire
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Réorganisez l&apos;ordre d&apos;affichage par glisser-déposer.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saving && (
            <span className="text-sm font-medium text-[var(--color-accent)] animate-pulse flex items-center gap-2">
              <Save size={14} /> Sauvegarde...
            </span>
          )}
          <button
            onClick={() =>
              setConfirmDialog({
                open: true,
                title: "Réinitialiser l'ordre",
                description: "Êtes-vous sûr de vouloir réinitialiser l'ordre par défaut ? Cette action est irréversible.",
                action: handleReset,
              })
            }
            className="btn-secondary h-11 text-sm text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100"
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary-md text-sm">
            <PlusCircle size={16} />
            Nouvelle Catégorie
          </button>
        </div>
      </div>

      <div className="relative bento-panel p-4">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]" size={18} />
        <input
          type="text"
          placeholder="Rechercher une catégorie ou un test..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-premium h-11 pl-12"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <CategoryListPanel
          visibleCategories={visibleCategories}
          categories={categories}
          selectedCategory={selectedCategory}
          expandedCategories={expandedCategories}
          activeCategoryId={activeCategoryId}
          activeDragWidth={activeDragWidth}
          sensors={categorySensors}
          searchQuery={searchQuery}
          onSelectCategory={setSelectedCategory}
          onToggleExpanded={toggleExpanded}
          onOpenEditModal={openEditModal}
          onDeleteRequest={(cat) => {
            setConfirmDialog({
              open: true,
              title: 'Supprimer la catégorie',
              description: `Êtes-vous sûr de vouloir supprimer "${cat.name}" ? Si elle contient des tests, déplacez-les ou supprimez-les d'abord.`,
              action: () => {
                handleDeleteCategory(cat);
                setConfirmDialog({ open: false, title: '', description: '', action: () => {} });
              },
            });
          }}
          onDragStart={handleDragStartCategory}
          onDragEnd={handleDragEndCategory}
        />

        <TestListPanel
          selectedCategory={selectedCategory}
          filteredTests={filteredTests}
          activeTestId={activeTestId}
          activeDragWidth={activeDragWidth}
          sensors={testSensors}
          searchQuery={searchQuery}
          onDragStart={handleDragStartTest}
          onDragEnd={handleDragEndTest}
        />
      </div>

      <CategoryFormModal
        mounted={mounted}
        showCreateModal={showCreateModal}
        showEditModal={showEditModal}
        editingCategory={editingCategory}
        newCategoryName={newCategoryName}
        newCategoryIcon={newCategoryIcon}
        newCategoryParent={newCategoryParent}
        categories={categories}
        onNameChange={setNewCategoryName}
        onIconChange={setNewCategoryIcon}
        onParentChange={setNewCategoryParent}
        onClose={closeModal}
        onSubmit={showEditModal ? handleEditCategory : handleCreateCategory}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        confirmLabel="Confirmer"
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
