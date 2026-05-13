'use client';

import { ShieldCheck, Wrench } from 'lucide-react';

interface DatabaseMaintenanceSectionProps {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  savingMaintenance: boolean;
  onMaintenanceModeToggle: () => void;
  onMaintenanceMessageChange: (value: string) => void;
  onSaveMaintenance: () => void;
}

export function DatabaseMaintenanceSection({
  maintenanceMode,
  maintenanceMessage,
  savingMaintenance,
  onMaintenanceModeToggle,
  onMaintenanceMessageChange,
  onSaveMaintenance,
}: DatabaseMaintenanceSectionProps) {
  return (
    <section className="bento-panel p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Wrench size={20} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Mode maintenance guide</h2>
              <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                Active une page d&apos;attente pour les utilisateurs non administrateurs avant une restauration ou une intervention sensible.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-2xl border bg-[var(--color-surface)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Maintenance active</p>
              <p className="text-xs text-[var(--color-text-soft)]">Les admins gardent l&apos;acces, les autres voient l&apos;ecran de maintenance.</p>
            </div>
            <button
              type="button"
              onClick={onMaintenanceModeToggle}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-[var(--color-surface)] transition ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <label className="block">
            <span className="form-label mb-1.5">Message affiche aux utilisateurs</span>
            <textarea
              value={maintenanceMessage}
              onChange={(event) => onMaintenanceMessageChange(event.target.value)}
              rows={4}
              className="input-premium min-h-[120px] w-full resize-y py-3"
              placeholder="Maintenance en cours. Merci de revenir dans quelques minutes."
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button onClick={onSaveMaintenance} className="btn-primary-sm" disabled={savingMaintenance}>
              <ShieldCheck size={16} />
              {savingMaintenance ? 'Enregistrement...' : 'Enregistrer le mode maintenance'}
            </button>
            <a href="/maintenance" className="btn-secondary-sm">
              Voir l&apos;ecran public
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
