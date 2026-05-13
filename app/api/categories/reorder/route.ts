import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PUT(request: Request) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    const { model, updates } = body; // model: 'category' | 'test', updates: { id: string, rank: number }[]

    if (!model || !updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const transaction = updates.map((update: { id: string, rank: number }) => {
      // @ts-expect-error - Dynamic Prisma model access via validated payload
      return prisma[model].update({
        where: { id: update.id },
        data: { rank: update.rank }
      });
    });

    await prisma.$transaction(transaction);

    await createAuditLog({
      action: 'category.reorder',
      severity: 'WARN',
      entity: model === 'test' ? 'test' : 'category',
      details: { model, updatesCount: updates.length },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
