'use client';

import { RefreshCw } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { NotificationToast } from '@/components/ui/notification-toast';
import { TestCatalogToolbar } from '@/components/tests/TestCatalogToolbar';
import { TestCatalogTable } from '@/components/tests/TestCatalogTable';
import { TestEditorModal } from '@/components/tests/TestEditorModal';
import { TestInventoryRulesModal } from '@/components/tests/TestInventoryRulesModal';
import { ImportTestsModal } from '@/components/tests/ImportTestsModal';
import { useTestCatalog } from '@/components/tests/useTestCatalog';
import { exportTestsAction } from '@/app/actions/export-tests';
import * as XLSX from 'xlsx';
import { useState } from 'react';

export function TestsList() {
  const catalog = useTestCatalog();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportTestsAction();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const cols = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
      worksheet['!cols'] = cols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analyses');
      XLSX.writeFile(workbook, 'Export_Analyses_NexLab.xlsx');
      
      if (catalog.setNotification) {
        catalog.setNotification({ type: 'success', message: 'Exportation réussie.' });
        setTimeout(() => catalog.setNotification(null), 3000);
      }
    } catch (error) {
      console.error(error);
      if (catalog.setNotification) {
        catalog.setNotification({ type: 'error', message: 'Erreur lors de l\'exportation.' });
        setTimeout(() => catalog.setNotification(null), 3000);
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (catalog.loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500 gap-4">
        <RefreshCw size={48} className="animate-spin text-indigo-500" />
        <p className="font-black uppercase tracking-[0.08em] text-xs">Chargement du catalogue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <TestCatalogToolbar
        searchTerm={catalog.searchTerm}
        selectedCategory={catalog.selectedCategory}
        categories={catalog.categories}
        onSearchTermChange={catalog.setSearchTerm}
        onSelectedCategoryChange={catalog.setSelectedCategory}
        onCreateTest={() => catalog.setShowForm(true)}
        onImportTests={() => catalog.setShowImportModal(true)}
        onExportTests={handleExport}
        isExporting={isExporting}
      />

      <TestCatalogTable
        categoriesPresent={catalog.categoriesPresent}
        filteredTests={catalog.filteredTests}
        allTests={catalog.tests}
        labSettings={catalog.labSettings}
        onOpenInventory={catalog.openInventoryModal}
        onEdit={catalog.handleEdit}
        onDelete={catalog.handleDelete}
      />

      <TestEditorModal
        open={catalog.showForm}
        editingTestId={catalog.editingTestId}
        form={catalog.newTest}
        isSexBased={catalog.isSexBased}
        categories={catalog.categories}
        tests={catalog.tests}
        labSettings={catalog.labSettings}
        onClose={catalog.handleCloseForm}
        onSubmit={catalog.handleSubmit}
        onFormChange={catalog.setNewTest}
        onSexBasedChange={catalog.setIsSexBased}
      />

      <ImportTestsModal
        open={catalog.showImportModal}
        onClose={() => catalog.setShowImportModal(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <TestInventoryRulesModal
        open={catalog.showInventoryModal}
        loading={catalog.inventoryLoading}
        test={catalog.inventoryTest}
        items={catalog.inventoryItems}
        rules={catalog.inventoryRules}
        form={catalog.inventoryForm}
        editingRuleId={catalog.editingInventoryRuleId}
        onClose={catalog.closeInventoryModal}
        onFormChange={catalog.setInventoryForm}
        onSubmit={catalog.handleInventoryRuleSubmit}
        onEditRule={catalog.handleInventoryRuleEdit}
        onDeleteRule={catalog.handleInventoryRuleDelete}
        onCancelEdit={catalog.cancelInventoryRuleEdit}
      />

      <ConfirmationModal
        isOpen={catalog.confirmModal.isOpen}
        onClose={() => catalog.setConfirmModal({ ...catalog.confirmModal, isOpen: false })}
        onConfirm={catalog.confirmModal.action}
        title={catalog.confirmModal.title} message={catalog.confirmModal.message} type={catalog.confirmModal.type} icon={catalog.confirmModal.icon}
      />

      {catalog.notification && <NotificationToast type={catalog.notification.type} message={catalog.notification.message} />}
    </div>
  );
}
