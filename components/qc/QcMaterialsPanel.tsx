'use client';

import type React from 'react';
import { Plus, Trash2, ArrowRight, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LEVELS, type Material, type MaterialFormState } from '@/components/qc/config-types';

interface QcMaterialsPanelProps {
  materialForm: MaterialFormState;
  materialQuery: string;
  filteredMaterials: Material[];
  inactiveCount?: number;
  showInactive?: boolean;
  onToggleShowInactive?: () => void;
  onMaterialFormChange: React.Dispatch<React.SetStateAction<MaterialFormState>>;
  onMaterialQueryChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
  onToggle?: (id: string) => void | Promise<void>;
  onDelete?: (id: string, name: string) => void | Promise<void>;
}

export function QcMaterialsPanel({
  materialForm,
  materialQuery,
  filteredMaterials,
  inactiveCount = 0,
  showInactive = false,
  onToggleShowInactive,
  onMaterialFormChange,
  onMaterialQueryChange,
  onSubmit,
  onToggle,
  onDelete,
}: QcMaterialsPanelProps) {
  const router = useRouter();
  return (
    <article className="bento-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Matériels</h2>
      <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
        <input
          className="input-premium h-11 bg-[var(--color-surface)]"
          value={materialForm.name}
          onChange={(event) => onMaterialFormChange((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Nom du matériel QC"
          required
        />
        <select
          className="input-premium h-11 bg-[var(--color-surface)]"
          value={materialForm.level}
          onChange={(event) => onMaterialFormChange((prev) => ({ ...prev, level: event.target.value }))}
        >
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <input
          className="input-premium h-11 bg-[var(--color-surface)]"
          value={materialForm.manufacturer}
          onChange={(event) => onMaterialFormChange((prev) => ({ ...prev, manufacturer: event.target.value }))}
          placeholder="Fabricant"
        />
        <button className="btn-primary-md justify-center" type="submit">
          <Plus className="h-4 w-4" />
          Ajouter le matériel
        </button>
      </form>

      <div className="mt-5 space-y-2">
        <input
          className="input-premium h-11 bg-[var(--color-surface)]"
          value={materialQuery}
          onChange={(event) => onMaterialQueryChange(event.target.value)}
          placeholder="Rechercher un matériel, un lot ou un test QC"
        />
        {inactiveCount > 0 && onToggleShowInactive && (
          <button
            type="button"
            onClick={onToggleShowInactive}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
          >
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-surface-muted)] px-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
              {inactiveCount}
            </span>
            {showInactive ? 'Masquer les inactifs' : 'Afficher les inactifs'}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {filteredMaterials.map((material) => (
          <div 
            key={material.id} 
            className={`group relative rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3 hover:bg-[var(--color-surface)] hover:shadow-md transition-all cursor-pointer border-transparent hover:border-[var(--color-accent-soft)] ${
              !material.isActive ? 'opacity-50 hover:opacity-80' : ''
            }`}
            onClick={() => router.push(`/dashboard/qc/config/lots?materialId=${material.id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">{material.name}</div>
                  <ArrowRight size={12} className="text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {material.level} · {material.manufacturer || 'Sans fabricant'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!material.isActive && (
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
                    Inactif
                  </span>
                )}
                <div className="rounded-full bg-[var(--color-surface)]/80 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
                  {material.lots.length} lot{material.lots.length > 1 ? 's' : ''}
                </div>
                {onToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(material.id);
                    }}
                    className={`p-1.5 rounded-lg transition-all relative z-10 ${
                      material.isActive
                        ? 'text-slate-500 hover:text-amber-500 hover:bg-[var(--color-surface)]'
                        : 'text-emerald-500 hover:text-emerald-600 hover:bg-[var(--color-surface)]'
                    }`}
                    title={material.isActive ? 'Désactiver le matériel' : 'Réactiver le matériel'}
                  >
                    <Power size={14} />
                  </button>
                )}
                {onDelete && material.lots.length === 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(material.id, material.name);
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-[var(--color-surface)] rounded-lg transition-all relative z-10"
                    title="Supprimer le matériel"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredMaterials.length === 0 && (
          <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-[var(--color-text-secondary)]">
            Aucun matériel ou lot QC ne correspond à cette recherche.
          </div>
        )}
      </div>
    </article>
  );
}
