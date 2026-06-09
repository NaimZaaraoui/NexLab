'use client';

import { type StatTab } from './types';
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  Banknote,
  Package,
} from 'lucide-react';

const TABS: { id: StatTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Vue Générale', icon: LayoutDashboard },
  { id: 'analyses',   label: 'Analyses',     icon: FlaskConical },
  { id: 'patients',   label: 'Patients',     icon: Users },
  { id: 'financial',  label: 'Financier',    icon: Banknote },
  { id: 'inventory',  label: 'Inventaire',   icon: Package },
];

interface StatTabBarProps {
  active: StatTab;
  onChange: (tab: StatTab) => void;
}

export function StatTabBar({ active, onChange }: StatTabBarProps) {
  return (
    <nav className="flex gap-1 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-muted)] p-1.5">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm ring-1 ring-[var(--color-border)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/60 hover:text-[var(--color-text)]'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
