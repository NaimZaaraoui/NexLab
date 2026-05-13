'use client';

import { MobileMenuProvider, useMobileMenu } from '@/contexts/MobileMenuContext';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import type { ReactNode } from 'react';
import { Command, FlaskConical, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

function RightContentPane() {
  return (
    <aside className="app-right-pane">
      <div className="sticky top-[5.5rem] flex flex-col gap-4">
        <section className="pane-card">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Raccourcis</h3>
          <div className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center justify-between rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2">
              <span className="inline-flex items-center gap-2">
                <Command className="h-4 w-4 text-[var(--color-accent)]" />
                Recherche globale
              </span>
              <span className="rounded-lg border bg-[var(--color-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-soft)]">Ctrl + K</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-2">
              <span>Passer au champ suivant</span>
              <span className="rounded-lg border bg-[var(--color-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-soft)]">Entrée</span>
            </div>
          </div>
        </section>
        <section className="pane-card">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Statuts critiques</h3>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-[var(--color-critical)]">
              <ShieldAlert className="h-4 w-4" />
              Validation urgente
            </p>
            <p className="flex items-center gap-2 text-[var(--color-warning)]">
              <FlaskConical className="h-4 w-4" />
              Résultat hors intervalle
            </p>
          </div>
        </section>
      </div>
    </aside>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const { isCollapsed } = useMobileMenu();

  return (
    <div className="app-shell flex bg-transparent">
      <Navigation />
      <div
        className={cn(
          'app-main min-w-0 flex-1 transition-[margin] duration-300',
          isCollapsed ? 'lg:ml-[var(--shell-nav-width-collapsed)]' : 'lg:ml-[var(--shell-nav-width)]'
        )}
      >
        <Header />
        <div className="app-workspace">
          <div className="mx-auto flex w-full max-w-[1680px] gap-5">
            <main className="min-w-0 flex-1">
              <div className="app-content">{children}</div>
            </main>
            <RightContentPane />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <MobileMenuProvider>
      <AppShell>{children}</AppShell>
    </MobileMenuProvider>
  );
}
