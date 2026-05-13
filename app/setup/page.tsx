'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ready' | 'redirecting'>('checking');

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/setup/status');
        const data = await res.json();
        
        if (data.initialized) {
          setStatus('ready');
        } else {
          setStatus('redirecting');
          router.push('/setup/wizard');
        }
      } catch {
        setStatus('redirecting');
        router.push('/setup/wizard');
      }
    }
    checkStatus();
  }, [router]);

  if (status === 'checking') {
    return (
      <div className="bg-[var(--color-surface)]/10  rounded-3xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-white/70">Vérification de l&apos;installation...</p>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="bg-[var(--color-surface)]/10  rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-white mb-4">NexLab est déjà configuré</h1>
        <p className="text-white/70 mb-6">Vous pouvez vous connecter à l&apos;application.</p>
        <Link 
          href="/login"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-colors"
        >
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return null;
}