'use client';

import type { RangeBasis, TargetRow, TestOption } from '@/components/qc/config-types';
import { formatQcLimit, getEffectiveSd } from '@/components/qc/qc-config-helpers';

interface QcTargetRowEditorProps {
  row: TargetRow;
  index: number;
  tests: TestOption[];
  globalRangeBasis: RangeBasis;
  rangeBasisLabel: string;
  onChange: (index: number, next: TargetRow) => void;
}

export function QcTargetRowEditor({
  row,
  index,
  tests,
  globalRangeBasis,
  rangeBasisLabel,
  onChange,
}: QcTargetRowEditorProps) {
  const effectiveSd = getEffectiveSd(row, globalRangeBasis);
  const isValid = row.testCode && row.mean && (row.inputMode === 'sd' ? Number(row.sd) > 0 : (Number(row.minValue) < Number(row.maxValue)));

  return (
    <div className={`grid gap-5 rounded-3xl border p-6 transition-all ${isValid ? 'border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm' : 'border-amber-200 bg-amber-50/30 shadow-none'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-soft)] mb-2">Paramètre d&apos;analyse</label>
          <select
            className="input-premium h-11 bg-[var(--color-surface)] w-full"
            value={row.testId}
            onChange={(event) => {
              const test = tests.find((entry) => entry.id === event.target.value);
              onChange(index, {
                ...row,
                testId: event.target.value,
                testCode: test?.code || '',
                testName: test?.name || '',
                unit: test?.unit || '',
              });
            }}
          >
            <option value="">Sélectionner un test...</option>
            {tests.map((test) => (
              <option key={test.id} value={test.id}>{test.code} — {test.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-soft)] mb-2">Code</label>
            <input className="input-premium h-11 bg-[var(--color-surface)] w-full" value={row.testCode} onChange={(event) => onChange(index, { ...row, testCode: event.target.value })} placeholder="Ex: GLU" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-soft)] mb-2">Unité</label>
            <div
              contentEditable
              suppressContentEditableWarning
              className="input-premium h-11 bg-[var(--color-surface)] w-full overflow-hidden whitespace-nowrap flex items-center px-4"
              onBlur={(e) => onChange(index, { ...row, unit: e.currentTarget.innerHTML })}
              dangerouslySetInnerHTML={{ __html: row.unit }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Valeur Cible (Moyenne)</label>
            <input className="input-premium h-12 text-lg font-semibold bg-[var(--color-surface)] w-full" type="number" step="0.01" value={row.mean} onChange={(event) => onChange(index, { ...row, mean: event.target.value })} placeholder="0.00" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Méthode de définition</label>
            <select
              className="input-premium h-11 bg-[var(--color-surface)] w-full"
              value={row.inputMode}
              onChange={(event) => onChange(index, { ...row, inputMode: event.target.value as 'sd' | 'range' })}
            >
              <option value="range">Plage d&apos;acceptation (Min/Max)</option>
              <option value="sd">Écart-type statistique (SD)</option>
            </select>
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl bg-[var(--color-surface-muted)] border p-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-soft)] mb-4">Configuration des limites</h4>
          
          {row.inputMode === 'sd' ? (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-[var(--color-text)]">Valeur SD (1 SD)</span>
                <input
                  className="input-premium h-11 bg-[var(--color-surface)] w-full mt-1"
                  type="number"
                  step="0.0001"
                  value={row.sd}
                  onChange={(event) => onChange(index, { ...row, sd: event.target.value })}
                  placeholder="Ex: 0.12"
                />
              </label>
              <p className="text-[11px] text-[var(--color-text-soft)] leading-relaxed">
                Utilisez cette option si le fabricant fournit une valeur d&apos;écart-type précise. 
                Les zones d&apos;alerte seront calculées automatiquement selon {row.mean || '0'} ± n×SD.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-[var(--color-text)]">Minimum</span>
                  <input
                    className="input-premium h-11 bg-[var(--color-surface)] w-full mt-1"
                    type="number"
                    step="0.01"
                    value={row.minValue}
                    onChange={(event) => onChange(index, { ...row, minValue: event.target.value })}
                    placeholder="Min"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[var(--color-text)]">Maximum</span>
                  <input
                    className="input-premium h-11 bg-[var(--color-surface)] w-full mt-1"
                    type="number"
                    step="0.01"
                    value={row.maxValue}
                    onChange={(event) => onChange(index, { ...row, maxValue: event.target.value })}
                    placeholder="Max"
                  />
                </label>
              </div>
              <p className="text-[11px] text-[var(--color-text-soft)] leading-relaxed">
                La plage Min/Max sera convertie en SD interne selon l&apos;hypothèse globale ({rangeBasisLabel}). 
                Diviseur appliqué: {globalRangeBasis === '1sd' ? '2' : globalRangeBasis === '3sd' ? '6' : '4'}.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-soft)]">Aperçu des zones statistiques (Z-Scores)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="flex flex-col rounded-xl border border-blue-100 bg-blue-50/50 p-2.5">
            <span className="text-[10px] uppercase font-bold text-blue-600">Estimation SD</span>
            <span className="text-sm tabular-nums font-bold text-blue-900">{effectiveSd || '--'}</span>
          </div>
          <div className="flex flex-col rounded-xl border border-emerald-100 bg-emerald-50 p-2.5">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Zone 1 SD (Normal)</span>
            <span className="text-xs tabular-nums font-medium text-emerald-900">{formatQcLimit(row.mean, effectiveSd, -1)} — {formatQcLimit(row.mean, effectiveSd, 1)}</span>
          </div>
          <div className="flex flex-col rounded-xl border border-amber-100 bg-amber-50 p-2.5">
            <span className="text-[10px] uppercase font-bold text-amber-600">Zone 2 SD (Alerte)</span>
            <span className="text-xs tabular-nums font-medium text-amber-900">{formatQcLimit(row.mean, effectiveSd, -2)} — {formatQcLimit(row.mean, effectiveSd, 2)}</span>
          </div>
          <div className="flex flex-col rounded-xl border border-rose-100 bg-rose-50 p-2.5">
            <span className="text-[10px] uppercase font-bold text-rose-600">Zone 3 SD (Rejet)</span>
            <span className="text-xs tabular-nums font-medium text-rose-900">{formatQcLimit(row.mean, effectiveSd, -3)} — {formatQcLimit(row.mean, effectiveSd, 3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
