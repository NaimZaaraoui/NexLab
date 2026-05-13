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
}

export function TestCatalogToolbar({
  searchTerm,
  selectedCategory,
  categories,
  onSearchTermChange,
  onSelectedCategoryChange,
  onCreateTest,
}: TestCatalogToolbarProps) {
  return (
    <div className="bento-panel p-5 sm:p-6 flex flex-col xl:flex-row items-center gap-4 sm:gap-5">
      <div className="input-premium h-11 flex flex-1 items-center gap-2 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-[var(--color-text-soft)]" />
        <input
          placeholder="Rechercher par code ou nom d'analyse..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          aria-label="Rechercher un test"
          className="h-full w-full border-0 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)]"
        />
      </div>

      <div className="flex items-center gap-3 w-full xl:w-auto">
        <div className="flex items-center gap-2 h-11 px-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] shrink-0">
          <Filter size={15} className="text-[var(--color-text-soft)]" />
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

        <button onClick={onCreateTest} className="btn-primary-md whitespace-nowrap">
          <Plus size={16} />
          <span>Nouveau Test</span>
        </button>
      </div>
    </div>
  );
}
