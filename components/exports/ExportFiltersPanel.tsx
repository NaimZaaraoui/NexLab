'use client';

import { AlertCircle, Calendar, CheckCircle2, CircleCheckBig, Filter } from 'lucide-react';
import type { ExportConfigItem, ExportType, Category } from '@/components/exports/types';
import { ANALYSIS_STATUSES, AnalysisStatus } from '@/lib/analysis-status';

interface ExportFiltersPanelProps {
  exportType: ExportType;
  selectedConfig?: ExportConfigItem;
  loading: boolean;
  needsDateRange: boolean;
  needsCategoryFilter: boolean;
  needsStatusFilter: boolean;
  dateRange: { start: string; end: string };
  quickPreset: 'today' | 'month' | 'year' | 'custom';
  statusFilter: string;
  selectedCategory: string;
  categories: Category[];
  loadingCategories: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  onQuickRangeChange: (value: 'today' | 'month' | 'year') => void;
  onDateRangeChange: (field: 'start' | 'end', value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onExport: () => void;
}

export function ExportFiltersPanel({
  selectedConfig,
  loading,
  needsDateRange,
  needsCategoryFilter,
  needsStatusFilter,
  dateRange,
  quickPreset,
  statusFilter,
  selectedCategory,
  categories,
  loadingCategories,
  statusMessage,
  errorMessage,
  onQuickRangeChange,
  onDateRangeChange,
  onStatusFilterChange,
  onCategoryChange,
  onExport,
}: ExportFiltersPanelProps) {
  return (
    <div className="bento-panel p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          {selectedConfig && <selectedConfig.icon size={20} />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text)]">{selectedConfig?.label}</h3>
          <p className="text-xs text-[var(--color-text-soft)]">{selectedConfig?.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {needsDateRange && (
          <div className="space-y-4">
            <label className="form-label flex items-center gap-2">
              <Calendar size={14} /> Période
            </label>

            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1.5">
              <button
                type="button"
                onClick={() => onQuickRangeChange('today')}
                className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                  quickPreset === 'today'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-soft)] hover:bg-[var(--color-surface)]/80'
                }`}
              >
                Aujourd&apos;hui
              </button>
              <button
                type="button"
                onClick={() => onQuickRangeChange('month')}
                className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                  quickPreset === 'month'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-soft)] hover:bg-[var(--color-surface)]/80'
                }`}
              >
                Mois
              </button>
              <button
                type="button"
                onClick={() => onQuickRangeChange('year')}
                className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
                  quickPreset === 'year'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-soft)] hover:bg-[var(--color-surface)]/80'
                }`}
              >
                Année
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="section-label ml-1">Du</span>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(event) => onDateRangeChange('start', event.target.value)}
                  className="input-premium h-11 !text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <span className="section-label ml-1">Au</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(event) => onDateRangeChange('end', event.target.value)}
                  className="input-premium h-11 !text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {needsCategoryFilter && (
          <div className="space-y-4">
            <label className="form-label flex items-center gap-2">
              <Filter size={14} /> Catégorie de tests
            </label>
            <select
              value={selectedCategory}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="input-premium h-11 !text-sm"
              disabled={loadingCategories}
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} {category._count?.tests ? `(${category._count.tests})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] italic text-slate-400">
              Sélectionnez une catégorie pour exporter uniquement les tests de celle-ci.
            </p>
          </div>
        )}

        {needsStatusFilter && (
          <div className="space-y-4">
            <label className="form-label">Statut des analyses</label>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className="input-premium h-11 !text-sm"
            >

              <option value="">Tous les statuts</option>
              {(Object.entries(ANALYSIS_STATUSES) as [AnalysisStatus, {label: string}][]).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
          </div>
        )}

        {!needsDateRange && !needsCategoryFilter && !needsStatusFilter && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-muted)] p-4">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-slate-700">Aucune configuration requise</p>
                <p className="text-xs text-slate-400">Ce type d&apos;export utilise toutes les données disponibles.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {(statusMessage || errorMessage) && (
        <div
          className={`mt-5 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
            errorMessage
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {errorMessage ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CircleCheckBig size={16} className="mt-0.5 shrink-0" />}
          <span>{errorMessage || statusMessage}</span>
        </div>
      )}

      <button
        onClick={onExport}
        disabled={loading}
        className={`btn-primary-md mt-6 h-14 w-full text-sm font-semibold ${
          loading ? 'cursor-not-allowed border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-slate-400 shadow-none' : ''
        }`}
      >
        {loading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            Export en cours...
          </>
        ) : (
          <>
            <Calendar size={20} />
            Télécharger le fichier Excel
          </>
        )}
      </button>
    </div>
  );
}
