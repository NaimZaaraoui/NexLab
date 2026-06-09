'use client';

import { useEffect } from 'react';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix))
    ?.slice(prefix.length) || '';
}

function resolveMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method.toUpperCase();
  if (input instanceof Request) return input.method.toUpperCase();
  return 'GET';
}

function isSameOrigin(input: RequestInfo | URL) {
  const url = input instanceof Request ? input.url : input.toString();
  return new URL(url, window.location.origin).origin === window.location.origin;
}

export function CsrfFetchProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const method = resolveMethod(input, init);

      if (!UNSAFE_METHODS.has(method) || !isSameOrigin(input)) {
        return originalFetch(input, init);
      }

      const token = readCookie(CSRF_COOKIE_NAME);
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      if (token && !headers.has(CSRF_HEADER_NAME)) {
        headers.set(CSRF_HEADER_NAME, token);
      }

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return children;
}
