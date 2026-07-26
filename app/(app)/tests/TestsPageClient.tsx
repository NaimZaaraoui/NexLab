'use client';

import { useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageBackLink } from '@/components/ui/PageBackLink';
import { TestsList } from '@/components/tests/TestsList';
import type { CategoryOption, TestWithInventory, TestsLabSettings } from '@/components/tests/types';

export function TestsPageClient({
  initialTests,
  initialCategories,
  initialLabSettings,
}: {
  initialTests: TestWithInventory[];
  initialCategories: CategoryOption[];
  initialLabSettings: TestsLabSettings;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';

  const filteredTests = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return initialTests.filter((test) => {
      if (selectedCategory !== 'all' && (test.categoryId || 'uncategorized') !== selectedCategory) {
        return false;
      }
      if (term) {
        return (
          test.code.toLowerCase().includes(term) ||
          test.name.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [initialTests, searchQuery, selectedCategory]);

  const categoriesPresent = useMemo(() => {
    const map = new Map<string, { name: string; rank: number; icon?: string | null }>();
    filteredTests.forEach((test) => {
      const catId = test.categoryId || 'uncategorized';
      const catName = test.categoryRel?.name || 'Divers';
      const catRank = test.categoryRel?.rank ?? 9999;
      if (!map.has(catId)) {
        map.set(catId, {
          name: catName,
          rank: catRank,
          icon: test.categoryRel?.icon || null,
        });
      }
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.name.localeCompare(b.name)));
  }, [filteredTests]);

  const updateSearch = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    router.push(`/tests?${params.toString()}`);
  }, [router, searchParams]);

  const updateCategory = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('category');
    } else {
      params.set('category', value);
    }
    router.push(`/tests?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      <section className="bento-panel px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <PageBackLink href="/dashboard/settings" />

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2v8L8 14c0 1 1 3 3 3h2c2 0 2-2 2-2l-2-8V2" />
                  <path d="M8.5 2h7" />
                  <path d="M7 16h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--color-text)]">Catalogue d&apos;analyses</h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Gérer les paramètres biologiques et les plages de référence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TestsList
        filteredTests={filteredTests}
        allTests={initialTests}
        categories={initialCategories}
        categoriesPresent={categoriesPresent}
        labSettings={initialLabSettings}
        searchTerm={searchQuery}
        selectedCategory={selectedCategory}
        onSearchTermChange={updateSearch}
        onSelectedCategoryChange={updateCategory}
      />
    </div>
  );
}
