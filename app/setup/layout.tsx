import '@/app/globals.css';
import { NexLabLockup } from '@/components/branding/NexLabLockup';

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-gradient-to-b from-indigo-700 via-indigo-600 to-indigo-900 p-10 relative overflow-hidden shrink-0">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-10 -right-20 h-60 w-60 rounded-full bg-indigo-300/20 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <NexLabLockup variant="light" size="md" />
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Bienvenue dans<br />votre laboratoire
          </h1>
          <p className="mt-4 text-base leading-relaxed text-indigo-100">
            Configurez NexLab en quelques minutes. Toutes vos données restent sur votre serveur, sans aucune dépendance Cloud.
          </p>

          <div className="mt-8 space-y-3">
            {['Base de données locale sécurisée', 'Catalogue de tests préconfigurés', 'Interface optimisée pour les techniciens'].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3 text-white">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <span className="text-sm text-indigo-50">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-indigo-200/60">
          © {new Date().getFullYear()} NexLab — Tous droits réservés
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-[#f8fafc] p-6 lg:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
