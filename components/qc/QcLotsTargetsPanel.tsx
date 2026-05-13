'use client';

import type React from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, PencilLine, Plus, Power, RefreshCw, Trash2 } from 'lucide-react';
import { QcTargetRowEditor } from '@/components/qc/QcTargetRowEditor';
import { EMPTY_TARGET_ROW, type LotFormState, type Material, type QcTarget, type RangeBasis, type TargetRow, type TestOption } from '@/components/qc/config-types';
import { QcTestSelectorModal } from '@/components/qc/QcTestSelectorModal';
import { useState } from 'react';

interface QcLotsTargetsPanelProps {
  materials: Material[];
  filteredMaterials: Material[];
  tests: TestOption[];
  lotForm: LotFormState;
  targetRows: TargetRow[];
  selectedLotId: string;
  expandedMaterialIds: string[];
  globalRangeBasis: RangeBasis;
  rangeBasisLabel: string;
  onLoadSubmit: (event: React.FormEvent) => void | Promise<void>;
  onLotFormChange: React.Dispatch<React.SetStateAction<LotFormState>>;
  onUpdateGlobalRangeBasis: (value: RangeBasis) => void;
  onToggleMaterial: (materialId: string) => void;
  onSelectLot: (lotId: string, materialId: string) => void;
  onUpdateLot: (lotId: string, currentLot: { lotNumber: string; expiryDate: string; openedAt?: string | null }) => void;
  onToggleLot: (lotId: string) => void;
  onDeleteLot: (lotId: string, lotNumber: string) => void;
  onEditTarget?: (target: QcTarget) => void;
  onTargetRowsChange: React.Dispatch<React.SetStateAction<TargetRow[]>>;
  onSaveTargets: (lotId: string) => void;
}

