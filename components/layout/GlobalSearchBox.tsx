'use client';

import { Beaker, FileText, Loader2, Search, Users } from 'lucide-react';
import type { HeaderSearchResult } from '@/components/layout/types';

interface GlobalSearchBoxProps {
  searchQuery: string;
  isSearching: boolean;
  searchResults: HeaderSearchResult[];
  showSearchResults: boolean;
  searchRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSearchQueryChange: (value: string) => void;
  onFocus: () => void;
  onSelectResult: (result: HeaderSearchResult) => void;
}

export function GlobalSearchBox({
  searchQuery,
  isSearching,
  searchResults,
  showSearchResults,
  searchRef,
  searchInputRef,
  onSearchQueryChange,
  onFocus,
  onSelectResult,
}: GlobalSearchBoxProps) {
  const getIconByType = (type: HeaderSearchResult['type']) => {
    const icons = {
      patient: <Users className="h-4 w-4" />,
      analysis: <FileText className="h-4 w-4" />,
      result: <Beaker className="h-4 w-4" />,
    };

    return icons[type];
  };

  return (
    <div className="relative max-w-xl flex-1" ref={searchRef}>
      <div className="group relative">
        {isSearching ? (
          <Loader2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--color-accent)]" />
        ) : (
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-soft)] transition-colors group-focus-within:text-[var(--color-accent)]" />
        )}
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onFocus={onFocus}
          placeholder="Rechercher patient, analyse (Ctrl+K)..."
          className="h-11 w-full rounded-lg border bg-[var(--color-surface)] pl-11 pr-4 text-sm font-medium text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      {showSearchResults && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border bg-[var(--color-surface)] shadow-[0_10px_24px_rgba(15,31,51,0.08)]">
          <div className="max-h-[420px] overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelectResult(result)}
                className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--color-accent-soft)]/50"
              >
                <div className="mt-0.5 flex-shrink-0 text-[var(--color-text-soft)]">{getIconByType(result.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[var(--color-text)]">{result.title}</div>
                  {result.description && <div className="truncate text-xs text-[var(--color-text-soft)]">{result.description}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
