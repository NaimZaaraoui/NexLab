import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';

export async function GET() {
  const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN', 'RECEPTIONNISTE']);
  if (!guard.ok) return guard.error;

  const apiKey = process.env.RESEND_API_KEY;
  const configured = Boolean(apiKey && apiKey !== 're_placeholder_for_build');

  return NextResponse.json({ configured });
}