export function QcLotsTargetsPanel({
  materials,
  filteredMaterials,
  tests,
  lotForm,
  targetRows,
  selectedLotId,
  expandedMaterialIds,
  globalRangeBasis,
  rangeBasisLabel,
  onLoadSubmit,
  onLotFormChange,
  onUpdateGlobalRangeBasis,
  onToggleMaterial,
  onSelectLot,
  onUpdateLot,
  onToggleLot,
  onDeleteLot,
  onEditTarget,
  onTargetRowsChange,
  onSaveTargets,
}: QcLotsTargetsPanelProps) {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  return (
    <article className="bento-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Lots et cibles</h2>
      <div className="mt-4 rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-text)]">Hypothèse globale pour les plages fabricant</div>
            <div className="mt-1 text-xs text-[var(--color-text-soft)]">
              Si une fiche QC donne seulement `cible + min/max`, le système convertit cette plage en SD interne selon ce réglage.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ['1sd', 'Plage = ±1 SD'],
              ['2sd', 'Plage = ±2 SD'],
              ['3sd', 'Plage = ±3 SD'],
            ] as Array<[RangeBasis, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onUpdateGlobalRangeBasis(value)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                  globalRangeBasis === value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onLoadSubmit}>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-text)]">Matériel QC</span>
          <select
            className="input-premium h-11 bg-[var(--color-surface)]"
            value={lotForm.materialId}
            onChange={(event) => onLotFormChange((prev) => ({ ...prev, materialId: event.target.value }))}
            required
          >
            <option value="">Sélectionner un matériel</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-text)]">Numéro du lot</span>
          <input
            className="input-premium h-11 bg-[var(--color-surface)]"
            value={lotForm.lotNumber}
            onChange={(event) => onLotFormChange((prev) => ({ ...prev, lotNumber: event.target.value }))}
            placeholder="Ex. QC-2026-041"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-text)]">Date d’expiration du lot</span>
          <input
            type="date"
            className="input-premium h-11 bg-[var(--color-surface)]"
            value={lotForm.expiryDate}
            onChange={(event) => onLotFormChange((prev) => ({ ...prev, expiryDate: event.target.value }))}
            required
          />
          <span className="text-xs text-[var(--color-text-soft)]">
            Date limite indiquée par le fabricant sur le flacon ou la notice du contrôle.
          </span>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-text)]">Date d’ouverture / mise en service</span>
          <input
            type="date"
            className="input-premium h-11 bg-[var(--color-surface)]"
            value={lotForm.openedAt}
            onChange={(event) => onLotFormChange((prev) => ({ ...prev, openedAt: event.target.value }))}
          />
          <span className="text-xs text-[var(--color-text-soft)]">
            Date à laquelle le lot a été ouvert, reconstitué ou commencé au laboratoire.
          </span>
        </label>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-soft)] md:col-span-2">
          La date d’expiration vient du fournisseur. La date d’ouverture sert au suivi interne du laboratoire après ouverture ou reconstitution du lot.
        </div>
        <div className="md:col-span-2">
          <button className="btn-primary-md" type="submit">
            <Plus className="h-4 w-4" />
            Nouveau lot
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {filteredMaterials.map((material) => {
          const isExpanded = expandedMaterialIds.includes(material.id);
          const hasSelectedLot = material.lots.some((lot) => lot.id === selectedLotId);

          return (
            <div key={material.id} id={`material-${material.id}`} className="overflow-hidden rounded-2xl border bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={() => onToggleMaterial(material.id)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                  hasSelectedLot ? 'bg-[var(--color-accent-soft)]' : 'bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-muted)]'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--color-text)]">{material.name}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                    {material.level} · {material.lots.length} lot{material.lots.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text-soft)]">
                  <span className="rounded-full bg-[var(--color-surface)]/80 px-2.5 py-1 text-[11px] font-medium">
                    {material.lots.length} lot{material.lots.length > 1 ? 's' : ''}
                  </span>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-2 border-t px-3 py-3">
                  {material.lots.length > 0 ? (
                    material.lots.map((lot) => (
                      <div key={lot.id} className="overflow-hidden rounded-2xl border bg-[var(--color-surface)]">
                        <button
                          type="button"
                          onClick={() => onSelectLot(lot.id, material.id)}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            selectedLotId === lot.id ? 'bg-[var(--color-accent-soft)]' : 'hover:bg-[var(--color-surface-muted)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-[var(--color-text)]">Lot {lot.lotNumber}</div>
                              <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                                Expire le {new Date(lot.expiryDate).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!lot.isActive && (
                                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-soft)]">
                                  Inactif
                                </span>
                              )}
                              <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-soft)]">
                                {lot.targets.length} cible{lot.targets.length > 1 ? 's' : ''}
                              </span>
                              {selectedLotId === lot.id ? (
                                <ChevronDown className="h-4 w-4 text-[var(--color-text-soft)]" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-[var(--color-text-soft)]" />
                              )}
                            </div>
                          </div>
                        </button>

                        {selectedLotId === lot.id && (
                          <div className="space-y-4 border-t px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn-secondary-sm"
                                onClick={() =>
                                  onUpdateLot(lot.id, {
                                    lotNumber: lot.lotNumber,
                                    expiryDate: lot.expiryDate,
                                    openedAt: lot.openedAt,
                                  })
                                }
                              >
                                <PencilLine className="h-4 w-4" />
                                Modifier le lot
                              </button>
                              <button type="button" className="btn-secondary-sm" onClick={() => onToggleLot(lot.id)}>
                                <Power className="h-4 w-4" />
                                {lot.isActive ? 'Désactiver' : 'Réactiver'}
                              </button>
                              <button
                                type="button"
                                className="btn-secondary-sm text-rose-700"
                                onClick={() => onDeleteLot(lot.id, lot.lotNumber)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </button>
                            </div>
                            <div id="qc-target-editor" className="flex items-center justify-between gap-3 rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                              <div>
                                Cibles configurées pour le lot <span className="font-semibold text-[var(--color-text)]">{lot.lotNumber}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onTargetRowsChange([{ ...EMPTY_TARGET_ROW }])}
                                className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                              >
                                + Nouveau paramètre
                              </button>
                            </div>

                            {Number(lot.resultsCount30d) > 0 && (
                              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                <div>
                                  <p className="font-semibold">Attention : Lot en service</p>
                                  <p className="mt-1 leading-relaxed opacity-90">
                                    Ce lot possède déjà {lot.resultsCount30d} résultat(s) sur les 30 derniers jours.
                                    Modifier les cibles (Moyenne/SD) changera l'interprétation clinique et les alertes Westgard 
                                    pour l'ensemble des points de ce lot.
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="space-y-3">
                              {targetRows.map((row, index) => (
                                <div key={index} className="relative">
                                  {row.testCode && (
                                    <div className="absolute -top-2 left-6 z-10 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
                                      {lot.targets.some(t => t.testCode === row.testCode) ? 'Modification' : 'Nouveau'}
                                    </div>
                                  )}
                                  <QcTargetRowEditor
                                    row={row}
                                    index={index}
                                    tests={tests}
                                    globalRangeBasis={globalRangeBasis}
                                    rangeBasisLabel={rangeBasisLabel}
                                    onChange={(rowIndex, nextRow) =>
                                      onTargetRowsChange((prev) =>
                                        prev.map((item, itemIndex) => (itemIndex === rowIndex ? nextRow : item))
                                      )
                                    }
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setIsTestModalOpen(true)}
                                className="btn-secondary-sm"
                              >
                                <Plus className="h-4 w-4" />
                                Importer des tests...
                              </button>
                                
                              {material.lots.filter(l => l.id !== lot.id).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const otherLots = [...material.lots]
                                      .filter(l => l.id !== lot.id)
                                      .sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
                                    const sourceLot = otherLots[0];
                                    
                                    if (sourceLot && sourceLot.targets.length > 0) {
                                      const newRows: TargetRow[] = sourceLot.targets.map(t => ({
                                        testId: t.testId || '',
                                        testCode: t.testCode,
                                        testName: t.testName,
                                        unit: t.unit || '',
                                        mean: String(t.mean),
                                        sd: t.controlMode === 'STATISTICAL' ? String(t.sd || '') : '',
                                        minValue: t.controlMode === 'ACCEPTANCE_RANGE' ? String(t.minAcceptable || '') : '',
                                        maxValue: t.controlMode === 'ACCEPTANCE_RANGE' ? String(t.maxAcceptable || '') : '',
                                        inputMode: t.controlMode === 'STATISTICAL' ? 'sd' : 'range'
                                      }));
                                      onTargetRowsChange(newRows);
                                    }
                                  }}
                                  className="btn-secondary-sm"
                                  title="Copier la configuration du lot le plus récent"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                  Copier du lot précédent
                                </button>
                              )}
                              <button type="button" className="btn-primary-md" onClick={() => onSaveTargets(lot.id)}>
                                Enregistrer les cibles
                              </button>
                            </div>

                            <div className="rounded-2xl border bg-[var(--color-surface)]">
                              <div className="border-b px-4 py-3 text-sm font-semibold text-[var(--color-text)]">Cibles actuelles</div>
                              <div className="divide-y">
                                {lot.targets.length > 0 ? (
                                  lot.targets.map((target) => (
                                    <div 
                                      key={target.id} 
                                      className="grid grid-cols-7 px-4 py-3 text-sm items-center hover:bg-[var(--color-surface-muted)] cursor-pointer transition-colors group"
                                      onClick={() => onEditTarget?.(target)}
                                      title="Cliquez pour modifier ce paramètre"
                                    >
                                      <div className="font-medium text-[var(--color-accent)] group-hover:underline">{target.testCode}</div>
                                      <div className="col-span-2">{target.testName}</div>
                                      <div 
                                        className="text-xs text-[var(--color-text-soft)]"
                                        dangerouslySetInnerHTML={{ __html: target.unit || '--' }}
                                      />
                                      <div>{target.controlMode === 'STATISTICAL' ? 'Statistique' : 'Plage'}</div>
                                      <div className="tabular-nums font-medium">{Number(target.mean).toFixed(2)}</div>
                                      <div className="text-right tabular-nums">
                                        {target.controlMode === 'STATISTICAL'
                                          ? `SD ${(target.sd ?? 0).toFixed(2)}`
                                          : `${(target.minAcceptable ?? 0).toFixed(2)} - ${(target.maxAcceptable ?? 0).toFixed(2)}`}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-4 py-4 text-sm text-[var(--color-text-soft)]">
                                    Aucune cible n’est encore configurée pour ce lot.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-[var(--color-text-soft)]">
                      Aucun lot configuré pour ce matériel.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filteredMaterials.length === 0 && (
          <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-[var(--color-text-soft)]">
            Aucun lot QC trouvé pour ce filtre.
          </div>
        )}
      </div>
      <QcTestSelectorModal
        open={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        tests={tests}
        onSelect={(selected) => {
          const existingIds = new Set(targetRows.map(r => r.testId).filter(id => id));
          const missingTests = selected.filter(t => !existingIds.has(t.id));
          
          if (missingTests.length === 0) return;

          const newRows: TargetRow[] = missingTests.map((test) => ({
            testId: test.id,
            testCode: test.code,
            testName: test.name,
            mean: '',
            sd: '',
            unit: test.unit || '',
            inputMode: 'range',
            minValue: '',
            maxValue: '',
          }));

          onTargetRowsChange((prev) => {
            const filtered = prev.filter(r => r.testId || r.mean || r.sd || r.minValue || r.maxValue);
            return [...filtered, ...newRows];
          });
        }}
      />
    </article>
  );
}
