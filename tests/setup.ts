import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock next/server (NextResponse) to avoid next-auth CJS/ESM resolution issue in Vitest
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })),
    redirect: vi.fn((url: string) => new Response(null, { status: 302, headers: { Location: url } })),
    next: vi.fn(() => new Response(null, { status: 200 })),
  },
  NextRequest: Request,
}));

// Mock next-auth and @/lib/auth to avoid next-auth deep import issues in unit tests
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    patient: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    analyse: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Suppress console errors in tests (optional)
global.console.error = vi.fn();
global.console.warn = vi.fn();
