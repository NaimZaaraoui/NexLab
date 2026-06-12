import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthUser } from '@/lib/security/authz';
import { createAuditLog, getRequestMeta } from '@/lib/security/audit';

const ACTION_STATUSES = new Set(['PENDING', 'IN_PROGRESS', 'DONE', 'VERIFIED']);
const EVENT_STATUSES = new Set(['OPEN', 'IN_REVIEW', 'RESOLVED']);

function cleanText(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value: unknown) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    const actionStatus = cleanText(body.actionStatus) || 'PENDING';
    if (!ACTION_STATUSES.has(actionStatus)) {
      return NextResponse.json({ error: 'Statut CAPA invalide' }, { status: 400 });
    }

    const requestedStatus = cleanText(body.status);
    const status = requestedStatus && EVENT_STATUSES.has(requestedStatus)
      ? requestedStatus
      : actionStatus === 'VERIFIED'
        ? 'RESOLVED'
        : actionStatus === 'PENDING'
          ? 'OPEN'
          : 'IN_REVIEW';

    const now = new Date();
    const updated = await prisma.qualityEvent.update({
      where: { id },
      data: {
        status,
        rootCause: cleanText(body.rootCause),
        correctiveAction: cleanText(body.correctiveAction),
        preventiveAction: cleanText(body.preventiveAction),
        actionOwner: cleanText(body.actionOwner),
        actionDueDate: parseDate(body.actionDueDate),
        actionStatus,
        actionCompletedAt: actionStatus === 'DONE' || actionStatus === 'VERIFIED' ? now : null,
        verifiedAt: actionStatus === 'VERIFIED' ? now : null,
        verificationNote: cleanText(body.verificationNote),
        resolution: cleanText(body.resolution),
        resolvedAt: status === 'RESOLVED' ? now : null,
      },
    });

    await createAuditLog({
      action: 'quality_event.capa_update',
      severity: actionStatus === 'VERIFIED' ? 'INFO' : 'WARN',
      entity: 'quality_event',
      entityId: id,
      details: {
        title: updated.title,
        status: updated.status,
        actionStatus: updated.actionStatus,
        owner: updated.actionOwner,
        dueDate: updated.actionDueDate,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PATCH /api/quality-events/[id]:', error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'événement qualité" },
      { status: 500 }
    );
  }
}
