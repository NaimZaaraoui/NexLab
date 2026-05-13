'use client';

import Link from 'next/link';
import { PageBackLink } from '@/components/ui/PageBackLink';

interface DatabaseSectionNavProps {
  title: string;
  description: string;
  active: 'overview' | 'backups' | 'supervision';
}

const tabs = [
  { key: 'overview', label: 'Vue générale', href: '/dashboard/settings/database' },
  { key: 'backups', label: 'Sauvegardes', href: '/dashboard/settings/database/backups' },
  { key: 'supervision', label: 'Supervision', href: '/dashboard/settings/database/supervision' },
] as const;

export function DatabaseSectionNav({ title, description, active }: DatabaseSectionNavProps) {
  return (
    <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
      <PageBackLink href="/dashboard/settings" />
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = tab.key === active;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={
                  isActive
                    ? 'btn-secondary-sm border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                    : 'btn-secondary-sm'
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
