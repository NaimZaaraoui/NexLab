'use client';

import { NexLabLockup } from '@/components/branding/NexLabLockup';
import { NexLabMark } from '@/components/branding/NexLabMark';

interface NavigationBrandProps {
  sidebarOpen: boolean;
  mobile?: boolean;
}

export function NavigationBrand({ sidebarOpen, mobile = false }: NavigationBrandProps) {
  if (sidebarOpen || mobile) {
    return (
      <div className={`flex h-16 items-center ${mobile ? 'border-b px-4' : 'px-4'}`}>
        <NexLabLockup size="sm" subtitle="LIMS SOLUTION" />
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center px-4">
      <NexLabMark className="h-7 w-auto" variant="brand" />
    </div>
  );
}
