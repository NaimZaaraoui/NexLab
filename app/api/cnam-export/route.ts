import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { Prisma } from '@/app/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'MEDECIN', 'TECHNICIEN']);
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const provider = searchParams.get('provider');

    const where: Prisma.AnalysisWhereInput = {
      insuranceCoverage: { gt: 0 },
    };

    if (start || end) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (start) dateFilter.gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.lte = endDate;
      }
      where.creationDate = dateFilter;
    }

    if (provider) {
      where.insuranceProvider = provider;
    }

    const analyses = await prisma.analysis.findMany({
      where,
      select: {
        orderNumber: true,
        receiptNumber: true,
        creationDate: true,
        patientFirstName: true,
        patientLastName: true,
        patientAge: true,
        patientGender: true,
        insuranceProvider: true,
        insuranceCoverage: true,
        totalPrice: true,
        insuranceShare: true,
        patientShare: true,
        status: true,
        patient: {
          select: {
            insuranceNumber: true,
          },
        },
      },
      orderBy: { creationDate: 'desc' },
    });

    const format = searchParams.get('format') || 'json';

    if (format === 'csv') {
      const headers = [
        'N° Ordre',
        'N° Quittance',
        'Date',
        'Nom',
        'Prénom',
        'Âge',
        'Sexe',
        'Assurance',
        'N° Assurance',
        'Couverture %',
        'Montant Total',
        'Part Assurance',
        'Part Patient',
        'Statut',
      ];

      const escapeCsv = (v: string | number | null | undefined) =>
        `"${String(v ?? '').replaceAll('"', '""')}"`;

      const lines = analyses.map((a) => [
        a.orderNumber,
        a.receiptNumber,
        a.creationDate.toLocaleDateString('fr-FR'),
        a.patientLastName,
        a.patientFirstName,
        a.patientAge,
        a.patientGender === 'M' ? 'Homme' : 'Femme',
        a.insuranceProvider,
        a.patient?.insuranceNumber,
        a.insuranceCoverage ? `${a.insuranceCoverage}%` : '',
        a.totalPrice?.toFixed(2),
        a.insuranceShare?.toFixed(2),
        a.patientShare?.toFixed(2),
        a.status,
      ].map(escapeCsv).join(','));

      const csv = [headers.map(escapeCsv).join(','), ...lines].join('\n');
      const fileName = `cnam_export_${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse('\uFEFF' + csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // JSON summary
    const totalInsuranceShare = analyses.reduce((acc, a) => acc + (a.insuranceShare || 0), 0);
    const totalPatientShare = analyses.reduce((acc, a) => acc + (a.patientShare || 0), 0);
    const totalAmount = analyses.reduce((acc, a) => acc + (a.totalPrice || 0), 0);

    return NextResponse.json({
      count: analyses.length,
      totalAmount,
      totalInsuranceShare,
      totalPatientShare,
      items: analyses,
    });
  } catch (error) {
    console.error('[CNAM Export] Error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'export CNAM' }, { status: 500 });
  }
}
