import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { Prisma } from '@/app/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10), 5), 100);
    const action = (searchParams.get('action') || '').trim();
    const moduleName = (searchParams.get('module') || '').trim().toLowerCase();
    const severity = (searchParams.get('severity') || '').trim();
    const entity = (searchParams.get('entity') || '').trim();
    const query = (searchParams.get('query') || '').trim();
    const format = (searchParams.get('format') || '').trim().toLowerCase();
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Prisma.AuditLogWhereInput = {};

    if (action) where.action = action;
    if (moduleName) {
      const modulePrefixes: Record<string, string[]> = {
        qc: ['qc.'],
        inventory: ['inventory.'],
        database: ['database.'],
        temperature: ['temperature.'],
        analyses: ['analysis.', 'result.'],
        users: ['user.'],
        settings: ['settings.', 'audit.'],
        patients: ['patient.'],
        tests: ['test.', 'bilan.', 'category.'],
      };

      const prefixes = modulePrefixes[moduleName];
      if (prefixes?.length) {
        const existing = where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : [];
        where.AND = [
          ...existing,
          {
            OR: prefixes.map((prefix) => ({
              action: { startsWith: prefix },
            })),
          },
        ];
      }
    }
    if (severity) where.severity = severity;
    if (entity) where.entity = entity;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (query) {
      where.OR = [
        { userName: { contains: query } },
        { userEmail: { contains: query } },
        { action: { contains: query } },
        { entity: { contains: query } },
        { entityId: { contains: query } },
        { details: { contains: query } },
      ];
    }

    if (format === 'csv') {
      const items = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      const header = [
        'createdAt',
        'severity',
        'userName',
        'userEmail',
        'userRole',
        'action',
        'entity',
        'entityId',
        'ipAddress',
        'userAgent',
        'details',
      ];

      const escapeCsv = (value: string | null | undefined) => {
        const v = value ?? '';
        return `"${String(v).replaceAll('"', '""')}"`;
      };

      const lines = items.map((item) =>
        [
          item.createdAt.toISOString(),
          item.severity,
          item.userName,
          item.userEmail,
          item.userRole,
          item.action,
          item.entity,
          item.entityId,
          item.ipAddress,
          item.userAgent,
          item.details,
        ]
          .map(escapeCsv)
          .join(',')
      );

      const csv = [header.join(','), ...lines].join('\n');
      const fileName = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des logs d’audit.' }, { status: 500 });
  }
}
