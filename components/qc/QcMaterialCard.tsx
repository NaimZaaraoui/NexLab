'use client';

import Link from 'next/link';
import type { QcMaterial, QcLot } from '@/components/qc/types';

interface QcMaterialCardProps {
  material: QcMaterial;
  canWrite: boolean;
  onOpenEntry: (lot: QcLot) => void;
}

export function QcMaterialCard({ material, canWrite, onOpenEntry }: QcMaterialCardProps) {
  return (
    <article className="bento-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-text)]">{material.name}</div>
          <div className="mt-1 text-xs text-[var(--color-text-soft)]">{material.manufacturer || 'Fabricant non renseigné'}</div>
        </div>
        <span
          className={`status-pill ${
            material.level === 'Critique'
              ? 'status-pill-error'
              : material.level === 'Pathologique'
                ? 'status-pill-warning'
                : 'status-pill-info'
          }`}
        >
          {material.level}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {material.lots.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-[var(--color-text-soft)]">
            Aucun lot actif configuré pour ce matériel.
          </div>
        ) : (
          material.lots.map((lot) => {
            const lotStatisticalCount = lot.targets.filter((target) => target.controlMode === 'STATISTICAL').length;
            const lotAcceptanceCount = lot.targets.length - lotStatisticalCount;

            return (
              <div key={lot.id} className="rounded-2xl border bg-[var(--color-surface-muted)] px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text)]">Lot {lot.lotNumber}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-soft)]">
                      Expire le {new Date(lot.expiryDate).toLocaleDateString('fr-FR')} · {lot.targetsCount} paramètre(s)
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      {lotStatisticalCount > 0 && (
                        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-slate-700">
                          {lotStatisticalCount} statistique{lotStatisticalCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {lotAcceptanceCount > 0 && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                          {lotAcceptanceCount} plage{lotAcceptanceCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`status-pill ${
                      lot.todayResult?.status === 'fail'
                        ? 'status-pill-error'
                        : lot.todayResult?.status === 'warn'
                          ? 'status-pill-warning'
                          : lot.todayResult
                            ? 'status-pill-success'
                            : 'status-pill-warning'
                    }`}
                  >
                    {lot.todayResult
                      ? lot.todayResult.status === 'pass'
                        ? 'Conforme'
                        : lot.todayResult.status === 'warn'
                          ? 'Avertissement'
                          : 'Échec'
                      : 'Non effectué'}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[var(--color-text-soft)]">
                    {lot.lastResult
                      ? `Dernière saisie: ${new Date(lot.lastResult.performedAt).toLocaleString('fr-FR')}`
                      : 'Aucun résultat enregistré'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/qc/${lot.id}`} className="btn-secondary-sm">
                      Voir le graphique
                    </Link>
                    {canWrite && (
                      <button onClick={() => onOpenEntry(lot)} className="btn-primary-sm">
                        Saisir QC
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
