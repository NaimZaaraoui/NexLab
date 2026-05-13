// src/app/api/results/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { resultUpdateSchema } from '@/lib/validators';

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    const parsed = resultUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: parsed.error.format() 
      }, { status: 400 });
    }

    const { id, value, unit, notes, abnormal } = parsed.data;
    
    const result = await prisma.result.update({
      where: { id },
      data: {
        value: value || null,
        unit: unit || null,
        notes: notes || null,
        abnormal: abnormal || false
      }
    });

    await createAuditLog({
      action: 'result.update',
      severity: abnormal ? 'WARN' : 'INFO',
      entity: 'result',
      entityId: result.id,
      details: {
        analysisId: result.analysisId,
        testId: result.testId,
        abnormal: result.abnormal,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur PUT /api/results:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du résultat' },
      { status: 500 }
    );
  }
}
