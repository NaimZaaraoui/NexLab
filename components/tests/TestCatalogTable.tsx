'use client';

import { Beaker, Layers, Package, Pencil, Trash2 } from 'lucide-react';
import { getCategoryIcon } from '@/lib/category-icons';
import { isCalculatedFormulaTest } from '@/lib/calculated-tests';
import type { CategoryOption, TestWithInventory, TestsLabSettings } from '@/components/tests/types';

type VisibleCategory = CategoryOption & {
  icon?: string | null;
};

interface TestCatalogTableProps {
  categoriesPresent: VisibleCategory[];
  filteredTests: TestWithInventory[];
  allTests: TestWithInventory[];
  labSettings: TestsLabSettings;
  onOpenInventory: (test: TestWithInventory) => void;
  onEdit: (test: TestWithInventory) => void;
  onDelete: (test: TestWithInventory) => void;
}

export function TestCatalogTable({
  categoriesPresent,
  filteredTests,
  allTests,
  labSettings,
  onOpenInventory,
  onEdit,
  onDelete,
}: TestCatalogTableProps) {
  if (categoriesPresent.length === 0) {
    return (
      <div className="bento-panel py-24 text-center flex flex-col items-center opacity-80">
        <div className="w-16 h-16 bg-[var(--color-surface-muted)] text-slate-300 rounded-2xl flex items-center justify-center mb-4">
          <Beaker size={28} />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Aucun test trouve</h3>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {categoriesPresent.map((category) => {
        const categoryTests = filteredTests.filter(
          (test) => (test.categoryId || 'uncategorized') === category.id
        );
        if (categoryTests.length === 0) return null;

        const CategoryIcon = getCategoryIcon(category.icon);

        return (
          <div key={category.id} className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center">
                <CategoryIcon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)] tracking-tight flex items-center gap-2">
                  {category.name}
                  <span className="text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded-full tracking-normal">{categoryTests.length}</span>
                </h2>
              </div>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            <div className="bento-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)]">
                      <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide w-24">Code</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide">Analyse</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Echantillon</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Type</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Reference</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Montant</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-center">Conso</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-[var(--color-text-soft)] uppercase tracking-wide text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]/60">
                    {categoryTests.map((test) => {
                      const isChild = !!test.parentId;
                      return (
                        <tr
                          key={test.id}
                          className={`group transition-colors hover:bg-[var(--color-surface-muted)]/80 ${isChild ? 'bg-[var(--color-surface-muted)]/40' : ''}`}
                        >
                          <td className="px-5 py-3.5 align-middle">
                            <span className="text-[11px] font-semibold text-[var(--color-accent)] tracking-wide uppercase">
                              {test.code}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium text-[var(--color-text)] ${isChild ? 'pl-3 border-l-2 border-[var(--color-border)] ml-1' : ''}`}>
                                {test.name}
                              </span>
                              {test.isGroup && (
                                <span className="text-[11px] font-medium text-[var(--color-text-soft)] mt-0.5">
                                  Panel ({allTests.filter((item) => item.parentId === test.id).length} parametres)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 align-middle text-center">
                            <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">
                              {test.sampleType || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 align-middle text-center">
                              <span className={`status-pill ${test.isGroup ? 'bg-indigo-50 text-[var(--color-accent)]' : isCalculatedFormulaTest(test) ? 'bg-violet-50 text-violet-700' : test.resultType === 'numeric' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {test.isGroup ? 'Panel' : isCalculatedFormulaTest(test) ? 'Calc' : test.resultType === 'numeric' ? 'Num' : 'Texte'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 align-middle text-center">
                            {test.isGroup ? (
                              <Layers size={14} className="mx-auto text-indigo-300" />
                            ) : test.resultType === 'numeric' || test.resultType === 'calculated' ? (
                              <div className="flex flex-col items-center justify-center gap-1">
                                {test.minValueM !== null || test.maxValueM !== null || test.minValueF !== null || test.maxValueF !== null ? (
                                  <div className="flex gap-4 text-[11px] font-bold">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-3 h-3 rounded-[3px] bg-indigo-100 flex items-center justify-center text-[8px] text-[var(--color-accent)]">H</span>
                                      <span className="text-slate-700">{test.minValueM ?? '0'} — {test.maxValueM ?? '∞'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-3 h-3 rounded-[3px] bg-rose-100 flex items-center justify-center text-[8px] text-rose-600">F</span>
                                      <span className="text-slate-700">{test.minValueF ?? '0'} — {test.maxValueF ?? '∞'}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-slate-700">
                                    {test.minValue ?? '0'} — {test.maxValue ?? '∞'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 align-middle text-center">
                            <span className="text-sm font-semibold text-[var(--color-accent)]">
                              {test.price?.toLocaleString()} <span className="text-[11px] font-medium text-[var(--color-text-soft)]">{labSettings.amount_unit}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5 align-middle text-center">
                            <div className="flex items-center justify-center">
                              {(test._count?.inventoryRules || 0) > 0 ? (
                                <span className="status-pill status-pill-info">
                                  {test._count?.inventoryRules} regle{(test._count?.inventoryRules || 0) > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-[var(--color-text-soft)]">Aucune</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 align-middle text-right">
                            <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onOpenInventory(test)}
                                className="p-2 text-slate-400 hover:text-[var(--color-accent)] hover:bg-[var(--color-surface)] rounded-lg transition-all shadow-sm border border-transparent hover:border-blue-100"
                                title="Configurer consommation"
                              >
                                <Package size={14} />
                              </button>
                              <button
                                onClick={() => onEdit(test)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-[var(--color-surface)] rounded-lg transition-all shadow-sm border border-transparent hover:border-indigo-100"
                                title="Modifier"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => onDelete(test)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-[var(--color-surface)] rounded-lg transition-all shadow-sm border border-transparent hover:border-rose-100"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
