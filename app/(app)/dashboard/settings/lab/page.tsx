'use client';

import { Beaker } from 'lucide-react';
import { LabSettingsForm } from './LabSettingsForm';
import { PageBackLink } from '@/components/ui/PageBackLink';

export default function LabSettingsPage() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <PageBackLink href="/dashboard/settings" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                <Beaker size={20} />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">Configuration métier</h1>
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Gérer les types d&apos;échantillons et les paramètres financiers.
            </p>
          </div>
        </div>
      </section>

      <LabSettingsForm />
    </div>
  );
}
