
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, birthDate, gender, phoneNumber, email, address } = body;

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        phoneNumber,
        email,
        address
      },
    });

    await createAuditLog({
      action: 'patient.update',
      severity: 'INFO',
      entity: 'patient',
      entityId: id,
      details: {
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Error updating patient' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { id } = await params;
    
    // Check if patient has analyses
    const analysisCount = await prisma.analysis.count({
      where: { patientId: id }
    });

    if (analysisCount > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un patient ayant des analyses liées.' },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'patient.delete',
      severity: 'CRITICAL',
      entity: 'patient',
      entityId: id,
      details: {
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Error deleting patient' },
      { status: 500 }
    );
  }
}
