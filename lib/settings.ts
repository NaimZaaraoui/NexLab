import { prisma } from '@/lib/prisma';

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? defaultValue;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });
  return Object.fromEntries(
    keys.map(k => [k, settings.find((setting) => setting.key === k)?.value ?? ''])
  );
}

export async function updateSetting(key: string, value: string, userId: string): Promise<void> {
  await prisma.setting.upsert({
    where:  { key },
    update: { value, updatedBy: userId },
    create: { key, value, updatedBy: userId },
  });
}
