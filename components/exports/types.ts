import type { LucideIcon } from 'lucide-react';

export type ExportType =
  | 'analyses'
  | 'results'
  | 'daily'
  | 'monthly'
  | 'by_category'
  | 'by_patient'
  | 'patients'
  | 'catalog';

export interface Category {
  id: string;
  name: string;
  _count?: { tests: number };
}

export interface ExportConfigItem {
  id: ExportType;
  label: string;
  description: string;
  icon: LucideIcon;
}
