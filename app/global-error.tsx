'use client';

import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1rem' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#fff0f0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertOctagon style={{ width: 32, height: 32, color: '#e11d48' }} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f1f33', marginBottom: '0.75rem' }}>
            Erreur critique de l'application
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            NexLab a rencontré une erreur fatale. L'incident a été enregistré.
            Contactez votre administrateur si le problème persiste.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              Ref: <code>{error.digest}</code>
            </p>
          )}
          <button
            onClick={reset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Recharger l'application
          </button>
        </div>
      </body>
    </html>
  );
}
