import { NextResponse } from 'next/server';
import { auth } from '@/lib/security/auth';
import { prisma } from '@/lib/db/prisma';
import fs from 'fs/promises';
import path from 'path';
import { createAuditLog, getRequestMeta } from '@/lib/security/audit';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/logos');

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 2MB.' }, { status: 400 });
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const currentSetting = await prisma.setting.findUnique({ where: { key: 'lab_logo' } });
    if (currentSetting?.value) {
      const oldPath = path.join(process.cwd(), 'public', currentSetting.value);
      try { await fs.unlink(oldPath); } catch { }
    }

    const ext = file.type.split('/')[1];
    const filename = `logo-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const relativeUrl = `/uploads/logos/${filename}`;

    await prisma.setting.upsert({
      where: { key: 'lab_logo' },
      update: { value: relativeUrl, updatedBy: user.id },
      create: { key: 'lab_logo', value: relativeUrl, updatedBy: user.id },
    });

    const meta = getRequestMeta({ headers: request.headers });
    await createAuditLog({
      action: 'settings.logo_upload',
      severity: 'WARN',
      entity: 'setting',
      entityId: 'lab_logo',
      details: { value: relativeUrl },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ url: relativeUrl });
  } catch (error) {
    console.error('Erreur upload logo:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement du fichier.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  const user = session?.user;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  try {
    const currentSetting = await prisma.setting.findUnique({ where: { key: 'lab_logo' } });
    if (currentSetting?.value) {
      const filePath = path.join(process.cwd(), 'public', currentSetting.value);
      try { await fs.unlink(filePath); } catch { }
    }

    await prisma.setting.upsert({
      where: { key: 'lab_logo' },
      update: { value: '', updatedBy: user.id },
      create: { key: 'lab_logo', value: '', updatedBy: user.id },
    });

    const meta = getRequestMeta({ headers: request.headers });
    await createAuditLog({
      action: 'settings.logo_delete',
      severity: 'WARN',
      entity: 'setting',
      entityId: 'lab_logo',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression logo:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }
}
