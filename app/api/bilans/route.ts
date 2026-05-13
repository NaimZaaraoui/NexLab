
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET() {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const bilans = await prisma.bilan.findMany({
      include: {
        tests: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(bilans);
  } catch (error) {
    console.error('Error fetching bilans:', error);
    return NextResponse.json(
      { error: 'Error fetching bilans' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    const { name, code, testIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const bilan = await prisma.bilan.create({
      data: {
        name,
        code,
        tests: {
          connect: testIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        tests: true,
      },
    });

    await createAuditLog({
      action: 'bilan.create',
      severity: 'WARN',
      entity: 'bilan',
      entityId: bilan.id,
      details: { name: bilan.name, code: bilan.code },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(bilan);
  } catch (error) {
    console.error('Error creating bilan:', error);
    return NextResponse.json(
      { error: 'Error creating bilan' },
      { status: 500 }
    );
  }
}
