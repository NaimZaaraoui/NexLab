import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAnyRole(['ADMIN']);
    if (!auth.ok) return auth.error;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient introuvable' },
        { status: 404 }
      );
    }

    // Capture basic info for the audit log before it's gone
    const patientName = `${patient.firstName} ${patient.lastName}`;

    // Execute cascade delete
    // Note: Since Prisma's relation from Patient to Analysis lacks onDelete: Cascade
    // in schema.prisma, we must delete children manually inside a transaction.
    await prisma.$transaction([
      // 1. Delete all results mapping to this patient's analyses
      prisma.result.deleteMany({
        where: { analysis: { patientId: id } }
      }),
      // 2. Delete all consumptions mapping to this patient's analyses
      prisma.analysisConsumption.deleteMany({
        where: { analysis: { patientId: id } }
      }),
      // 3. Delete notifications
      prisma.notification.deleteMany({
        where: { analysis: { patientId: id } }
      }),
      // 4. Delete the analyses
      prisma.analysis.deleteMany({
        where: { patientId: id }
      }),
      // 5. Delete the patient
      prisma.patient.delete({
        where: { id }
      }),
      // 6. Hard-write the audit log
      prisma.auditLog.create({
        data: {
          userId: auth.userId,
          userName: auth.session.user?.name || 'Inconnu',
          userRole: auth.role,
          action: 'GDPR_PURGE_PATIENT',
          severity: 'CRITICAL',
          entity: 'Patient',
          details: `Purge intégrale "Droit à l'oubli" exécutée pour le patient ${patientName}. Toutes les analyses et résultats associés ont été supprimés.`,
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Données personnelles purgées avec succès' 
    });
  } catch (error) {
    console.error('Erreur API Purge Patient:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des données' },
      { status: 500 }
    );
  }
}
