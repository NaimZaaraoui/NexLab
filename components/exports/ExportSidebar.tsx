'use client';

import { CheckCircle2, Clock3 } from 'lucide-react';

interface ExportSidebarProps {
  selectedLabel?: string;
  loading: boolean;
  needsDateRange: boolean;
  dateRange: { start: string; end: string };
  columnsPreview: string[];
}

export function ExportSidebar({
  selectedLabel,
  loading,
  needsDateRange,
  dateRange,
  columnsPreview,
}: ExportSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="bento-panel relative overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-blue-700 p-6 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--color-surface)]/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />

        <div className="relative">
          <h3 className="mb-2 text-lg font-black">Export rapide</h3>
          <p className="mb-6 text-sm leading-relaxed text-indigo-100">
            Sélectionnez un type d&apos;export, configurez les filtres si nécessaire, et téléchargez vos données en un clic.
          </p>

          <div className="space-y-2">
            {[
              'Format XLSX compatible Excel',
              'Dates au format DD/MM/YYYY',
              'Colonnes pré-formatées',
              'Filtres avancés disponibles',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs font-medium text-indigo-100">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bento-panel p-6">
        <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Colonnes incluses
        </h4>
        <div className="flex flex-wrap gap-2">
          {columnsPreview.map((column) => (
            <span
              key={column}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-text-secondary)]"
            >
              {column}
            </span>
          ))}
        </div>
      </div>

      <div className="bento-panel p-6">
        <h4 className="form-label mb-4 flex items-center gap-2">
          <Clock3 size={14} />
          Statut export
        </h4>
        <div className="space-y-2 text-xs text-[var(--color-text-soft)]">
          <p>
            Type: <span className="font-semibold text-[var(--color-text)]">{selectedLabel}</span>
          </p>
          {needsDateRange && (
            <p>
              Période: <span className="font-semibold text-[var(--color-text)]">{dateRange.start} → {dateRange.end}</span>
            </p>
          )}
          <p>
            État: <span className="font-semibold text-[var(--color-text)]">{loading ? 'Traitement...' : 'Prêt à exporter'}</span>
          </p>
        </div>
      </div>

      <div className="bento-panel bg-[var(--color-surface-muted)]/50 p-6">
        <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Conseils</h4>
        <ul className="space-y-3">
          {[
            'Utilisez "Mois" pour les statistiques mensuelles',
            'Filtrez par catégorie pour le catalogue',
            'Le statut "Validé Bio" = résultats certifiés',
          ].map((tip, index) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-[var(--color-text-soft)]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-accent)]">
                {index + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
