import { Check, Search } from 'lucide-react';
import type { Test } from '@/lib/types';
import type { BilanOption } from './analyse-form-types';

interface AnalyseTestsPanelProps {
  searchTest: string;
  setSearchTest: (value: string) => void;
  bilans: BilanOption[];
  selectedTests: string[];
  toggleBilan: (bilan: BilanOption) => void;
  groupedTests: Record<string, Test[]>;
  toggleTest: (testId: string) => void;
}

export function AnalyseTestsPanel({
  searchTest,
  setSearchTest,
  bilans,
  selectedTests,
  toggleBilan,
  groupedTests,
  toggleTest,
}: AnalyseTestsPanelProps) {
  return (
    <div className="bento-panel flex h-full flex-col p-5 lg:p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4">
        <div className="input-premium flex h-11 w-full max-w-sm items-center gap-2 rounded-md bg-[var(--color-surface-muted)]">
          <Search className="h-4 w-4 text-slate-400 transition-colors" />
          <input
            placeholder="Chercher analyse..."
            value={searchTest}
            onChange={(e) => setSearchTest(e.target.value)}
            className="h-full w-full bg-[var(--color-surface-muted)] pr-4 text-sm font-medium outline-none"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {bilans.map((bilan) => {
            const bilanTestIds = bilan.tests.map((test) => test.id);
            const isSelected = bilanTestIds.length > 0 && bilanTestIds.every((id: string) => selectedTests.includes(id));
            return (
              <button
                key={bilan.id}
                type="button"
                onClick={() => toggleBilan(bilan)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
                }`}
              >
                {bilan.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 max-h-[620px] space-y-8 overflow-y-auto pr-1">
        {Object.entries(groupedTests).map(([category, categoryTests]) => (
          <div key={category} className="space-y-3">
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] py-2">
              <h3 className="section-label text-[var(--color-text-secondary)]">{category}</h3>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categoryTests.map((test) => {
                const isSelected = selectedTests.includes(test.id);
                const isChild = !!test.parentId;
                return (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => toggleTest(test.id)}
                    className={`group relative flex min-h-[84px] flex-col justify-center overflow-hidden rounded-md border px-3.5 py-3 text-left transition-colors ${
                      isSelected
                        ? 'border-slate-900 bg-[var(--color-surface-muted)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-slate-300 hover:bg-[var(--color-surface-muted)]'
                    } ${isChild ? 'ml-4 border-dashed opacity-80' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${isSelected ? 'text-[var(--color-text)]' : 'text-[var(--color-text-soft)]'}`}>
                          {test.code}
                        </span>
                        <span className={`mt-0.5 text-sm font-medium leading-tight ${isSelected ? 'text-[var(--color-text)]' : 'text-slate-700'}`}>
                          {test.name}
                        </span>
                      </div>
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                        isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-[var(--color-surface-muted)] group-hover:border-slate-500'
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={4} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
