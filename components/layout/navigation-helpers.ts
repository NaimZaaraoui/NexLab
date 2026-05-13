'use client';

const ADMIN_ONLY = ['/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_MEDECIN = ['/analyses/nouvelle', '/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_RECEPTIONNISTE = ['/dashboard/settings', '/dashboard/users', '/tests'];

export function isNavigationLinkVisible(role: string, href: string) {
  if (role === 'ADMIN') return true;
  if (href.startsWith('/dashboard/support')) return true;
  if (role === 'MEDECIN' && BLOCKED_MEDECIN.some((path) => href.startsWith(path))) return false;
  if (role === 'RECEPTIONNISTE' && BLOCKED_RECEPTIONNISTE.some((path) => href.startsWith(path))) return false;
  if (role !== 'ADMIN' && ADMIN_ONLY.some((path) => href.startsWith(path))) return false;
  return true;
}

export function isNavigationLinkActive(pathname: string, href: string) {
  if (href === '/' || href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
  return pathname.startsWith(href);
}
