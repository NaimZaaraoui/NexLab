import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const auth = await requireAnyRole(['ADMIN']);
    if (!auth.ok) return auth.error;

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit') || '100';
    const limit = parseInt(limitParam, 10) || 100;

    const logs = await logger.getRecentLogs(limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Erreur lors de la lecture des logs système:', error);
    return NextResponse.json(
      { error: 'Impossible de lire les logs du serveur' },
      { status: 500 }
    );
  }
}
