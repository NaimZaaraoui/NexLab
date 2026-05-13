'use client';

import { LogOut } from 'lucide-react';

interface NavigationFooterProps {
  sidebarOpen: boolean;
  mobile?: boolean;
  onLogout: () => void;
}

export function NavigationFooter({ sidebarOpen, mobile = false, onLogout }: NavigationFooterProps) {
  return (
    <div className={`${mobile ? 'mt-auto space-y-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]' : 'mt-auto space-y-2 border-t p-3'}`}>
      <button
        onClick={onLogout}
        className={`group rounded-lg py-2.5 font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-rose-50 hover:text-rose-700 ${
          mobile ? 'flex w-full items-center gap-3 px-3' : `w-full ${!sidebarOpen ? 'px-0' : 'px-4'}`
        }`}
      >
        <span className={`flex items-center gap-3 ${!mobile && !sidebarOpen ? 'justify-center' : ''}`}>
          <LogOut className="h-[18px] w-[18px] flex-shrink-0 text-[var(--color-text-soft)] group-hover:text-rose-600" />
          {(sidebarOpen || mobile) && <span className="text-[13px]">Déconnexion</span>}
        </span>
      </button>
    </div>
  );
}
