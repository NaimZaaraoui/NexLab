import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const APP_ROLES = Object.freeze(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE', 'MEDECIN'] as const);
export type AppRole = (typeof APP_ROLES)[number];

export function getInternalPrintToken() {
  return process.env.INTERNAL_PRINT_TOKEN || process.env.AUTH_SECRET || '';
}

export function hasValidInternalPrintToken(request: Request) {
  const expectedToken = getInternalPrintToken();
  if (!expectedToken) return false;

  const headerToken = request.headers.get('x-internal-print-token');
  if (headerToken && headerToken === expectedToken) return true;

  try {
    const queryToken = new URL(request.url).searchParams.get('printToken');
    return queryToken === expectedToken;
  } catch {
    return false;
  }
}

export async function requireAuthUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    session,
    userId: session.user.id,
    role: (session.user.role || '') as string,
  };
}

export async function requireAnyRole(roles: AppRole[]) {
  const authResult = await requireAuthUser();
  if (!authResult.ok) {
    return authResult;
  }

  if (!roles.includes(authResult.role as AppRole)) {
    return {
      ok: false as const,
      error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }),
    };
  }

  return authResult;
}
