import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });

  try {
    const [
      settings,
      categories,
      tests,
      bilans,
      patients,
      analyses,
      users,
      inventoryItems,
      qcMaterials,
      auditLogs,
    ] = await Promise.all([
      prisma.setting.findMany({ orderBy: { key: 'asc' } }),
      prisma.category.findMany({ orderBy: [{ rank: 'asc' }, { name: 'asc' }] }),
      prisma.test.findMany({ orderBy: [{ rank: 'asc' }, { name: 'asc' }] }),
      prisma.bilan.findMany({ include: { tests: true }, orderBy: { name: 'asc' } }),
      prisma.patient.findMany({ orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
      prisma.analysis.findMany({
        include: {
          results: {
            include: { test: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { creationDate: 'desc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.inventoryItem.findMany({
        include: {
          lots: true,
          movements: true,
          rules: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.qcMaterial.findMany({
        include: {
          lots: {
            include: {
              targets: true,
              results: {
                include: { values: true },
                orderBy: { performedAt: 'desc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10000,
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      scope: 'full_business_export',
      counts: {
        settings: settings.length,
        categories: categories.length,
        tests: tests.length,
        bilans: bilans.length,
        patients: patients.length,
        analyses: analyses.length,
        users: users.length,
        inventoryItems: inventoryItems.length,
        qcMaterials: qcMaterials.length,
        auditLogs: auditLogs.length,
      },
      settings,
      categories,
      tests,
      bilans,
      patients,
      analyses,
      users,
      inventoryItems,
      qcMaterials,
      auditLogs,
    };

    await createAuditLog({
      action: 'database.full_export',
      severity: 'WARN',
      entity: 'database_export',
      details: payload.counts,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const fileName = `nexlab-full-export-${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating full export:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l’export complet.' },
      { status: 500 }
    );
  }
}
