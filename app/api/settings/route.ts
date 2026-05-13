import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasValidInternalPrintToken } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { ALLOWED_SETTINGS_KEYS, normalizeSettingsRecord, type LabSettingsMap } from '@/lib/settings-schema';

type SettingRow = { key: string; value: string };

function normalizeSettings(rows: SettingRow[]) {
  return normalizeSettingsRecord(
    Object.fromEntries(rows.map((row) => [row.key, row.value]))
  );
}

export async function GET(request: Request) {
  if (hasValidInternalPrintToken(request)) {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...ALLOWED_SETTINGS_KEYS] } },
      select: { key: true, value: true },
    });
    return NextResponse.json(normalizeSettings(rows));
  }

  const session = await auth();
  const role = session?.user?.role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const rows = await prisma.setting.findMany({
    where: { key: { in: [...ALLOWED_SETTINGS_KEYS] } },
    select: { key: true, value: true },
  });

  return NextResponse.json(normalizeSettings(rows));
}

export async function PATCH(request: Request) {
  const session = await auth();
  const user = session?.user;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const body = await request.json();
  const { settings } = body as { settings: Partial<LabSettingsMap> };
  const meta = getRequestMeta({ headers: request.headers });

  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  // Validate keys
  const invalidKeys = Object.keys(settings).filter((key) => !ALLOWED_SETTINGS_KEYS.includes(key as (typeof ALLOWED_SETTINGS_KEYS)[number]));
  if (invalidKeys.length > 0) {
    return NextResponse.json({ error: `Clé(s) invalide(s): ${invalidKeys.join(', ')}` }, { status: 400 });
  }

  // Validate TAT values
  if ('tat_warn' in settings || 'tat_alert' in settings) {
    const warn = parseInt(settings.tat_warn ?? '0', 10);
    const alert = parseInt(settings.tat_alert ?? '0', 10);
    if (isNaN(warn) || isNaN(alert) || warn < 1 || warn > 480 || alert < 1 || alert > 480) {
      return NextResponse.json(
        { error: 'Valeur invalide pour les seuils TAT (1-480 min).' },
        { status: 400 }
      );
    }
    if (warn >= alert) {
      return NextResponse.json(
        { error: 'Le seuil avertissement doit être inférieur au seuil dépassement.' },
        { status: 400 }
      );
    }
  }

  if ('database_backup_retention_count' in settings) {
    const retentionCount = parseInt(settings.database_backup_retention_count ?? '0', 10);
    if (isNaN(retentionCount) || retentionCount < 0 || retentionCount > 200) {
      return NextResponse.json(
        { error: 'La retention des sauvegardes doit etre comprise entre 0 et 200.' },
        { status: 400 }
      );
    }
  }

  if ('database_recovery_retention_count' in settings) {
    const retentionCount = parseInt(settings.database_recovery_retention_count ?? '0', 10);
    if (isNaN(retentionCount) || retentionCount < 0 || retentionCount > 200) {
      return NextResponse.json(
        { error: 'La retention des bundles de reprise doit etre comprise entre 0 et 200.' },
        { status: 400 }
      );
    }
  }

  if ('database_backup_external_target' in settings) {
    const target = (settings.database_backup_external_target ?? '').trim();
    if (target.length > 500) {
      return NextResponse.json(
        { error: 'Le chemin de sauvegarde externe est trop long.' },
        { status: 400 }
      );
    }
  }

  const userId = user?.id ?? 'system';

  await prisma.$transaction(
    Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where:  { key },
        update: { value, updatedBy: userId },
        create: { key, value, updatedBy: userId },
      })
    )
  );

  await createAuditLog({
    action: 'settings.update',
    severity: 'WARN',
    entity: 'setting',
    details: {
      keys: Object.keys(settings),
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  // Return updated settings
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...ALLOWED_SETTINGS_KEYS] } },
    select: { key: true, value: true },
  });
  return NextResponse.json(normalizeSettings(rows));
}
