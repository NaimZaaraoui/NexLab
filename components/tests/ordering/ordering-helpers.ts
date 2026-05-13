import {
  Folder,
  Beaker,
  Droplet,
  Activity,
  Heart,
  Zap,
  TestTube,
  Layers,
} from 'lucide-react';
import type { Category } from './types';

export const AVAILABLE_ICONS = [
  { name: 'Folder', icon: Folder },
  { name: 'Beaker', icon: Beaker },
  { name: 'Droplet', icon: Droplet },
  { name: 'Activity', icon: Activity },
  { name: 'Heart', icon: Heart },
  { name: 'Zap', icon: Zap },
  { name: 'TestTube', icon: TestTube },
  { name: 'Layers', icon: Layers },
];

export function buildCategoryTree(cats: Category[]): Category[] {
  return cats.filter((c) => !c.parentId).sort((a, b) => a.rank - b.rank);
}

export function getChildCategories(categories: Category[], parentId: string): Category[] {
  return categories.filter((c) => c.parentId === parentId).sort((a, b) => a.rank - b.rank);
}

export function getVisibleCategories(
  rootCats: Category[],
  categories: Category[],
  expandedCategories: Set<string>
): Category[] {
  const flattened: Category[] = [];

  const flatten = (cat: Category) => {
    flattened.push(cat);
    if (expandedCategories.has(cat.id)) {
      getChildCategories(categories, cat.id).forEach(flatten);
    }
  };

  rootCats.forEach(flatten);
  return flattened;
}
