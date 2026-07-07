import { createElement } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Calculator, CheckCircle, History, MessageSquare, NotepadTextIcon } from 'lucide-react';
import { formatReferenceRange, getTestReferenceValues, getResultReferenceValues } from '@/lib/core/utils';
import { getCategoryIcon } from '@/lib/core/category-icons';
import { isResultAbnormal } from '@/lib/clinical/calculations';
import { isCalculatedFormulaTest } from '@/lib/clinical/calculated-tests';
import { isCalculatedTest } from '@/lib/clinical/test-classification';
import type { Analysis } from '@/lib/core/types';
import type { ResultWithRenderCategory } from './types';

import { useAnalysisContext } from './AnalysisContext';

interface AnalysisResultRowProps {
  analysis: Analysis;
  result: ResultWithRenderCategory;
  index: number;
  total: number;
  isFinalValidated: boolean;
}

export function AnalysisResultRow({
  analysis,
  result,
  index,
  total,
  isFinalValidated,
}: AnalysisResultRowProps) {
  const {
    selectedIds,
    results,
    history,
    notes,
    draftNotes,
    expandedNotes,
    inputsRef,
    handleResultChange,
    formatValue,
    handleKeyDown,
    toggleSelection,
    toggleNote,
    handleNoteChange,
    applyNote,
    deleteNote,
  } = useAnalysisContext();
  const test = result.test;
  if (!test) return null;

  const value = results[result.id];
  const abnormal = isResultAbnormal(value, result, analysis.patientGender);
  const isNumeric = test.resultType === 'numeric' || test.resultType === 'calculated';
  const prevResult = history[result.id];
  const displayName = test.name;
  const categoryIcon = getCategoryIcon(test.categoryRel?.icon);
  const isFormula = isCalculatedFormulaTest(test) || isCalculatedTest(test.code || '');

  return (
    <>
      <div className={`group flex flex-col items-stretch gap-3 border-b px-3 py-3 transition-colors lg:flex-row lg:items-center lg:gap-4 ${test.parentId ? 'pl-6' : ''} ${abnormal ? 'bg-rose-50/40' : 'hover:bg-[var(--color-surface-muted)]/40'}`}>
        {isFinalValidated && (
          <div onClick={() => toggleSelection(result.id)} className={`flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border-2 transition-all ${selectedIds.includes(result.id) ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`}>
            {selectedIds.includes(result.id) && <CheckCircle size={10} className="text-white" />}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3 lg:w-56">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${abnormal ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'}`}>
            {createElement(categoryIcon, { size: 14 })}
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-[var(--color-text)]">{displayName}</span>
              {isFormula && <Calculator size={12} className="shrink-0 text-indigo-400" />}
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">{test.code}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full justify-center">
            {test.resultType === 'long_text' ? (
              <textarea
                ref={(element) => {
                  inputsRef.current[result.id] = element;
                }}
                value={results[result.id]}
                onChange={(event) => handleResultChange(result.id, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, index, total)}
                disabled={isFinalValidated || isFormula}
                rows={3}
                className="input-premium min-h-[80px] w-full max-w-md resize-none rounded-md px-4 py-3 text-sm"
                placeholder="Saisissez les résultats détaillés ici..."
              />
            ) : test.resultType === 'dropdown' ? (
              <select
                ref={(element) => {
                  inputsRef.current[result.id] = element;
                }}
                value={results[result.id]}
                onChange={(event) => handleResultChange(result.id, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, index, total)}
                disabled={isFinalValidated || isFormula}
                className={`h-10 w-full max-w-[200px] rounded-md border px-3 text-sm font-bold transition-all outline-none ${results[result.id] ? 'border-indigo-200 bg-indigo-50/50 text-indigo-700' : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'}`}
              >
                <option value="">-- Sélectionner --</option>
                {test.options?.split(',').map((option: string) => (
                  <option key={option.trim()} value={option.trim()}>
                    {option.trim()}
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <input
                  ref={(element) => {
                    inputsRef.current[result.id] = element;
                  }}
                  value={results[result.id]}
                  onChange={(event) => handleResultChange(result.id, event.target.value)}
                  onBlur={(event) => {
                    if (isNumeric && event.target.value) {
                      const decimals = parseInt(String(test.decimals ?? 1), 10);
                      const formatted = formatValue(event.target.value, decimals);
                      handleResultChange(result.id, formatted);
                    }
                  }}
                  onKeyDown={(event) => handleKeyDown(event, index, total)}
                  disabled={isFinalValidated || isFormula}
                  className={`font-mono h-10 rounded-md border font-bold transition-all outline-none focus:ring-4 ${isNumeric ? 'w-28 px-2 text-center text-lg tracking-normal' : 'w-48 px-4 text-sm'} ${abnormal ? 'border-rose-300 bg-rose-50 text-rose-600 focus:border-rose-400 focus:ring-rose-500/10' : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)] hover:border-slate-300 focus:border-indigo-500 focus:bg-[var(--color-surface)] focus:ring-indigo-500/10'} ${isFormula ? 'cursor-not-allowed border-transparent bg-[var(--color-surface-muted)] text-slate-500' : ''}`}
                />
                {abnormal && <AlertCircle className="absolute -right-7 top-1/2 -translate-y-1/2 text-rose-500" size={16} />}
              </div>
            )}
          </div>

          {prevResult && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <History size={10} />
              <span>Préc: </span>
              <span className="font-mono font-bold text-[var(--color-text-secondary)]">
                {prevResult.value} {prevResult.unit}
              </span>
              <span className="opacity-60">({format(new Date(prevResult.createdAt), 'dd/MM/yy')})</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-4 lg:w-52">
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">Unité</div>
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]" dangerouslySetInnerHTML={{ __html: test.unit || '--' }} />
          </div>
          <div className="w-20 text-right">
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-slate-500">Réf.</div>
            <span className="text-xs font-mono font-bold text-[var(--color-text)]">
              {(() => {
                if (!isNumeric) return 'QUALIT.';
                const refVals = getResultReferenceValues(result, analysis.patientGender);
                return formatReferenceRange(refVals.min, refVals.max);
              })()}
            </span>
          </div>
          {!isFinalValidated && (
            <button
              onClick={() => toggleNote(result.id)}
              className={`rounded-md p-1.5 transition-colors ${notes[result.id] ? 'bg-indigo-50 text-[var(--color-accent)]' : 'text-slate-500 hover:bg-[var(--color-surface-muted)] hover:text-indigo-500'}`}
              tabIndex={-1}
              title={notes[result.id] ? 'Modifier Note' : 'Ajouter Note'}
            >
              <NotepadTextIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {expandedNotes.includes(result.id) && (
        <div className={`mb-2 ml-10 mr-4 ${isFinalValidated ? 'opacity-70' : ''}`}>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <MessageSquare size={12} className="text-indigo-500" />
                <span className="section-label">Note technique</span>
              </div>
              <div className="flex items-center gap-2">
                {notes[result.id] && (
                  <button
                    onClick={() => deleteNote(result.id)}
                    className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-100"
                    disabled={isFinalValidated}
                  >
                    Supprimer
                  </button>
                )}
                <button
                  onClick={() => toggleNote(result.id)}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
                >
                  Annuler
                </button>
                <button onClick={() => applyNote(result.id)} className="btn-primary-sm !rounded-md !px-3 !py-1" disabled={isFinalValidated}>
                  Appliquer
                </button>
              </div>
            </div>
            <textarea
              value={draftNotes[result.id] || ''}
              onChange={(event) => handleNoteChange(result.id, event.target.value)}
              placeholder="Saisissez une observation (ex: prélèvement hémolysé, contrôle refait...)"
              disabled={isFinalValidated}
              className="input-premium w-full resize-none rounded-md bg-[var(--color-surface)] p-3 text-xs"
              rows={2}
            />
          </div>
        </div>
      )}

      {!expandedNotes.includes(result.id) && notes[result.id] && (
        <div
          className={`mb-1 ml-10 mr-4 flex w-fit items-center gap-1.5 rounded-md border border-indigo-100 bg-indigo-50/70 px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] transition-colors ${isFinalValidated ? 'cursor-default' : 'cursor-pointer hover:bg-indigo-50'}`}
          onClick={() => {
            if (!isFinalValidated) toggleNote(result.id);
          }}
        >
          <MessageSquare size={10} />
          <span className="max-w-md truncate">Note: {notes[result.id]}</span>
        </div>
      )}
    </>
  );
}
