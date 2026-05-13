'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { LicenseStatus } from '@/lib/license';

// We share the status globally so any "Create" button can disable itself if needed,
// though the banner is usually enough to signal the user.
interface LicenseContextType {
  status: LicenseStatus | null;
  loading: boolean;
  isExpired: boolean;
  refresh: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType>({
  status: null,
  loading: true,
  isExpired: false,
  refresh: async () => {},
});

export function useLicense() {
  return useContext(LicenseContext);
}

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system/license', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch license status', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isExpired = status ? !status.isValid : false;

  return (
    <LicenseContext.Provider value={{ status, loading, isExpired, refresh: fetchStatus }}>
      {/* GLOBAL BLOCKING BANNER */}
      {isExpired && !loading && (
        <div className="sticky top-0 z-[100] flex w-full items-center justify-center gap-3 bg-rose-600 px-4 py-3 text-white shadow-md animate-fade-in print:hidden">
          <ShieldAlert size={20} className="text-rose-100" />
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
            <p className="text-sm font-bold tracking-wide">
              {status?.status === 'NO_LICENSE' 
                ? "NexLab n'est pas activé. Le système est verrouillé en mode consultation." 
                : "Licence NexLab expirée. Le système est verrouillé en mode consultation."}
            </p>
            <a href="/dashboard/settings/license" className="text-xs font-black text-rose-100 underline decoration-rose-300 underline-offset-2 hover:text-white">
              Activer ma licence →
            </a>
          </div>
        </div>
      )}
      {children}
    </LicenseContext.Provider>
  );
}
