
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { Prisma } from '@/app/generated/prisma';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const whereClause: Prisma.PatientWhereInput = {};

    if (query) {
      whereClause.OR = [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { phoneNumber: { contains: query } },
      ];
    }

    if (start || end) {
      whereClause.createdAt = {};
      if (start) {
        whereClause.createdAt.gte = new Date(start);
      }
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[API] Patient search for "${query}" returned ${patients.length} results`);

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Error fetching patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    const { firstName, lastName, birthDate, gender, address, phoneNumber } = body;

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        address,
        phoneNumber
      },
    });

    await createAuditLog({
      action: 'patient.create',
      severity: 'INFO',
      entity: 'patient',
      entityId: patient.id,
      details: {
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Error creating patient' },
      { status: 500 }
    );
  }
}
