'use client';

import { AlertTriangle } from 'lucide-react';
import type { HealthResponse } from '@/components/database-settings/types';

interface DatabaseMaintenanceOverviewProps {
  label: string;
  description: string;
  tone: 'ok' | 'warning' | 'alert';
  health: HealthResponse | null;
  warningItems: string[];
}

export function DatabaseMaintenanceOverview({
  label,
  description,
  tone,
  health,
  warningItems,
}: DatabaseMaintenanceOverviewProps) {
  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="bento-panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Dernier backup</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--color-text)]">{label}</h2>
              <p className="mt-2 text-sm text-[var(--color-text-soft)]">{description}</p>
            </div>
            <span className={tone === 'ok' ? 'status-pill rounded-md px-2.5 py-1 status-pill-success' : tone === 'warning' ? 'status-pill rounded-md px-2.5 py-1 status-pill-warning' : 'status-pill rounded-md px-2.5 py-1 status-pill-error'}>
              {tone === 'ok' ? 'OK' : tone === 'warning' ? 'Attention' : 'Urgent'}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Base active</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {health?.database.reachable && health?.database.fileExists ? 'Connectée et présente' : 'À vérifier'}
              </p>
            </div>
            <div className="rounded-md border bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Copies locales</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {health?.backups.count ? `${health.backups.count} sauvegarde(s)` : 'Aucune sauvegarde'}
              </p>
            </div>
            <div className="rounded-md border bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Copies externes</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {health?.externalTarget.configuredPath
                  ? health.externalTarget.available
                    ? 'Prêtes sur support externe'
                    : 'Support externe indisponible'
                  : 'Non configurées'}
              </p>
            </div>
          </div>
        </article>

        <article className="bento-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Lecture simple</p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--color-text)]">Ce qui protège le labo</h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--color-text-soft)]">
            <p>1. Une sauvegarde SQLite locale régulière.</p>
            <p>2. Un bundle de reprise avec base + uploads.</p>
            <p>3. Une copie vers un disque ou dossier externe.</p>
          </div>
        </article>
      </section>

      {warningItems.length > 0 && (
        <section className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700">
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-slate-800">Points d’attention sauvegarde</h2>
              <div className="mt-3 space-y-2">
                {warningItems.map((item) => (
                  <p key={item} className="text-sm text-slate-600">{item}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
