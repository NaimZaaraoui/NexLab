'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextValue {
  toast: (type: Toast['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const counterRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toast = useCallback((type: Toast['type'], message: string) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 lg:bottom-8 lg:right-8">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 shadow-[0_14px_40px_rgba(15,31,51,0.18)] backdrop-blur-sm animate-fade-in min-w-[260px] max-w-[380px]`}
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                    t.type === 'success'
                      ? 'bg-emerald-50 text-emerald-600'
                      : t.type === 'error'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {t.type === 'success' ? (
                    <CheckCircle size={15} />
                  ) : t.type === 'error' ? (
                    <AlertCircle size={15} />
                  ) : (
                    <AlertCircle size={15} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {t.type === 'success' ? 'Succès' : t.type === 'error' ? 'Erreur' : 'Info'}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)] leading-snug">{t.message}</p>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="mt-0.5 shrink-0 rounded-md p-0.5 text-slate-400 hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-colors"
                  aria-label="Fermer"
                >
                  <XCircle size={15} />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
