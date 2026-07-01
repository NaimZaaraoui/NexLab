'use client';

import { ArrowLeft, Edit3, Trash2, PowerOff, Power } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { NotificationToast } from '@/components/ui/notification-toast';
import { PageBackLink } from '@/components/ui/PageBackLink';
import { InventoryInfoCard } from '@/components/inventory/InventoryInfoCard';
import { InventoryItemFormModal } from '@/components/inventory/InventoryItemFormModal';
import { InventoryLotsPanel } from '@/components/inventory/InventoryLotsPanel';
import { InventoryMovementsPanel } from '@/components/inventory/InventoryMovementsPanel';
import { InventoryRulesPanel } from '@/components/inventory/InventoryRulesPanel';
import { InventorySidebar } from '@/components/inventory/InventorySidebar';
import { useInventoryItem } from '@/components/inventory/useInventoryItem';
import { InventoryReceiveModal } from '@/components/inventory/modals/InventoryReceiveModal';
import { InventoryConsumeModal } from '@/components/inventory/modals/InventoryConsumeModal';
import { InventoryAdjustModal } from '@/components/inventory/modals/InventoryAdjustModal';
import { InventoryWasteModal } from '@/components/inventory/modals/InventoryWasteModal';
import { InventoryRuleModal } from '@/components/inventory/modals/InventoryRuleModal';

