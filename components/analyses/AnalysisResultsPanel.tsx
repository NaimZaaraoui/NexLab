import { Beaker } from 'lucide-react';
import { AnalysisChartsTab } from './AnalysisChartsTab';
import { CbcIndicesPanel } from './CbcIndicesPanel';
import { AnalysisResultRow } from './AnalysisResultRow';
import { AnalysisResultsToolbar } from './AnalysisResultsToolbar';
import { AnalysisValidationFooter } from './AnalysisValidationFooter';
import { calculateCbcIndices, isResultAbnormal } from '@/lib/clinical/calculations';
import { isAnalysisFinalValidated } from '@/lib/analysis/status-flow';

import { useAnalysisContext } from './AnalysisContext';

export function AnalysisResultsPanel() {
  const {
    analysis,
    activeTab,
    sortedResults,
    results,
    cbcIndicesEnabled,
  } = useAnalysisContext();

  const isFinalValidated = isAnalysisFinalValidated(analysis?.status);
  if (!analysis) return null;

  const cbcIndices = cbcIndicesEnabled ? calculateCbcIndices(analysis, results) : [];

  return (
    <div className="rounded-xl border bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)] lg:p-6">
      <AnalysisResultsToolbar />

      <div className="space-y-1">
        {activeTab === 'charts' && <AnalysisChartsTab analysis={analysis} results={results} />}
        {activeTab === 'indices' && <CbcIndicesPanel indices={cbcIndices} />}

        {activeTab !== 'charts' && activeTab !== 'indices' ? (() => {
          let currentCategory = '';
          return sortedResults.map((result, index) => {
            const test = result.test;
            if (!test) return null;

            const renderCategory = result.renderCategory || test.categoryRel?.name || 'Divers';
            const showCategoryHeader = renderCategory !== currentCategory;

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

            const isGroup = test.isGroup;
            const displayName = test.name;
            const abnormal = isResultAbnormal(results[result.id], result, analysis.patientGender);

            if (activeTab === 'urgent' && !abnormal) return null;

            return (
              <div key={result.id}>
                {categoryHeader}
                {isGroup ? (
                   <div className="flex items-center gap-3 py-3 mt-4 mb-1">
                     <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-[0.08em]">
                       {displayName} <span className="ml-2 text-xs text-slate-500 font-normal">({test.code})</span>
                     </h3>
                     <div className="h-px flex-1 bg-[var(--color-surface-muted)]" />
                   </div>
                ) : (
                  <AnalysisResultRow
                    analysis={analysis}
                    result={result}
                    index={index}
                    total={sortedResults.length}
                    isFinalValidated={isFinalValidated}
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
