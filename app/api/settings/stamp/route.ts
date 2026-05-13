import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/stamps');

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('stamp') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' }, { status: 400 });
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 2MB.' }, { status: 400 });
    }

    // Ensure directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Delete old stamp if exists
    const currentSetting = await prisma.setting.findUnique({
      where: { key: 'lab_stamp_image' }
    });
    if (currentSetting?.value) {
      const oldPath = path.join(process.cwd(), 'public', currentSetting.value);
      try {
        await fs.unlink(oldPath);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Save new file
    const ext = file.type.split('/')[1];
    const filename = `stamp-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/stamps/${filename}`;

    // Update DB
    await prisma.setting.upsert({
      where: { key: 'lab_stamp_image' },
      update: { value: relativeUrl, updatedBy: user.id },
      create: { key: 'lab_stamp_image', value: relativeUrl, updatedBy: user.id },
    });

    const meta = getRequestMeta({ headers: request.headers });
    await createAuditLog({
      action: 'settings.stamp_upload',
      severity: 'WARN',
      entity: 'setting',
      entityId: 'lab_stamp_image',
      details: { value: relativeUrl },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ url: relativeUrl });
  } catch (error) {
    console.error('Erreur upload cachet:', error);
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
    const currentSetting = await prisma.setting.findUnique({
      where: { key: 'lab_stamp_image' }
    });

    if (currentSetting?.value) {
      const filePath = path.join(process.cwd(), 'public', currentSetting.value);
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignore error
      }
    }

    await prisma.setting.update({
      where: { key: 'lab_stamp_image' },
      data: { value: '', updatedBy: user.id },
    });

    const meta = getRequestMeta({ headers: request.headers });
    await createAuditLog({
      action: 'settings.stamp_delete',
      severity: 'WARN',
      entity: 'setting',
      entityId: 'lab_stamp_image',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression cachet:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }
}
