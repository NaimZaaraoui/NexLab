import { useMemo, useState } from 'react';
import { Beaker } from 'lucide-react';
import { AnalysisChartsTab } from './AnalysisChartsTab';
import { CbcIndicesPanel } from './CbcIndicesPanel';
import { AnalysisResultRow } from './AnalysisResultRow';
import { AnalysisResultsToolbar } from './AnalysisResultsToolbar';
import { AnalysisValidationFooter } from './AnalysisValidationFooter';
import { calculateCbcIndices, isResultAbnormal } from '@/lib/clinical/calculations';

import { useAnalysisContext } from './AnalysisContext';

export function AnalysisResultsPanel() {
  const {
    analysis,
    activeTab,
    sortedResults,
    results,
    cbcIndicesEnabled,
    totalCount,
    selectedIds,
    toggleGroupSelection,
    isFinalValidated,
  } = useAnalysisContext();

  const cbcIndices = analysis && cbcIndicesEnabled ? calculateCbcIndices(analysis, results) : [];
  const [selectedCategory, setSelectedCategory] = useState('all');
  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();

    sortedResults.forEach((result) => {
      if (result.test?.isGroup) return;
      const category = result.renderCategory || result.test?.categoryRel?.name || 'Divers';
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [sortedResults]);

  const activeCategory = selectedCategory === 'all' || categoryTabs.some((category) => category.name === selectedCategory)
    ? selectedCategory
    : 'all';

  const visibleResults = useMemo(() => (
    sortedResults.filter((result) => {
      const test = result.test;
      if (!test || !analysis) return false;

      if (activeTab === 'urgent' && !isResultAbnormal(results[result.id], result, analysis.patient?.gender)) {
        return false;
      }

      if (activeCategory === 'all') return true;
      const category = result.renderCategory || test.categoryRel?.name || 'Divers';
      return category === activeCategory;
    })
  ), [activeCategory, activeTab, analysis, results, sortedResults]);
  const titleResultIds = useMemo(() => {
    const parentTestIds = new Set(
      visibleResults
        .map((result) => result.test?.parentId)
        .filter((parentId): parentId is string => Boolean(parentId))
    );

    return new Set(
      visibleResults
        .filter((result) => result.test?.isGroup || parentTestIds.has(result.testId))
        .map((result) => result.id)
    );
  }, [visibleResults]);
  const inputResultIds = useMemo(() => (
    visibleResults
      .filter((result) => !titleResultIds.has(result.id))
      .map((result) => result.id)
  ), [titleResultIds, visibleResults]);
  const showCategoryTabs = activeTab !== 'charts' && activeTab !== 'indices' && categoryTabs.length > 1;

  if (!analysis) return null;

  return (
    <div className="rounded-xl border bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)] lg:p-6">
      <AnalysisResultsToolbar />

      {showCategoryTabs && (
        <div className="mb-5 flex gap-2 overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeCategory === 'all'
                ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
            }`}
          >
            Tous ({totalCount})
          </button>
          {categoryTabs.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => setSelectedCategory(category.name)}
              className={`shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeCategory === category.name
                  ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        {activeTab === 'charts' && <AnalysisChartsTab analysis={analysis} results={results} />}
        {activeTab === 'indices' && <CbcIndicesPanel indices={cbcIndices} />}

        {activeTab !== 'charts' && activeTab !== 'indices' ? (() => {
          let currentCategory = '';
          return visibleResults.map((result, index) => {
            const test = result.test;
            if (!test) return null;

            const renderCategory = result.renderCategory || test.categoryRel?.name || 'Divers';
            const showCategoryHeader = activeCategory === 'all' && renderCategory !== currentCategory;

            let categoryHeader = null;
            if (showCategoryHeader) {
              currentCategory = renderCategory;
              categoryHeader = (
                <div key={`cat-${renderCategory}`} className="flex items-center gap-3 pt-6 pb-3 mt-4 first:mt-0 first:pt-0">
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.08em]">
                    {renderCategory}
                  </h3>
                  <div className="h-px flex-1 bg-[var(--color-surface-muted)]" />
                </div>
              );
            }

            const isTitle = titleResultIds.has(result.id);
            const displayName = test.name;
            const inputIndex = inputResultIds.indexOf(result.id);

            // Compute child IDs for this parent group (needed for checkbox)
            const groupChildIds = isTitle
              ? visibleResults
                  .filter((r) => r.test?.parentId === result.testId)
                  .map((r) => r.id)
              : [];
            const groupAllSelected = groupChildIds.length > 0 && groupChildIds.every((id) => selectedIds.includes(id));
            const groupSomeSelected = !groupAllSelected && groupChildIds.some((id) => selectedIds.includes(id));

            return (
              <div key={result.id}>
                {categoryHeader}
                {isTitle ? (
                   <div className="flex items-center gap-3 py-3 mt-4 mb-1">
                     {isFinalValidated && groupChildIds.length > 0 && (
                       <div
                         onClick={() => toggleGroupSelection(groupChildIds)}
                         className={`flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border-2 transition-all ${
                           groupAllSelected
                             ? 'border-indigo-600 bg-indigo-600'
                             : groupSomeSelected
                               ? 'border-indigo-400 bg-indigo-100'
                               : 'border-slate-300 hover:border-indigo-400'
                         }`}
                       >
                         {groupAllSelected && (
                           <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                             <polyline points="1.5,5 4,7.5 8.5,2" />
                           </svg>
                         )}
                         {groupSomeSelected && (
                           <svg viewBox="0 0 10 10" className="w-2 h-2 text-indigo-600" fill="currentColor">
                             <rect x="1.5" y="4" width="7" height="2" rx="1" />
                           </svg>
                         )}
                       </div>
                     )}
                     <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-[0.08em]">
                       {displayName} <span className="ml-2 text-xs text-slate-500 font-normal">({test.code})</span>
                     </h3>
                     <div className="h-px flex-1 bg-[var(--color-surface-muted)]" />
                   </div>
                ) : (
                  <AnalysisResultRow
                    analysis={analysis}
                    result={result}
                    index={inputIndex >= 0 ? inputIndex : index}
                    total={inputResultIds.length}
                    isFinalValidated={isFinalValidated}
                    navigationIds={inputResultIds}
                  />
                )}
              </div>
            );
          });
        })() : null}
      </div>

      {analysis.results.length === 0 && (
        <div className="py-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[var(--color-surface-muted)] rounded-full mx-auto flex items-center justify-center text-slate-300 mb-4">
            <Beaker size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Aucun test configuré</h3>
          <p className="text-sm text-slate-500 mt-1">Veuillez vérifier la configuration de cette analyse.</p>
        </div>
      )}

      {analysis.results.length > 0 && (
        <AnalysisValidationFooter />
      )}
    </div>
  );
}
