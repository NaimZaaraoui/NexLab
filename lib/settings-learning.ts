import { prisma } from '@/lib/prisma';
import type { SettingKey } from '@/lib/settings-schema';

export function splitLearnedList(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mergeLearnedList(existing: string | null | undefined, additions: Array<string | null | undefined>) {
  const values = [
    ...splitLearnedList(existing),
    ...additions
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean),
  ];
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const value of values) {
    const key = value.toLocaleLowerCase('fr');
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(value);
  }

  return merged.join(', ');
}

export async function prepareLearnedSettingUpdate(
  key: SettingKey,
  additions: Array<string | null | undefined>
) {
  const current = await prisma.setting.findUnique({
    where: { key },
    select: { value: true },
  });

  const nextValue = mergeLearnedList(current?.value, additions);

  return { key, value: nextValue };
}
