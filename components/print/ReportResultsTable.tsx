import React from 'react';
import { sortReportResults } from '@/lib/documents/report-generation';
import { isEgfrTestCode } from '@/lib/clinical/renal-tests';
import type { Analysis, Result } from '@/lib/core/types';
import type { ReferenceDisplay, PrintSettings } from '@/components/print/types';
import { resolvePrintBranding } from '@/lib/documents/report-generation';

interface Props {
  categories: string[];
  categoryGroups: Record<string, Result[]>;
  results: Record<string, string>;
  testReferences: Map<string, ReferenceDisplay>;
  analysis: Analysis;
  settings?: PrintSettings;
}

interface ResultRowProps {
  res: Result;
  results: Record<string, string>;
  testReferences: Map<string, ReferenceDisplay>;
  analysis: Analysis;
  isNFS: boolean;
  showPrev: boolean;
}

function ResultRow({ res, results, testReferences, analysis, isNFS, showPrev }: ResultRowProps) {
  const refVals = testReferences.get(res.testId);
  const val = results[res.id] || '';
  const displayValue = formatReportResultValue(val, res.test?.code);
  const test = res.test;
  const hasParent = Boolean(test?.parentId);

  let flag: 'H' | 'L' | null = null;
  if (test && refVals) {
    const nVal = parseFloat(val.replace(',', '.'));
    if (!isNaN(nVal)) {
      if (refVals.max !== null && nVal > refVals.max) flag = 'H';
      else if (refVals.min !== null && nVal < refVals.min) flag = 'L';
    }
  }

  const compact = isNFS || hasParent;
  const py = compact ? 'py-1' : 'py-1.25';

  return (
    <tr className="group even:bg-[var(--color-surface-muted)]/30 print:even:bg-black/2 transition-colors break-inside-avoid">
      <td className={`${py} pl-4`}>
        <div className={`flex flex-col ${hasParent ? 'pl-6' : 'pl-4'}`}>
          <span className="text-[12px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">{test?.name}</span>
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest print:text-black/40">{test?.code}</span>
        </div>
      </td>
      <td className={`${py} text-start`}>
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center justify-start gap-2">
            <span className={`text-[14px] tracking-tight text-[var(--color-text)] ${flag ? 'font-black' : 'font-semibold'} print:text-black`}>
              {displayValue || '—'}
            </span>
            {flag && (
              <span className="text-[12px] font-black text-[var(--color-text)] px-1 py-0.5 min-w-3.5">
                {flag === 'H' ? '↑' : '↓'}
              </span>
            )}
          </div>
          {res.notes && (
            <span className="text-[9px] font-medium text-[var(--color-text-soft)] italic leading-none mt-1 print:text-black/60">
              ({res.notes})
            </span>
          )}
        </div>
      </td>
      {showPrev && (
        <td className={`${py} text-center`}>
          <span className="text-xs tracking-tight font-bold text-slate-400 print:text-black/40">
            {formatReportResultValue(analysis.previousResults?.[res.testId] || '', res.test?.code) || '—'}
          </span>
        </td>
      )}
      <td className={`${py} px-4 text-center text-xs font-bold text-[var(--color-text-soft)] print:text-black`}>
        <span dangerouslySetInnerHTML={{ __html: res.unit || test?.unit || '—' }} />
      </td>
      <td className={`${py} pr-4 text-right text-xs font-bold text-slate-400 print:text-black`}>
        {refVals && (
          refVals.display === 'QUALIT.' ? (
            <span className="text-slate-300 print:text-black/30 text-[9px] font-black tracking-widest">SANS RÉF.</span>
          ) : (
            <span className="text-[var(--color-text)] tracking-tight print:text-black">{refVals.display}</span>
          )
        )}
      </td>
    </tr>
  );
}

function formatReportResultValue(value: string, testCode?: string | null): string {
  if (!value || !isEgfrTestCode(testCode)) return value;

  const parsed = parseFloat(value.replace(',', '.'));
  if (Number.isNaN(parsed)) return value;

  return parsed > 90 ? '> 90' : value;
}

/** Column header row — reused in every thead */
function ColHeaderRow({ showPrev }: { showPrev: boolean }) {
  return (
    <tr className="bg-[var(--color-surface-muted)]/50 print:bg-black/5">
      <th className="py-2 pl-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black/80">Examen / Paramètre</th>
      <th className="py-2 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black/80">Résultat</th>
      {showPrev && <th className="py-2 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black/80 w-20">Préc.</th>}
      <th className="py-2 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black/80">Unité</th>
      <th className="py-2 pr-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-black/80">Valeurs de Référence</th>
    </tr>
  );
}

