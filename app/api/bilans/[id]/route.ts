
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { id } = await params;
    const body = await request.json();
    const { name, code, testIds } = body;

    const bilan = await prisma.bilan.update({
      where: { id },
      data: {
        name,
        code,
        tests: {
          set: [], // Clear existing relations
          connect: testIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        tests: true,
      },
    });

    await createAuditLog({
      action: 'bilan.update',
      severity: 'WARN',
      entity: 'bilan',
      entityId: id,
      details: { name: bilan.name, code: bilan.code, testsCount: bilan.tests.length },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(bilan);
  } catch (error) {
    console.error('Error updating bilan:', error);
    return NextResponse.json(
      { error: 'Error updating bilan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { id } = await params;
    const existing = await prisma.bilan.findUnique({
      where: { id },
      select: { id: true, name: true, code: true },
    });
    const bilan = await prisma.bilan.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'bilan.delete',
      severity: 'CRITICAL',
      entity: 'bilan',
      entityId: id,
      details: existing,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(bilan);
  } catch (error) {
    console.error('Error deleting bilan:', error);
    return NextResponse.json(
      { error: 'Error deleting bilan' },
      { status: 500 }
    );
  }
}
