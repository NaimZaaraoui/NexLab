export type InventoryCategoryConfig = {
  id: string;
  name: string;
  rank: number;
  isActive: boolean;
};

export const DEFAULT_INVENTORY_CATEGORIES: InventoryCategoryConfig[] = [
  { id: 'hematologie', name: 'Hématologie', rank: 0, isActive: true },
  { id: 'biochimie', name: 'Biochimie', rank: 1, isActive: true },
  { id: 'immunologie', name: 'Immunologie', rank: 2, isActive: true },
  { id: 'microbiologie', name: 'Microbiologie', rank: 3, isActive: true },
  { id: 'coagulation', name: 'Coagulation', rank: 4, isActive: true },
  { id: 'urologie', name: 'Urologie', rank: 5, isActive: true },
  { id: 'autre', name: 'Autre', rank: 6, isActive: true },
];

function normalizeCategoryEntry(entry: unknown, index: number): InventoryCategoryConfig | null {
  if (!entry || typeof entry !== 'object') return null;

  const candidate = entry as Record<string, unknown>;
  const name = String(candidate.name || '').trim();
  if (!name) return null;

  const fallbackId = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return {
    id: String(candidate.id || fallbackId || `category-${index}`).trim(),
    name,
    rank: Number.isFinite(Number(candidate.rank)) ? Number(candidate.rank) : index,
    isActive: candidate.isActive !== false,
  };
}

export function parseInventoryCategories(value?: string | null) {
  if (!value) return DEFAULT_INVENTORY_CATEGORIES;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_INVENTORY_CATEGORIES;

    const normalized = parsed
      .map((entry, index) => normalizeCategoryEntry(entry, index))
      .filter((entry): entry is InventoryCategoryConfig => Boolean(entry))
      .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.name.localeCompare(b.name, 'fr')));

    return normalized.length > 0 ? normalized : DEFAULT_INVENTORY_CATEGORIES;
  } catch {
    return DEFAULT_INVENTORY_CATEGORIES;
  }
}

export function stringifyInventoryCategories(categories: InventoryCategoryConfig[]) {
  return JSON.stringify(
    categories
      .map((category, index) => ({
        id: category.id,
        name: category.name.trim(),
        rank: Number.isFinite(category.rank) ? category.rank : index,
        isActive: category.isActive !== false,
      }))
      .filter((category) => category.name)
      .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.name.localeCompare(b.name, 'fr')))
  );
}
