'use client';

import { MobileMenuProvider, useMobileMenu } from '@/components/providers/MobileMenuContext';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/core/utils';


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
          <div className="mx-auto flex w-full max-w-[1680px]">
            <main className="min-w-0 flex-1">
              <div className="app-content">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <MobileMenuProvider>
        <AppShell>{children}</AppShell>
      </MobileMenuProvider>
    </ToastProvider>
  );
}
