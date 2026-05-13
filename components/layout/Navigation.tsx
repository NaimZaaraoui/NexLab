'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { NavigationBrand } from '@/components/layout/NavigationBrand';
import { NavigationFooter } from '@/components/layout/NavigationFooter';
import { NavigationGroups } from '@/components/layout/NavigationGroups';
import { isNavigationLinkActive, isNavigationLinkVisible } from '@/components/layout/navigation-helpers';
import { useMobileMenu } from '@/contexts/MobileMenuContext';

import { useSession, signOut } from 'next-auth/react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isOpen: mobileOpen, close: closeMobile } = useMobileMenu();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const role = session?.user?.role || 'TECHNICIEN';

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  const isLinkVisible = (href: string) => isNavigationLinkVisible(role, href);
  const isActive = (href: string) => isNavigationLinkActive(pathname, href);

  const handleNavClick = () => closeMobile();
  const sidebarOpen = !isCollapsed;

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-50 hidden h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-300 lg:flex ${
          sidebarOpen ? 'w-[var(--shell-nav-width)]' : 'w-[var(--shell-nav-width-collapsed)]'
        }`}
      >
        <NavigationBrand sidebarOpen={sidebarOpen} />
        <div className="mx-4 border-b border-[var(--color-border)]" />

        <NavigationGroups
          role={role}
          pathname={pathname}
          sidebarOpen={sidebarOpen}
          isLinkVisible={isLinkVisible}
          isActive={isActive}
        />
        <NavigationFooter sidebarOpen={sidebarOpen} onLogout={() => setShowLogoutConfirm(true)} />

        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 flex h-7 w-7 items-center justify-center rounded-full border bg-[var(--color-surface)] text-[var(--color-text-soft)] transition-colors hover:bg-[var(--color-surface-muted)]"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${!sidebarOpen && 'rotate-180'}`}
          />
        </button>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/25  lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[88vw] max-w-[320px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform shadow-[0_10px_30px_rgba(15,31,51,0.10)] lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavigationBrand sidebarOpen mobile />
        <NavigationGroups
          role={role}
          pathname={pathname}
          sidebarOpen
          mobile
          onNavClick={handleNavClick}
          isLinkVisible={isLinkVisible}
          isActive={isActive}
        />
        <NavigationFooter sidebarOpen mobile onLogout={() => setShowLogoutConfirm(true)} />
      </aside>
      
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() =>
          signOut({
            redirectTo: '/login',
          })
        }
        title="Se déconnecter ?"
        message="Êtes-vous sûr de vouloir quitter votre session ? Vous devrez vous reconnecter pour accéder au laboratoire."
        confirmText="Déconnexion"
        type="danger"
        icon="logout"
      />
    </>

  );
}
