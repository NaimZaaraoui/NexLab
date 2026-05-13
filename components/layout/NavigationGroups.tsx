'use client';

import Link from 'next/link';
import { NAVIGATION_GROUPS } from '@/lib/constants';

interface NavigationGroupsProps {
  role: string;
  pathname: string;
  sidebarOpen: boolean;
  mobile?: boolean;
  onNavClick?: () => void;
  isLinkVisible: (href: string) => boolean;
  isActive: (href: string) => boolean;
}

export function NavigationGroups({
  role,
  pathname,
  sidebarOpen,
  mobile = false,
  onNavClick,
  isLinkVisible,
  isActive,
}: NavigationGroupsProps) {
  const filteredGroups = NAVIGATION_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => isLinkVisible(link.href)),
  })).filter((group) => group.links.length > 0);

  void role;
  void pathname;

  return (
    <nav className={mobile ? 'flex-1 space-y-5 overflow-y-auto p-4 pb-2' : 'flex-1 space-y-4 overflow-y-auto px-2 py-3'}>
      {filteredGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-2">
          {(sidebarOpen || mobile) && (
            <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-soft)]">
              {group.title}
            </div>
          )}
          <div className="space-y-1">
            {group.links.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavClick}
                  title={!sidebarOpen && !mobile ? item.name : undefined}
                  className={`group flex items-center gap-3 rounded-md py-2.5 font-medium transition-all ${
                    active
                      ? 'border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                      : 'border border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]'
                  } ${mobile ? 'px-3' : sidebarOpen ? 'px-3' : 'justify-center px-0'}`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] flex-shrink-0 ${
                      active
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-soft)] group-hover:text-[var(--color-text-secondary)]'
                    }`}
                  />
                  {(sidebarOpen || mobile) && <span className="flex-1 text-[13px]">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
