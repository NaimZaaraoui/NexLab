import {
  Activity,
  Beaker,
  Droplet,
  Folder,
  Heart,
  Layers,
  LucideIcon,
  TestTube,
  Zap,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Folder,
  Beaker,
  Droplet,
  Activity,
  Heart,
  Zap,
  TestTube,
  Layers,
};

export function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) {
    return Folder;
  }

  return CATEGORY_ICON_MAP[iconName] || Folder;
}
