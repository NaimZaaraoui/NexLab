'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { CsrfFetchProvider } from './CsrfFetchProvider';

export function Providers({ 
  children, 
  session 
}: { 
  children: React.ReactNode, 
  session: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <CsrfFetchProvider>
        {children}
      </CsrfFetchProvider>
    </SessionProvider>
  );
}
