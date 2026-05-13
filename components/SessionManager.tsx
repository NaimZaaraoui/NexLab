'use client';

import { useSession } from 'next-auth/react';
import { useIdleTimeout } from '@/lib/hooks/useIdleTimeout';
import { useRouter } from 'next/navigation';

export function SessionManager({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useIdleTimeout({
    enabled: status === 'authenticated',
    warningMs: 25 * 60 * 1000,
    logoutMs: 30 * 60 * 1000,
    onWarning: () => {
      // Dans le futur, on pourrait afficher un toast ici
      console.warn('Déconnexion imminente pour inactivité (5 minutes restantes)');
    },
    onLogout: () => {
      // Le hook signOut est déjà appelé dans useIdleTimeout, 
      // ici on s'assure juste du message d'erreur dans l'URL
      router.push('/login?reason=idle');
    }
  });

  return <>{children}</>;
}
