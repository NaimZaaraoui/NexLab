'use client';

import { FileSearch } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useSession } from 'next-auth/react';
import { useAnalysesList, ITEMS_PER_PAGE_OPTIONS } from './useAnalysesList';
import { AnalysesFiltersBar } from './AnalysesFiltersBar';
import { AnalysisTableRow } from './AnalysisTableRow';

export function AnalysesList() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? 'TECHNICIEN';

  const {
    loading,
    searchValue,
    setSearchValue,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    customDate,
    setCustomDate,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    tatThresholds,
    currencyUnit,
    filteredAnalyses,
    paginatedAnalyses,
    totalPages,
    deletingId,
    sendingEmailId,
    confirmDialog,
    setConfirmDialog,
    handleDeleteRequest,
    handleConfirmDelete,
    handlePrintRequest,
    handleEmailRequest,
  } = useAnalysesList();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-line h-14" />
        <div className="skeleton-card h-[480px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnalysesFiltersBar
        role={role}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        customDate={customDate}
        setCustomDate={setCustomDate}
      />

      <section className="overflow-hidden rounded-xl border bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        {filteredAnalyses.length === 0 ? (
          <div className="empty-state mx-4 my-6">
            <div className="empty-state-icon">
              <FileSearch className="h-6 w-6 text-[var(--color-text-soft)]" />
            </div>
            <p className="empty-state-title">Aucun dossier trouvé</p>
            <p className="empty-state-text">
              Ajustez les filtres ou la période pour afficher des analyses.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-12 border-b bg-[var(--color-surface-muted)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)] lg:grid">
              <div className="col-span-1 text-center">ID</div>
              <div className="col-span-4">Patient</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-center">TAT</div>
              <div className="col-span-1 text-center truncate" title="Commande">Cmd</div>
              <div className="col-span-1 text-center">Statut</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y">
              {paginatedAnalyses.map((analysis) => (
                <AnalysisTableRow
                  key={analysis.id}
                  analysis={analysis}
                  currencyUnit={currencyUnit}
                  tatThresholds={tatThresholds}
                  deletingId={deletingId}
                  sendingEmailId={sendingEmailId}
                  onDeleteRequest={handleDeleteRequest}
                  onPrintRequest={handlePrintRequest}
                  onEmailRequest={handleEmailRequest}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor="items-per-page" className="text-sm text-[var(--color-text-soft)]">
                  Lignes par page
                </label>
                <select
                  id="items-per-page"
                  value={itemsPerPage}
                  onChange={(event) => setItemsPerPage(Number(event.target.value))}
                  className="input-premium h-10 w-[92px] rounded-md px-3"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((current) => ({ ...current, open }))}
        title="Supprimer l'analyse"
        description="Êtes-vous sûr de vouloir supprimer cette analyse ? Cette action est irréversible."
        onConfirm={handleConfirmDelete}
        confirmLabel="Supprimer quand même"
        variant="destructive"
      />
    </div>
  );
}
