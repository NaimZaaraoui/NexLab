import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_ONLY = ['/dashboard/settings', '/dashboard/users', '/tests', '/dashboard/qc/config'];
const BLOCKED_MEDECIN = ['/analyses/nouvelle', '/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_RECEPTIONNISTE = ['/dashboard/settings', '/dashboard/users', '/tests'];

const PUBLIC_PREFIXES = [
  '/login',
  '/setup',
  '/branding',
  '/api/setup',
  '/api/diagnostic',
  '/api/auth',
  '/api/notifications',
  '/_next',
  '/favicon.ico',
  '/icon.png',
  '/apple-icon.png',
  '/public',
  '/uploads',
  '/diagnostic',
];

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'self'",
  ].join('; '),
};

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const internalPrintToken = process.env.INTERNAL_PRINT_TOKEN || process.env.AUTH_SECRET || '';
  const isInternalExportRoute = /^\/analyses\/[^/]+\/export\/?$/.test(pathname);
  const hasValidInternalPrintToken =
    Boolean(internalPrintToken) &&
    nextUrl.searchParams.get('printToken') === internalPrintToken;

  // 1. Allow public routes
  if (isPublicPath(pathname) || (isInternalExportRoute && hasValidInternalPrintToken)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // 2. Get token and handle unauthenticated users
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/login', req.url)));
  }

  // 3. Force password change if required
  if (token.mustChangePassword && pathname !== '/changer-mot-de-passe') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/changer-mot-de-passe', req.url)));
  }

  // 4. Role-based Page Restrictions
  const role = token.role as string;

  if (role === 'MEDECIN' && BLOCKED_MEDECIN.some(p => pathname.startsWith(p))) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/', req.url)));
  }
  if (role === 'RECEPTIONNISTE' && BLOCKED_RECEPTIONNISTE.some(p => pathname.startsWith(p))) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/', req.url)));
  }
  if (role !== 'ADMIN' && ADMIN_ONLY.some(p => pathname.startsWith(p))) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/', req.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|branding|public|uploads).*)'],
};
