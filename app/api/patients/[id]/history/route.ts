
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser } from '@/lib/authz';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        analyses: {
          orderBy: { creationDate: 'desc' },
          include: {
             results: {
                 include: { test: true }
             }
          }
        }
      }
    });

    if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient history:', error);
    return NextResponse.json(
      { error: 'Error fetching patient history' },
      { status: 500 }
    );
  }
}