export default function InventoryDetailPage() {
  const params = useParams<{ id: string }>();
  const itemId = params?.id;

  const {
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
    receiveForm, setReceiveForm,
  } = useInventoryItem(itemId);

  const hasHistory = item
    ? (item.movements?.length ?? 0) > 0
    : false;

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-4 pb-16">
        <div className="skeleton-card h-28" />
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
          <div className="skeleton-card h-[480px]" />
          <div className="skeleton-card h-[380px]" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Article introuvable</div>
        <div className="empty-state-text">Le réactif demandé n’existe pas ou n’est plus accessible.</div>
        <Link href="/dashboard/inventory" className="btn-secondary-sm mt-4">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>
    );
  }

  const ratio = item.minThreshold > 0 ? Math.min((item.currentStock / item.minThreshold) * 100, 100) : 0;
  const statusLabel = item.status === 'expired' ? 'Périmé' : item.status === 'critical' ? 'Stock critique' : item.status === 'low' ? 'Stock faible' : 'Conforme';
  const statusClass = item.status === 'expired' || item.status === 'critical' ? 'status-pill-error' : item.status === 'low' ? 'status-pill-warning' : 'status-pill-success';

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      {item && !item.isActive && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <PowerOff className="h-4 w-4 shrink-0 text-amber-500" />
          <span>Cet article est <strong>désactivé</strong>. Il n&apos;apparaît plus dans les sélecteurs et ne peut plus être consommé. L&apos;historique est conservé.</span>
        </div>
      )}
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <PageBackLink href="/dashboard/inventory" />
            <h1 className="text-xl font-semibold text-[var(--color-text)]">{item.name}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'} · {item.category}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
            {isAdmin && (
              <>
                <button onClick={() => setShowEdit(true)} className="btn-secondary-sm">
                  <Edit3 className="h-4 w-4" />
                  Modifier
                </button>

                {hasHistory ? (
                  <button
                    onClick={handleToggleActive}
                    className={`btn-secondary-sm ${
                      item.isActive
                        ? 'text-amber-600 hover:border-amber-300 hover:bg-amber-50'
                        : 'text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    {item.isActive ? (
                      <><PowerOff className="h-4 w-4" />Désactiver</>
                    ) : (
                      <><Power className="h-4 w-4" />Réactiver</>
                    )}
                  </button>
                ) : (
                  showDeleteConfirm ? (
                    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs">
                      <span className="font-medium text-rose-700">Supprimer définitivement ?</span>
                      <button
                        onClick={handleDelete}
                        className="rounded bg-rose-600 px-2 py-0.5 font-semibold text-white hover:bg-rose-700"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn-secondary-sm text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
        <div className="space-y-4">
          <article className="bento-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                Informations
              </h2>
              <div className="flex flex-wrap gap-2 text-xs">
                {item.storage && <span className="status-pill status-pill-info">{item.storage}</span>}
                <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InventoryInfoCard label="Référence" value={item.reference || '—'} />
              <InventoryInfoCard label="Fournisseur" value={item.supplier || '—'} />
              <InventoryInfoCard label="Unité" value={item.unit} />
              <InventoryInfoCard label="Seuil minimum" value={`${item.minThreshold}`} />
              <InventoryInfoCard label="Type" value={item.kind === 'CONSUMABLE' ? 'Consommable' : 'Réactif'} />
              <InventoryInfoCard label="Remarques" value={item.notes || '—'} />
            </div>
          </article>

          <InventoryLotsPanel item={item} />
          <InventoryRulesPanel item={item} isAdmin={isAdmin} onAdd={() => setShowRule(true)} onDelete={handleRuleDelete} />
          <InventoryMovementsPanel item={item} />
        </div>

        <InventorySidebar
          item={item}
          statusClass={statusClass}
          statusLabel={statusLabel}
          ratio={ratio}
          canWrite={canWrite}
          isAdmin={isAdmin}
          onReceive={() => setShowReceive(true)}
          onConsume={() => setShowConsume(true)}
          onWaste={() => setShowWaste(true)}
          onAdjust={() => setShowAdjust(true)}
        />
      </section>

      {showReceive && (
        <InventoryReceiveModal
          lotNumber={receiveForm.lotNumber}
          expiryDate={receiveForm.expiryDate}
          quantity={receiveForm.quantity}
          onLotNumberChange={(v) => setReceiveForm((prev) => ({ ...prev, lotNumber: v }))}
          onExpiryDateChange={(v) => setReceiveForm((prev) => ({ ...prev, expiryDate: v }))}
          onQuantityChange={(v) => setReceiveForm((prev) => ({ ...prev, quantity: v }))}
          onClose={() => setShowReceive(false)}
          onSubmit={handleReceive}
        />
      )}

      {showConsume && (
        <InventoryConsumeModal
          item={item}
          quantity={consumeForm.quantity}
          lotNumber={consumeForm.lotNumber}
          reason={consumeForm.reason}
          onQuantityChange={(v) => setConsumeForm((prev) => ({ ...prev, quantity: v }))}
          onLotNumberChange={(v) => setConsumeForm((prev) => ({ ...prev, lotNumber: v }))}
          onReasonChange={(v) => setConsumeForm((prev) => ({ ...prev, reason: v }))}
          onClose={() => setShowConsume(false)}
          onSubmit={handleConsume}
        />
      )}

      {showAdjust && (
        <InventoryAdjustModal
          item={item}
          newStock={adjustForm.newStock}
          reason={adjustForm.reason}
          onNewStockChange={(v) => setAdjustForm((prev) => ({ ...prev, newStock: v }))}
          onReasonChange={(v) => setAdjustForm((prev) => ({ ...prev, reason: v }))}
          onClose={() => setShowAdjust(false)}
          onSubmit={handleAdjust}
        />
      )}

      {showWaste && (
        <InventoryWasteModal
          item={item}
          quantity={wasteForm.quantity}
          lotNumber={wasteForm.lotNumber}
          reason={wasteForm.reason}
          onQuantityChange={(v) => setWasteForm((prev) => ({ ...prev, quantity: v }))}
          onLotNumberChange={(v) => setWasteForm((prev) => ({ ...prev, lotNumber: v }))}
          onReasonChange={(v) => setWasteForm((prev) => ({ ...prev, reason: v }))}
          onClose={() => setShowWaste(false)}
          onSubmit={handleWaste}
        />
      )}

      {showRule && (
        <InventoryRuleModal
          tests={tests}
          testId={ruleForm.testId}
          quantityPerTest={ruleForm.quantityPerTest}
          onTestIdChange={(v) => setRuleForm((prev) => ({ ...prev, testId: v }))}
          onQuantityPerTestChange={(v) => setRuleForm((prev) => ({ ...prev, quantityPerTest: v }))}
          onClose={() => setShowRule(false)}
          onSubmit={handleRuleSave}
        />
      )}

      <InventoryItemFormModal
        open={showEdit}
        title="Modifier l’article"
        subtitle="Ajustez les informations principales sans modifier l’historique des mouvements."
        submitLabel="Enregistrer"
        form={editForm}
        categories={categories}
        showInitialStock={false}
        onClose={() => setShowEdit(false)}
        onSubmit={handleEdit}
        onFormChange={setEditForm}
      />

      {notification && <NotificationToast type={notification.type} message={notification.message} />}
    </div>
  );
}
