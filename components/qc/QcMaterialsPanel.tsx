'use client';

import type React from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LEVELS, type Material, type MaterialFormState } from '@/components/qc/config-types';

interface QcMaterialsPanelProps {
  materialForm: MaterialFormState;
  materialQuery: string;
  filteredMaterials: Material[];
  onMaterialFormChange: React.Dispatch<React.SetStateAction<MaterialFormState>>;
  onMaterialQueryChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
  onDelete?: (id: string, name: string) => void | Promise<void>;
}

export function QcMaterialsPanel({
  materialForm,
  materialQuery,
  filteredMaterials,
  onMaterialFormChange,
  onMaterialQueryChange,
  onSubmit,
  onDelete,
}: QcMaterialsPanelProps) {
  const router = useRouter();
  return (
    <article className="bento-panel p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Matériels</h2>
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

      <div className="mt-5">
        <input
          className="input-premium h-11 bg-[var(--color-surface)]"
          value={materialQuery}
          onChange={(event) => onMaterialQueryChange(event.target.value)}
          placeholder="Rechercher un matériel, un lot ou un test QC"
        />
      </div>

      <div className="mt-5 space-y-3">
        {filteredMaterials.map((material) => (
          <div 
            key={material.id} 
            className="group relative rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-3 hover:bg-[var(--color-surface)] hover:shadow-md transition-all cursor-pointer border-transparent hover:border-[var(--color-accent-soft)]"
            onClick={() => router.push(`/dashboard/qc/config/lots?materialId=${material.id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">{material.name}</div>
                  <ArrowRight size={12} className="text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                  {material.level} · {material.manufacturer || 'Sans fabricant'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-[var(--color-surface)]/80 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-soft)]">
                  {material.lots.length} lot{material.lots.length > 1 ? 's' : ''}
                </div>
                {onDelete && material.lots.length === 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(material.id, material.name);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-[var(--color-surface)] rounded-lg transition-all relative z-10"
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
          <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-[var(--color-text-soft)]">
            Aucun matériel ou lot QC ne correspond à cette recherche.
          </div>
        )}
      </div>
    </article>
  );
}
