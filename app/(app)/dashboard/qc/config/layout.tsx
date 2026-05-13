'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { Layers, Package } from 'lucide-react';

export default function QcConfigLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Matériels',
      href: '/dashboard/qc/config/materials',
      icon: Package,
      active: pathname === '/dashboard/qc/config/materials',
    },
    {
      name: 'Lots et Cibles',
      href: '/dashboard/qc/config/lots',
      icon: Layers,
      active: pathname === '/dashboard/qc/config/lots',
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-3xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Configuration QC</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">Matériels, lots et cibles du contrôle qualité.</p>
          </div>
          <div className="flex rounded-2xl bg-[var(--color-surface-muted)] p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  tab.active
                    ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-text-soft)] hover:text-[var(--color-text)]'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}
