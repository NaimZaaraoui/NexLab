'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const payload = {
      level: 'ERROR',
      message: error.message,
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : null,
      timestamp: new Date().toISOString(),
    };
    fetch('/api/log-client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Une erreur inattendue s'est produite</h2>
        <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
          L'incident a été enregistré automatiquement. Vous pouvez réessayer ou contacter l'administrateur si le problème persiste.
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--color-text-soft)]">
            Référence : <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105"
      >
        <RefreshCw className="h-4 w-4" />
        Réessayer
      </button>
    </div>
  );
}
