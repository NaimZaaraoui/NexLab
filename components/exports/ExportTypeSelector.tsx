'use client';

import type { ExportConfigItem, ExportType } from '@/components/exports/types';

interface ExportTypeSelectorProps {
  exportType: ExportType;
  config: readonly ExportConfigItem[];
  onChange: (value: ExportType) => void;
}

export function ExportTypeSelector({ exportType, config, onChange }: ExportTypeSelectorProps) {
  return (
    <div className="bento-panel p-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {config.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`group flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
              exportType === item.id
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-slate-300'
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                exportType === item.id
                  ? 'bg-[var(--color-accent)] text-white shadow-[0_6px_14px_rgba(31,111,235,0.22)]'
                  : 'bg-[var(--color-surface-muted)] text-[var(--color-accent)]'
              }`}
            >
              <item.icon size={24} />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-sm font-bold text-[var(--color-text)]">{item.label}</div>
              <div className="text-[11px] leading-relaxed text-[var(--color-text-soft)]">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
