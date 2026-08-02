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
  const py = compact ? 'py-1' : 'py-1.5';

  const rowBg = flag
    ? 'bg-slate-100/80 print:bg-black/[0.045] transition-colors break-inside-avoid'
    : 'even:bg-[var(--color-surface-muted)]/30 print:even:bg-black/[0.02] transition-colors break-inside-avoid';

  const nameSize = hasParent ? 'text-[12px]' : 'text-[13px]';
  const nameWeight = hasParent
    ? 'font-semibold text-slate-700 print:text-black/80'
    : 'font-bold text-[var(--color-text)] print:text-black';

  return (
    <tr className={`group ${rowBg}`}>
      <td className={`${py} pl-4 relative`}>

        <div className={`flex flex-col ${hasParent ? 'pl-8' : 'pl-3'}`}>
          <span className={`${nameSize} ${nameWeight} uppercase tracking-tight ${flag ? '!font-black !text-slate-900 print:!text-black' : ''}`}>
            {test?.name}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-[0.08em] ${hasParent ? 'text-slate-200 print:text-black/25' : 'text-slate-300 print:text-black/40'}`}>
            {test?.code}
          </span>
        </div>
      </td>
      <td className={`${py} text-start`}>
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center justify-start gap-2">
            <span
              className={`font-mono tabular-nums tracking-normal print:text-black ${flag
                  ? 'text-[15px] font-black text-slate-900'
                  : 'text-[14px] font-semibold text-[var(--color-text)]'
                }`}
            >
              {displayValue || '—'}
            </span>
            {flag && (
              <span
                className={`inline-flex items-center justify-center text-[10px] font-black text-white uppercase leading-none px-1.5 py-0.5 min-w-[18px] print:text-white ${flag === 'H'
                    ? 'bg-slate-800 print:bg-black'
                    : 'bg-slate-700 print:bg-black'
                  }`}
                style={{ letterSpacing: '0.05em' }}
              >
                {flag}
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
      <td className={`${py} pr-4 text-right align-middle`}>
        {refVals && (
          refVals.display === 'QUALIT.' ? (
            <span className="text-slate-300 print:text-black/30 text-[11px] font-black tracking-[0.08em]">—</span>
          ) : (
            <div className="flex flex-col items-end justify-center gap-1">
              <span className="text-[12px] font-mono tabular-nums tracking-normal font-medium text-[var(--color-text)] print:text-black/70 leading-none">
                {refVals.display}
              </span>
              {refVals.min !== null && refVals.max !== null && (
                <div className="w-[50px] h-1.5 bg-slate-100 print:bg-black/5 rounded-full relative overflow-hidden shrink-0 mt-0.5 hidden print:block">
                  {/* Normal Range Area (Middle 60%) */}
                  <div
                    className="absolute h-full bg-slate-200 print:bg-black/[0.15]"
                    style={{ left: '20%', width: '60%' }}
                  />
                  {/* Value indicator marker */}
                  {(() => {
                    const v = parseFloat(val.replace(',', '.'));
                    if (isNaN(v)) return null;
                    let pos = 50;
                    if (v < refVals.min) {
                      pos = Math.max(0, (v / refVals.min) * 20);
                    } else if (v > refVals.max) {
                      const excess = (v - refVals.max) / (refVals.max === 0 ? 1 : refVals.max);
                      pos = Math.min(100, 80 + excess * 20);
                    } else {
                      const range = refVals.max - refVals.min;
                      pos = range === 0 ? 50 : 20 + ((v - refVals.min) / range) * 60;
                    }

                    const isAbnormal = v < refVals.min || v > refVals.max;
                    return (
                      <div
                        className={`absolute top-0 h-full w-[3px] shadow-sm ${isAbnormal
                            ? 'bg-slate-800 print:bg-black z-10'
                            : 'bg-slate-400 print:bg-black/60 z-10'
                          }`}
                        style={{ left: `clamp(0%, calc(${pos}% - 1.5px), calc(100% - 3px))` }}
                      />
                    );
                  })()}
                </div>
              )}
            </div>
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
                    {/* Category banner — solid dark band, highly visible on all printers */}
                    <tr>
                      <td
                        colSpan={colSpan}
                        className="py-[5px] px-4 bg-slate-900 print:bg-black"
                      >
                        <span className="text-[11px] font-black text-white uppercase tracking-[0.15em]">
                          {displayCategoryName}
                        </span>
                      </td>
                    </tr>
                    {/* Single column header for the entire category */}
                    <ColHeaderRow showPrev={SHOW_PREVIOUS_RESULT} />
                  </thead>
                  <tbody>
                    {displayItems.map((item) => {
                      if (item.kind === 'groupHeader') {
                        const indent = item.depth === 0 ? 'pl-4' : `pl-${4 + item.depth * 4}`;
                        const textSize = item.depth === 0 ? 'text-[13px]' : 'text-[12px]';
                        const bgClass = item.depth === 0
                          ? 'bg-[var(--color-surface-muted)]/30 print:bg-black/5'
                          : 'bg-[var(--color-surface-muted)]/15 print:bg-black/3';
                        return (
                          <tr key={`hdr-${item.res.id}`} className={`break-inside-avoid ${bgClass}`}>
                            <td colSpan={colSpan} className="py-1.5">
                              <div className={`flex items-center ${indent}`}>
                                <span className={`${textSize} font-black text-[var(--color-text)] uppercase tracking-tight print:text-black`}>
                                  {item.res.test?.name}
                                </span>
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