export function ReportResultsTable({
  categories,
  categoryGroups,
  results,
  testReferences,
  analysis,
  settings,
}: Props) {
  const { SHOW_PREVIOUS_RESULT } = resolvePrintBranding(settings);
  const colSpan = SHOW_PREVIOUS_RESULT ? 5 : 4;

  return (
    <tbody className="display-table-row-group print:h-full">
      <tr>
        <td>
          <div className="mb-6 relative z-10">
            {categories.map((categoryName) => {
              const catResults = sortReportResults(categoryGroups[categoryName]);
              const isNFS = categoryName === 'NFS';
              const displayCategoryName = isNFS ? 'Hématologie (NFS)' : categoryName;

              // Split catResults into groups: top-level non-group tests, and each parent group with its children
              const topLevelStandalones: Result[] = [];
              // Map of parentTestId -> { parent: Result, children: Result[] }
              const parentGroups: Map<string, { parent: Result; children: Result[] }> = new Map();
              // Preserve insertion order of parents
              const parentOrder: string[] = [];

              catResults.forEach((res) => {
                const test = res.test;
                if (!test) return;

                if (test.isGroup) {
                  if (!parentGroups.has(res.testId)) {
                    parentGroups.set(res.testId, { parent: res, children: [] });
                    parentOrder.push(res.testId);
                  }
                } else if (test.parentId && parentGroups.has(test.parentId)) {
                  parentGroups.get(test.parentId)!.children.push(res);
                } else if (!test.parentId) {
                  topLevelStandalones.push(res);
                } else {
                  // orphan with parentId not in this category — treat as standalone
                  topLevelStandalones.push(res);
                }
              });

              const hasStandalones = topLevelStandalones.length > 0;
              const hasGroups = parentOrder.length > 0;

              return (
                <React.Fragment key={categoryName}>
                  {/* ── Category label (top-level) ── */}
                  {!hasGroups || hasStandalones ? (
                    /* If there are standalone tests OR no groups, render a single outer table */
                    <table className="w-full border-collapse mb-3">
                      <thead>
                        {/* Category title row */}
                        <tr>
                          <td colSpan={colSpan} className="py-2">
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] print:text-black/60">
                                {displayCategoryName}
                              </span>
                              <div className="h-[1px] flex-1 bg-[var(--color-surface-muted)] print:bg-black/10" />
                            </div>
                          </td>
                        </tr>
                        <ColHeaderRow showPrev={SHOW_PREVIOUS_RESULT} />
                      </thead>
                      <tbody>
                        {topLevelStandalones.map((res) => (
                          <ResultRow
                            key={res.id}
                            res={res}
                            results={results}
                            testReferences={testReferences}
                            analysis={analysis}
                            isNFS={isNFS}
                            showPrev={SHOW_PREVIOUS_RESULT}
                          />
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    /* If only groups exist, render the category label once above them */
                    <div className="flex items-center gap-4 py-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] print:text-black/60">
                        {displayCategoryName}
                      </span>
                      <div className="h-[1px] flex-1 bg-[var(--color-surface-muted)] print:bg-black/10" />
                    </div>
                  )}

                  {/* ── One sub-table per parent group ── */}
                  {parentOrder.map((parentId) => {
                    const { parent, children } = parentGroups.get(parentId)!;
                    return (
                      <table key={parentId} className="w-full border-collapse mb-3">
                        <thead>
                          {/* Parent-test header row */}
                          <tr className="break-inside-avoid">
                            <td colSpan={colSpan} className="py-1.75 bg-[var(--color-surface-muted)]/30 print:bg-black/5">
                              <div className="flex items-center gap-3 px-4">
                                <span className="text-[12px] font-black text-[var(--color-accent)] uppercase tracking-tight print:text-black">
                                  {parent.test?.name}
                                </span>
                                <div className="h-px flex-1 bg-slate-200/50 print:bg-black/10" />
                              </div>
                            </td>
                          </tr>
                          <ColHeaderRow showPrev={SHOW_PREVIOUS_RESULT} />
                        </thead>
                        <tbody>
                          {children.map((res) => (
                            <ResultRow
                              key={res.id}
                              res={res}
                              results={results}
                              testReferences={testReferences}
                              analysis={analysis}
                              isNFS={isNFS}
                              showPrev={SHOW_PREVIOUS_RESULT}
                            />
                          ))}
                        </tbody>
                      </table>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
