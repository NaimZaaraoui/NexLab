import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;
  const { id } = await params;
  return NextResponse.json(
    { error: `Consultation unitaire non implémentée pour ${id}. Utilisez /api/audit-logs.` },
    { status: 400 }
  );
}

export async function PATCH() {
  return NextResponse.json({ error: 'Modification des logs d’audit interdite.' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Suppression directe des logs d’audit interdite.' }, { status: 405 });
}
