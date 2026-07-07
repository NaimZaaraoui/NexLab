'use client';

import { useState, useRef, useEffect } from 'react';
import { COMMON_LOINC_CODES } from '@/lib/loinc/loinc-common';

interface LoincComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function LoincCombobox({ value, onChange }: LoincComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim().length === 0
    ? []
    : COMMON_LOINC_CODES.filter(
        (entry) =>
          entry.name.toLowerCase().includes(query.toLowerCase()) ||
          entry.code.includes(query)
      ).slice(0, 8);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setOpen(true);
  };

  const handleSelect = (code: string, name: string) => {
    setQuery(code);
    onChange(code);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
  };

  const groupedFiltered = filtered.reduce<Record<string, typeof filtered>>((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim().length > 0 && setOpen(true)}
          placeholder="Ex: glycémie ou 14749-6"
          className="input-premium h-11 bg-[var(--color-surface)] w-full pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            aria-label="Effacer"
          >
            ✕
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {Object.entries(groupedFiltered).map(([category, entries]) => (
              <div key={category}>
                <div className="sticky top-0 bg-[var(--color-surface-muted)] px-3 py-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
                    {category}
                  </span>
                </div>
                {entries.map((entry) => (
                  <button
                    key={entry.code}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(entry.code, entry.name)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-surface-muted)] transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-[var(--color-accent)] min-w-[60px]">
                      {entry.code}
                    </span>
                    <span className="text-sm text-[var(--color-text)] truncate">
                      {entry.name}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-border)] px-3 py-2">
            <p className="text-[10px] text-[var(--color-text-secondary)]">
              Code non trouvé ? Saisissez-le directement (ex: 14749-6).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
