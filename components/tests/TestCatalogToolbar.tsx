'use client';

import Link from 'next/link';
import { Filter, Plus, Search, Settings2 } from 'lucide-react';
import type { CategoryOption } from '@/components/tests/types';

interface TestCatalogToolbarProps {
  searchTerm: string;
  selectedCategory: string;
  categories: CategoryOption[];
  onSearchTermChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onCreateTest: () => void;
  onImportTests: () => void;
  onExportTests?: () => void;
  isExporting?: boolean;
}

export function TestCatalogToolbar({
  searchTerm,
  selectedCategory,
  categories,
  onSearchTermChange,
  onSelectedCategoryChange,
  onCreateTest,
  onImportTests,
  onExportTests,
  isExporting,
}: TestCatalogToolbarProps) {
  return (
    <div className="bento-panel p-5 sm:p-6 flex flex-col xl:flex-row items-center gap-4 sm:gap-5">
      <div className="input-premium h-11 flex flex-1 items-center gap-2 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
        <input
          placeholder="Rechercher par code ou nom d'analyse..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          aria-label="Rechercher un test"
          className="h-full w-full border-0 bg-transparent px-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)]"
        />
      </div>

      <div className="flex items-center gap-3 w-full xl:w-auto">
        <div className="flex items-center gap-2 h-11 px-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] shrink-0">
          <Filter size={15} className="text-[var(--color-text-secondary)]" />
          <select
            value={selectedCategory}
            onChange={(event) => onSelectedCategoryChange(event.target.value)}
            aria-label="Filtrer les tests par catégorie"
            className="bg-transparent border-none text-sm font-medium text-[var(--color-text)] outline-none cursor-pointer"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <Link
          href="/tests/ordering"
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
        >
          <Settings2 size={16} />
          Catégories
        </Link>

        <button 
          onClick={onImportTests} 
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <span>Importer</span>
        </button>

        {onExportTests && (
          <button 
            onClick={onExportTests}
            disabled={isExporting} 
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] whitespace-nowrap disabled:opacity-50"
          >
            {isExporting ? (
               <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 16 12 21 17 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line></svg>
            )}
            <span>Exporter</span>
          </button>
        )}

        <button onClick={onCreateTest} className="btn-primary-md whitespace-nowrap">
          <Plus size={16} />
          <span>Nouveau Test</span>
        </button>
      </div>
    </div>
  );
}
