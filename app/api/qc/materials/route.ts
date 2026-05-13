import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

const ALLOWED_LEVELS = ['Normal', 'Pathologique', 'Critique'];

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });
    const name = String(body?.name || '').trim();
    const level = String(body?.level || '').trim();
    const manufacturer = body?.manufacturer ? String(body.manufacturer).trim() : null;

    if (!name || !level) {
      return NextResponse.json({ error: 'Nom et niveau requis' }, { status: 400 });
    }

    if (!ALLOWED_LEVELS.includes(level)) {
      return NextResponse.json({ error: 'Niveau invalide' }, { status: 400 });
    }

    const material = await prisma.qcMaterial.create({
      data: {
        name,
        level,
        manufacturer,
      },
    });

    await createAuditLog({
      action: 'qc.material_create',
      severity: 'WARN',
      entity: 'qc_material',
      entityId: material.id,
      details: { name: material.name, level: material.level },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/qc/materials:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du matériel QC' }, { status: 500 });
  }
}
