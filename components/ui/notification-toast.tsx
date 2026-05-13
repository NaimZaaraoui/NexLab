'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationToastProps {
  type: 'success' | 'error';
  message: string;
}

export function NotificationToast({ type, message }: NotificationToastProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4700);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 shadow-[0_14px_40px_rgba(15,31,51,0.18)]  transition-all duration-300 lg:bottom-8 lg:right-8 ${
      isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0 pointer-events-none'
    } ${
      type === 'success' ? 'text-emerald-900' : 'text-rose-900'
    }`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)]">{type === 'success' ? 'Succès' : 'Erreur'}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>,
    document.body
  );
}
