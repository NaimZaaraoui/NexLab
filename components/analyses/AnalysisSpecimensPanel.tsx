'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, FlaskConical, RefreshCw, Save, TimerReset, XCircle } from 'lucide-react';
import { useAnalysisContext } from './AnalysisContext';
import type { Specimen } from '@/lib/core/types';

type SpecimenDraft = {
  id?: string | null;
  sampleType: string;
  containerType: string;
  barcode: string;
  status: string;
  condition: string;
  collectedAt: string;
  receivedAt: string;
  acceptedAt: string;
  rejectedAt: string;
  rejectionReason: string;
  notes: string;
};

const STATUS_OPTIONS = [
  { value: 'expected', label: 'Attendu' },
  { value: 'collected', label: 'Prélevé' },
  { value: 'received', label: 'Reçu' },
  { value: 'accepted', label: 'Accepté' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'stored', label: 'Stocké' },
];

const OTHER_VALUE = '__other__';

const SAMPLE_TYPE_OPTIONS = [
  'Sang total',
  'Sérum',
  'Plasma',
  'Urines',
  'Selles',
  'LCR',
  'Prélèvement vaginal',
  'Écouvillon',
  'Échantillon',
];

const GENERIC_CONTAINER_OPTIONS = [
  'Tube EDTA',
  'Tube sec',
  'Tube citrate',
  'Tube héparine',
  'Flacon urines',
  'Écouvillon',
  'Pot stérile',
];

const SAMPLE_CONDITION_OPTIONS = [
  'Conforme',
  'Hémolysé',
  'Lipémique',
  'Ictérique',
  'Coagulé',
  'Volume insuffisant',
  'Tube mal identifié',
  'Échantillon altéré',
];

const CONTAINER_OPTIONS_BY_SAMPLE_TYPE: Record<string, string[]> = {
  'Sang total': ['Tube EDTA', 'Tube citrate', 'Tube héparine'],
  Sérum: ['Tube sec', 'Tube gel séparateur'],
  Plasma: ['Tube héparine', 'Tube citrate', 'Tube EDTA'],
  Urines: ['Flacon urines', 'Pot stérile'],
  Selles: ['Pot stérile'],
  LCR: ['Tube stérile', 'Pot stérile'],
  'Prélèvement vaginal': ['Écouvillon', 'Milieu de transport'],
  Écouvillon: ['Écouvillon', 'Milieu de transport'],
  Échantillon: GENERIC_CONTAINER_OPTIONS,
};

const iconButtonClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface)] active:scale-[0.99]';

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function splitSettingsList(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getContainerOptions(sampleType: string) {
  return CONTAINER_OPTIONS_BY_SAMPLE_TYPE[sampleType] || GENERIC_CONTAINER_OPTIONS;
}

function getSelectValue(value: string, options: string[]) {
  if (!value) return OTHER_VALUE;
  return options.includes(value) ? value : OTHER_VALUE;
}

function toInputDate(value: string | Date | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function fromSpecimen(specimen: Specimen): SpecimenDraft {
  return {
    id: specimen.id,
    sampleType: specimen.sampleType || '',
    containerType: specimen.containerType || '',
    barcode: specimen.barcode || '',
    status: specimen.status || 'expected',
    condition: specimen.condition || '',
    collectedAt: toInputDate(specimen.collectedAt),
    receivedAt: toInputDate(specimen.receivedAt),
    acceptedAt: toInputDate(specimen.acceptedAt),
    rejectedAt: toInputDate(specimen.rejectedAt),
    rejectionReason: specimen.rejectionReason || '',
    notes: specimen.notes || '',
  };
}

function emptyDraft(sampleType: string): SpecimenDraft {
  return {
    sampleType,
    containerType: '',
    barcode: '',
    status: 'expected',
    condition: '',
    collectedAt: '',
    receivedAt: '',
    acceptedAt: '',
    rejectedAt: '',
    rejectionReason: '',
    notes: '',
  };
}

function nowInputValue() {
  return new Date().toISOString().slice(0, 16);
}

function barcodeSegment(value: string | null | undefined, fallback: string) {
  const normalized = (value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function buildSpecimenBarcode({
  orderNumber,
  sampleType,
  containerType,
  index,
}: {
  orderNumber: string;
  sampleType: string;
  containerType: string;
  index: number;
}) {
  const dossier = barcodeSegment(orderNumber, 'DOSSIER');
  const sample = barcodeSegment(sampleType, 'ECHANT');
  const container = barcodeSegment(containerType, 'TUBE');
  return `${dossier}-${sample}-${container}-${String(index + 1).padStart(2, '0')}`;
}

export function AnalysisSpecimensPanel() {
  const { analysis, isFinalValidated, loadAnalysis, reportSettings, showNotification } = useAnalysisContext();
  const [drafts, setDrafts] = useState<SpecimenDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const autoSavedForRef = useRef<string | null>(null);

  const expectedSpecimenDefaults = useMemo(() => {
    if (!analysis) return [];
    
    const pairs = new Map<string, { sampleType: string; containerType: string }>();
    
    analysis.results.forEach((result) => {
      const sampleType = result.test?.sampleType?.trim();
      const containerType = result.test?.sampleContainer?.trim() || '';
      
      if (sampleType) {
        const key = `${sampleType}|${containerType}`;
        if (!pairs.has(key)) {
          pairs.set(key, { sampleType, containerType });
        }
      }
    });
    
    const values = Array.from(pairs.values()).sort((a, b) => a.sampleType.localeCompare(b.sampleType));
    return values.length > 0 ? values : [{ sampleType: 'Échantillon', containerType: '' }];
  }, [analysis]);

  const expectedSampleTypes = useMemo(() => 
    Array.from(new Set(expectedSpecimenDefaults.map(d => d.sampleType))),
  [expectedSpecimenDefaults]);

  const configuredSampleTypes = useMemo(
    () => splitSettingsList(reportSettings.sample_types),
    [reportSettings.sample_types]
  );

  const sampleTypeOptions = useMemo(
    () => uniqueSorted([
      ...(configuredSampleTypes.length > 0 ? configuredSampleTypes : SAMPLE_TYPE_OPTIONS),
      ...expectedSampleTypes,
    ]),
    [configuredSampleTypes, expectedSampleTypes]
  );

  const configuredContainerOptions = useMemo(
    () => splitSettingsList(reportSettings.sample_containers),
    [reportSettings.sample_containers]
  );

  const fallbackContainerOptions = useMemo(
    () => configuredContainerOptions.length > 0 ? configuredContainerOptions : GENERIC_CONTAINER_OPTIONS,
    [configuredContainerOptions]
  );

  const conditionOptions = useMemo(() => {
    const configuredConditions = splitSettingsList(reportSettings.sample_conditions);
    return uniqueSorted(configuredConditions.length > 0 ? configuredConditions : SAMPLE_CONDITION_OPTIONS);
  }, [reportSettings.sample_conditions]);

  const autoSaveSpecimens = useCallback(async (specimenDrafts: SpecimenDraft[], analysisId: string) => {
    try {
      await fetch(`/api/analyses/${analysisId}/specimens`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specimens: specimenDrafts }),
      });
      await loadAnalysis();
    } catch {
      // Silent — auto-save is best-effort; user can still save manually
    }
  }, [loadAnalysis]);

  useEffect(() => {
    if (!analysis) return;

    if (analysis.specimens && analysis.specimens.length > 0) {
      setDrafts(
        analysis.specimens.map((specimen, index) => {
          const draft = fromSpecimen(specimen);
          return {
            ...draft,
            barcode: draft.barcode || buildSpecimenBarcode({
              orderNumber: analysis.orderNumber,
              sampleType: draft.sampleType,
              containerType: draft.containerType,
              index,
            }),
          };
        })
      );
      return;
    }

    // No saved specimens yet — generate defaults and auto-save so labels work immediately
    const generated = expectedSpecimenDefaults.map(
      (defaultSpecimen, index) => {
        const draft = emptyDraft(defaultSpecimen.sampleType);
        draft.containerType = defaultSpecimen.containerType;
        
        return {
          ...draft,
          barcode: buildSpecimenBarcode({
            orderNumber: analysis.orderNumber,
            sampleType: draft.sampleType,
            containerType: draft.containerType,
            index,
          }),
        };
      }
    );

    setDrafts(generated);

    // Auto-save once per analysis (skip if validated or already saved this session)
    if (!isFinalValidated && autoSavedForRef.current !== analysis.id) {
      autoSavedForRef.current = analysis.id;
      autoSaveSpecimens(generated, analysis.id);
    }
  }, [analysis, expectedSpecimenDefaults, isFinalValidated, autoSaveSpecimens]);

  if (!analysis) return null;

  const updateDraft = (index: number, patch: Partial<SpecimenDraft>) => {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft))
    );
  };

  const markReceived = (index: number) => {
    updateDraft(index, {
      status: 'received',
      receivedAt: nowInputValue(),
    });
  };

  const markAccepted = (index: number) => {
    const now = nowInputValue();
    updateDraft(index, {
      status: 'accepted',
      receivedAt: drafts[index]?.receivedAt || now,
      acceptedAt: now,
      rejectedAt: '',
      rejectionReason: '',
    });
  };

  const markRejected = (index: number) => {
    updateDraft(index, {
      status: 'rejected',
      rejectedAt: nowInputValue(),
      acceptedAt: '',
    });
  };

  const addSpecimen = () => {
    setDrafts((current) => {
      const draft = emptyDraft('Échantillon');
      return [
        ...current,
        {
          ...draft,
          barcode: buildSpecimenBarcode({
            orderNumber: analysis.orderNumber,
            sampleType: draft.sampleType,
            containerType: draft.containerType,
            index: current.length,
          }),
        },
      ];
    });
  };

  const regenerateBarcode = (index: number) => {
    const draft = drafts[index];
    if (!draft) return;
    updateDraft(index, {
      barcode: buildSpecimenBarcode({
        orderNumber: analysis.orderNumber,
        sampleType: draft.sampleType,
        containerType: draft.containerType,
        index,
      }),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/analyses/${analysis.id}/specimens`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specimens: drafts }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erreur lors de la sauvegarde des échantillons');
      }

      showNotification('success', 'Échantillons sauvegardés');
      await loadAnalysis();
    } catch (error) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des échantillons'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,31,51,0.04)]">
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-accent)]">
            <FlaskConical size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Gestion des échantillons</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">Réception, état et motifs de rejet</p>
          </div>
        </div>

        {!isFinalValidated && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addSpecimen} className="btn-secondary h-9 px-4 text-xs">
              + Ajouter tube
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary h-9 px-4 text-xs disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={13} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        )}
      </div>

      <div className="divide-y">
        {drafts.map((draft, index) => {
          const locked = isFinalValidated;
          const isRejected = draft.status === 'rejected';
          const statusColors: Record<string, string> = {
            expected: 'bg-slate-100 text-slate-600',
            collected: 'bg-blue-50 text-blue-700',
            received: 'bg-amber-50 text-amber-700',
            accepted: 'bg-emerald-50 text-emerald-700',
            rejected: 'bg-rose-50 text-rose-700',
            stored: 'bg-purple-50 text-purple-700',
          };
          const sampleSelectValue = getSelectValue(draft.sampleType, sampleTypeOptions);
          const showCustomSampleType = sampleSelectValue === OTHER_VALUE;
          const containerOptions = uniqueSorted([
            ...fallbackContainerOptions,
            ...getContainerOptions(draft.sampleType),
          ]);
          const containerSelectValue = getSelectValue(draft.containerType, containerOptions);
          const showCustomContainer = containerSelectValue === OTHER_VALUE;
          const conditionSelectValue = getSelectValue(draft.condition, conditionOptions);
          const showCustomCondition = conditionSelectValue === OTHER_VALUE;

          return (
            <div key={draft.id || `${draft.sampleType}-${index}`} className={`px-5 py-4 ${isRejected ? 'bg-rose-50/40' : ''}`.trim()}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Tube {index + 1}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColors[draft.status] || statusColors.expected}`}>
                    {STATUS_OPTIONS.find(o => o.value === draft.status)?.label ?? draft.status}
                  </span>
                </div>
                {!locked && (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => markReceived(index)} title="Marquer reçu" className={iconButtonClass}>
                      <TimerReset size={14} className="shrink-0" />
                    </button>
                    <button type="button" onClick={() => markAccepted(index)} title="Accepter" className={`${iconButtonClass} text-emerald-600 hover:text-emerald-700`}>
                      <CheckCircle size={14} className="shrink-0" />
                    </button>
                    <button type="button" onClick={() => markRejected(index)} title="Rejeter" className={`${iconButtonClass} text-rose-600 hover:text-rose-700`}>
                      <XCircle size={14} className="shrink-0" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1">
                  <span className="section-label">Type d’échantillon</span>
                  <select
                    value={sampleSelectValue}
                    onChange={(event) => {
                      const nextSampleType = event.target.value === OTHER_VALUE ? '' : event.target.value;
                      updateDraft(index, { sampleType: nextSampleType, containerType: '' });
                    }}
                    disabled={locked}
                    className="input-premium h-9 text-sm"
                  >
                    {sampleTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    <option value={OTHER_VALUE}>Autre...</option>
                  </select>
                  {showCustomSampleType && (
                    <input
                      value={draft.sampleType}
                      onChange={(event) => updateDraft(index, { sampleType: event.target.value, containerType: '' })}
                      disabled={locked}
                      placeholder="Type personnalisé"
                      className="input-premium h-9 text-sm"
                    />
                  )}
                </label>

                <label className="space-y-1">
                  <span className="section-label">Contenant</span>
                  <select
                    value={containerSelectValue}
                    onChange={(event) => updateDraft(index, { containerType: event.target.value === OTHER_VALUE ? '' : event.target.value })}
                    disabled={locked}
                    className="input-premium h-9 text-sm"
                  >
                    {containerOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    <option value={OTHER_VALUE}>Autre...</option>
                  </select>
                  {showCustomContainer && (
                    <input
                      value={draft.containerType}
                      onChange={(event) => updateDraft(index, { containerType: event.target.value })}
                      disabled={locked}
                      placeholder="Contenant personnalisé"
                      className="input-premium h-9 text-sm"
                    />
                  )}
                </label>

                <label className="space-y-1">
                  <span className="section-label">État de l’échantillon</span>
                  <select
                    value={conditionSelectValue}
                    onChange={(event) => updateDraft(index, { condition: event.target.value === OTHER_VALUE ? '' : event.target.value })}
                    disabled={locked}
                    className="input-premium h-9 text-sm"
                  >
                    {conditionOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    <option value={OTHER_VALUE}>Autre...</option>
                  </select>
                  {showCustomCondition && (
                    <input
                      value={draft.condition}
                      onChange={(event) => updateDraft(index, { condition: event.target.value })}
                      disabled={locked}
                      placeholder="État personnalisé"
                      className="input-premium h-9 text-sm"
                    />
                  )}
                </label>

                <label className="space-y-1">
                  <span className="section-label">Code-barres</span>
                  <div className="flex gap-1.5">
                    <input
                      value={draft.barcode}
                      onChange={(event) => updateDraft(index, { barcode: event.target.value })}
                      disabled={locked}
                      className="input-premium h-9 font-mono text-xs"
                    />
                    {!locked && (
                      <button type="button" onClick={() => regenerateBarcode(index)} title="Générer" className={iconButtonClass}>
                        <RefreshCw size={13} className="shrink-0" />
                      </button>
                    )}
                  </div>
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="section-label">Réception</span>
                  <input type="datetime-local" value={draft.receivedAt} onChange={(event) => updateDraft(index, { receivedAt: event.target.value })} disabled={locked} className="input-premium h-9 text-sm" />
                </label>
                <label className="space-y-1">
                  <span className="section-label">Acceptation</span>
                  <input type="datetime-local" value={draft.acceptedAt} onChange={(event) => updateDraft(index, { acceptedAt: event.target.value })} disabled={locked} className="input-premium h-9 text-sm" />
                </label>
                <label className="space-y-1">
                  <span className="section-label">Rejet</span>
                  <input type="datetime-local" value={draft.rejectedAt} onChange={(event) => updateDraft(index, { rejectedAt: event.target.value })} disabled={locked} className="input-premium h-9 text-sm" />
                </label>
              </div>

              {isRejected && (
                <label className="mt-3 block space-y-1">
                  <span className="section-label">Motif de rejet</span>
                  <input
                    value={draft.rejectionReason}
                    onChange={(event) => updateDraft(index, { rejectionReason: event.target.value })}
                    disabled={locked}
                    placeholder="Volume insuffisant, tube coagulé, identification non conforme..."
                    className="input-premium h-9 w-full text-sm"
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
