import { AVAILABLE_ICONS } from './ordering-helpers';
import { Folder } from 'lucide-react';

interface Props {
  iconName?: string | null;
}

export function CategoryIcon({ iconName }: Props) {
  const IconComponent = AVAILABLE_ICONS.find((i) => i.name === iconName)?.icon || Folder;
  return <IconComponent size={18} />;
}
