import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level = 'ERROR', message, digest, url } = body as {
      level?: string;
      message?: string;
      digest?: string;
      url?: string;
    };

    logger.error('CLIENT_ERROR', {
      message: message?.slice(0, 500),
      digest,
      url,
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    });

    if (level === 'ERROR') {
      await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.AUTH_SECRET ?? '' },
        body: JSON.stringify({
          action: 'system.client_error',
          severity: 'WARN',
          entity: 'system',
          details: { message: message?.slice(0, 200), digest, url },
        }),
      }).catch(() => {});
    }
  } catch {
    // Never let this endpoint crash
  }

  return NextResponse.json({ ok: true });
}
