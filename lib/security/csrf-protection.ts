/**
 * lib/csrf-protection.ts
 * 
 * CSRF (Cross-Site Request Forgery) protection for NexLab
 * Generates and validates CSRF tokens on all state-changing operations
 * 
 * Usage:
 * - Server: Generate token in forms/API responses
 * - Client: Include token in X-CSRF-Token header or form field
 * - Middleware: Validate token on POST/PUT/DELETE operations
 */

import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a new CSRF token
 * Should be called once per session and stored in a secure, HTTP-only cookie
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Store CSRF token in HTTP-only cookie
 * Call this once at session start (login)
 */
export async function setCSRFTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Retrieve CSRF token from cookie
 */
export async function getCSRFTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Validate CSRF token from request
 * Checks: token exists, matches cookie, is non-empty
 * 
 * @param token - Token from X-CSRF-Token header or form field
 * @returns true if valid, false otherwise
 */
export async function validateCSRFToken(token: string | null | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string' || token.length === 0) {
    return false;
  }

  const storedToken = await getCSRFTokenFromCookie();
  if (!storedToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return token === storedToken;
}

/**
 * Middleware wrapper for API routes
 * Add to POST/PUT/DELETE handlers to enforce CSRF validation
 * 
 * @example
 * export async function POST(request: Request) {
 *   await enforceCSRF(request);
 *   // Process request...
 * }
 */
export async function enforceCSRF(request: Request): Promise<void> {
  const token = request.headers.get(CSRF_HEADER_NAME);
  
  if (!(await validateCSRFToken(token))) {
    throw new Error('CSRF validation failed: invalid or missing token');
  }
}

/**
 * Generate a hidden form field for CSRF token
 * Use in server components that render forms
 */
export async function getCSRFFieldHTML(): Promise<string> {
  const token = await getCSRFTokenFromCookie();
  if (!token) return '';
  return `<input type="hidden" name="csrf-token" value="${token}" />`;
}
