'use client';

import { useEffect, useRef, useCallback } from 'react';
import { signOut } from 'next-auth/react';

interface UseIdleTimeoutOptions {
  /** Idle time in milliseconds before warning (default: 25 minutes) */
  warningMs?: number;
  /** Idle time in milliseconds before automatic logout (default: 30 minutes) */
  logoutMs?: number;
  /** Callback to show a warning to the user before logout */
  onWarning?: () => void;
  /** Callback when user is logged out */
  onLogout?: () => void;
  /** Whether the hook is active (e.g., disable if not authenticated) */
  enabled?: boolean;
}

const USER_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'keydown',
  'mousedown',
  'touchstart',
  'scroll',
  'click',
];

const DEFAULT_WARNING_MS = 25 * 60 * 1000; // 25 minutes
const DEFAULT_LOGOUT_MS = 30 * 60 * 1000;  // 30 minutes

/**
 * Hook to automatically log out inactive users.
 *
 * Tracks user activity via DOM events and calls signOut() after a period
 * of inactivity, with an optional warning before logout.
 *
 * @example
 * useIdleTimeout({
 *   onWarning: () => toast.warning('Déconnexion imminente pour inactivité'),
 * });
 */
export function useIdleTimeout({
  warningMs = DEFAULT_WARNING_MS,
  logoutMs = DEFAULT_LOGOUT_MS,
  onWarning,
  onLogout,
  enabled = true,
}: UseIdleTimeoutOptions = {}) {
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    onLogout?.();
    await signOut({ callbackUrl: '/login?reason=idle' });
  }, [clearTimers, onLogout]);

  const resetTimers = useCallback(() => {
    if (!enabled) return;

    clearTimers();
    warnedRef.current = false;

    warningTimerRef.current = setTimeout(() => {
      if (!warnedRef.current) {
        warnedRef.current = true;
        onWarning?.();
      }
    }, warningMs);

    logoutTimerRef.current = setTimeout(() => {
      handleLogout();
    }, logoutMs);
  }, [enabled, clearTimers, warningMs, logoutMs, onWarning, handleLogout]);

  useEffect(() => {
    if (!enabled) return;

    resetTimers();

    USER_EVENTS.forEach(event => {
      window.addEventListener(event, resetTimers, { passive: true });
    });

    return () => {
      clearTimers();
      USER_EVENTS.forEach(event => {
        window.removeEventListener(event, resetTimers);
      });
    };
  }, [enabled, resetTimers, clearTimers]);

  return { resetTimers };
}
