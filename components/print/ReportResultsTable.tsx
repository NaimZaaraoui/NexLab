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
          <span className="text-xs font-bold text-slate-300 uppercase tracking-[0.08em] print:text-black/50">{test?.code}</span>
        </div>
      </td>
      <td className={`${py} text-start`}>
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center justify-start gap-2">
            <span className={`text-[14px] font-mono tabular-nums tracking-normal text-[var(--color-text)] ${flag ? 'font-bold' : 'font-semibold'} print:text-black`}>
              {displayValue || '—'}
            </span>
            {flag && (
              <span className="text-[14px] font-mono font-black text-[var(--color-text)] px-1 py-0.5 min-w-3.5">
                {flag === 'H' ? '↑' : '↓'}
              </span>
            )}
          </div>
          {res.notes && (
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)] italic leading-none mt-1 print:text-black/60">
              ({res.notes})
            </span>
          )}
        </div>
      </td>
      {showPrev && (
        <td className={`${py} text-center`}>
          <span className="text-[12px] font-mono tabular-nums tracking-normal font-semibold text-slate-500 print:text-black/60">
            {formatReportResultValue(analysis.previousResults?.[res.testId] || '', res.test?.code) || '—'}
          </span>
        </td>
      )}
      <td className={`${py} px-4 text-center text-xs font-bold text-[var(--color-text-secondary)] print:text-black`}>
        <span dangerouslySetInnerHTML={{ __html: res.unit || test?.unit || '—' }} />
      </td>
      <td className={`${py} pr-4 text-right text-xs font-bold text-slate-500 print:text-black`}>
        {refVals && (
          refVals.display === 'QUALIT.' ? (
            <span className="text-slate-300 print:text-black/30 text-[11px] font-black tracking-[0.08em]">—</span>
          ) : (
            <span className="text-[13px] font-mono tabular-nums tracking-normal font-medium text-[var(--color-text)] print:text-black">{refVals.display}</span>
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

function ColHeaderRow({ showPrev }: { showPrev: boolean }) {
  return (
    <tr className="bg-[var(--color-surface-muted)]/50 print:bg-black/5">
      <th className="py-2 pl-8 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 print:text-black/80">Examen / Paramètre</th>
      <th className="py-2 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 print:text-black/80">Résultat</th>
      {showPrev && <th className="py-2 text-center text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 print:text-black/80 w-20">Préc.</th>}
      <th className="py-2 text-center text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 print:text-black/80">Unité</th>
      <th className="py-2 pr-4 text-right text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 print:text-black/80">Valeurs de Référence</th>
    </tr>
  );
}

type DisplayItem =
  | { kind: 'groupHeader'; res: Result; depth: number }
  | { kind: 'result'; res: Result; depth: number };

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

              // Build the set of testIds that act as parents within this category
              const parentTestIds = new Set(
                catResults
                  .map((r) => r.test?.parentId)
                  .filter((pid): pid is string => Boolean(pid))
              );

              // Recursive function: builds a flat display list preserving hierarchy order.
              // A test that is itself a parent becomes a groupHeader; leaf tests become result items.
              const displayItems: DisplayItem[] = [];
              const seenTestIds = new Set<string>();

              const processItem = (res: Result, depth: number) => {
                const test = res.test;
                if (!test || seenTestIds.has(test.id)) return;
                seenTestIds.add(test.id);

                if (parentTestIds.has(test.id) || test.isGroup) {
                  // This test is a parent → render as section divider
                  displayItems.push({ kind: 'groupHeader', res, depth });
                  // Recursively process its children
                  catResults
                    .filter((r) => r.test?.parentId === test.id)
                    .forEach((child) => processItem(child, depth + 1));
                } else {
                  // Leaf test → normal result row
                  displayItems.push({ kind: 'result', res, depth });
                }
              };

              // Start from top-level tests (no parentId) to walk the tree top-down
              catResults
                .filter((r) => !r.test?.parentId)
                .forEach((res) => processItem(res, 0));

              // Safety net: catch any orphaned tests whose parent isn't in catResults
              catResults
                .filter((r) => r.test?.parentId && !seenTestIds.has(r.test.id))
                .forEach((res) => processItem(res, 0));

              return (
                // ONE table per category, ONE column header row
                <table key={categoryName} className="w-full border-collapse mb-4">
                  <thead>
                    {/* Category title */}
                    <tr>
                      <td colSpan={colSpan} className="py-2">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">
                            {displayCategoryName}
                          </span>
                          <div className="h-[1px] flex-1 bg-[var(--color-surface-muted)] print:bg-black/10" />
                        </div>
                      </td>
                    </tr>
                    {/* Single column header for the entire category */}
                    <ColHeaderRow showPrev={SHOW_PREVIOUS_RESULT} />
                  </thead>
                  <tbody>
                    {displayItems.map((item) => {
                      if (item.kind === 'groupHeader') {
                        // Parent test → section-divider row (indented based on depth)
                        const indent = item.depth === 0 ? 'px-4' : `pl-${4 + item.depth * 6} pr-4`;
                        const textSize = item.depth === 0 ? 'text-[11px]' : 'text-[10px]';
                        const bgClass = item.depth === 0
                          ? 'bg-[var(--color-surface-muted)]/30 print:bg-black/5'
                          : 'bg-[var(--color-surface-muted)]/15 print:bg-black/3';
                        return (
                          <tr key={`hdr-${item.res.id}`} className="break-inside-avoid">
                            <td colSpan={colSpan} className={`py-1.5 ${bgClass}`}>
                              <div className={`flex items-center gap-3 ${indent}`}>
                                <span className={`${textSize} font-black text-[var(--color-accent)] uppercase tracking-tight print:text-black`}>
                                  {item.res.test?.name}
                                </span>
                                <div className="h-px flex-1 bg-slate-200/50 print:bg-black/10" />
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <ResultRow
                          key={item.res.id}
                          res={item.res}
                          results={results}
                          testReferences={testReferences}
                          analysis={analysis}
                          isNFS={isNFS}
                          showPrev={SHOW_PREVIOUS_RESULT}
                        />
                      );
                    })}
                  </tbody>
                </table>
              );
            })}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
