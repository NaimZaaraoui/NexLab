'use client';

import Link from 'next/link';
import { Activity, ArchiveRestore, ChevronRight } from 'lucide-react';
import { DatabaseSectionNav } from '@/components/database-settings/DatabaseSectionNav';

const sections = [
  {
    title: 'Sauvegardes',
    description: 'Créer, tester, importer, télécharger et restaurer les sauvegardes SQLite et bundles de reprise.',
    href: '/dashboard/settings/database/backups',
    icon: ArchiveRestore,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
  },
  {
    title: 'Supervision',
    description: 'Suivre la santé du système, la politique de rétention, la cible externe, la maintenance et l’historique.',
    href: '/dashboard/settings/database/supervision',
    icon: Activity,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
] as const;

export default function DatabaseSettingsOverviewPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <DatabaseSectionNav
        active="overview"
        title="Base de données"
        description="Choisissez un espace de travail simple selon ce que vous voulez faire maintenant : agir sur les sauvegardes ou superviser la protection du système."
      />

      <section className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group relative flex flex-col gap-6 overflow-hidden rounded-3xl border bg-[var(--color-surface)] p-6 text-left shadow-[0_8px_24px_rgba(15,31,51,0.05)] transition-all hover:ring-2 hover:ring-indigo-100"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${section.bg} ${section.color} transition-all group-hover:scale-105`}>
              <section.icon size={24} />
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)] transition-colors group-hover:text-indigo-600">
                {section.title}
              </h2>
              <p className="pr-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {section.description}
              </p>
            </div>

            <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-muted)] text-slate-300 shadow-sm transition-all group-hover:translate-x-1 group-hover:bg-indigo-600 group-hover:text-white">
              <ChevronRight size={20} />
            </div>

            <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full ${section.bg} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`} />
          </Link>
        ))}
      </section>
    </div>
  );
}
