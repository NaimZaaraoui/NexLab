import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAnyRole(['ADMIN', 'MEDECIN']);
    if (!auth.ok) return auth.error;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        analyses: {
          include: {
            results: {
              include: {
                test: {
                  select: { name: true, code: true, unit: true, resultType: true }
                }
              }
            }
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient introuvable' },
        { status: 404 }
      );
    }

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.session.user?.name || 'Inconnu',
        userRole: auth.role,
        action: 'EXPORT_PATIENT_DATA',
        severity: 'WARNING',
        entity: 'Patient',
        entityId: patient.id,
        details: `Export complet des données personnelles (RGPD) du patient ${patient.firstName} ${patient.lastName}`,
      }
    });

    // Format output
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: auth.session.user?.name,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        birthDate: patient.birthDate,
        gender: patient.gender,
        phoneNumber: patient.phoneNumber,
        email: patient.email,
        address: patient.address,
        insuranceProvider: patient.insuranceProvider,
        insuranceNumber: patient.insuranceNumber,
        createdAt: patient.createdAt,
      },
      analysesCount: patient.analyses.length,
      analyses: patient.analyses.map(analysis => ({
        id: analysis.id,
        orderNumber: analysis.orderNumber,
        creationDate: analysis.creationDate,
        status: analysis.status,
        totalPrice: analysis.totalPrice,
        paymentStatus: analysis.paymentStatus,
        results: analysis.results.map(r => ({
          test: r.test.name,
          code: r.test.code,
          value: r.value,
          unit: r.unit,
          isAbnormal: r.abnormal,
          date: r.updatedAt
        }))
      }))
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="patient_data_${patient.id}.json"`
      }
    });
  } catch (error) {
    console.error('Erreur API Export Patient:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des données' },
      { status: 500 }
    );
  }
}
