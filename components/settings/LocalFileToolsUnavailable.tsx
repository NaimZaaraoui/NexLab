import Link from 'next/link';
import { CloudOff } from 'lucide-react';
import { LOCAL_FILE_TOOLS_UNAVAILABLE_MESSAGE } from '@/lib/core/deployment';

export function LocalFileToolsUnavailable() {
  return (
    <section className="mx-auto max-w-[900px] rounded-xl border border-amber-200 bg-amber-50 px-5 py-5 text-amber-950">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
          <CloudOff className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Fonction disponible uniquement en installation locale</h2>
          <p className="mt-1 text-sm leading-relaxed">{LOCAL_FILE_TOOLS_UNAVAILABLE_MESSAGE}</p>
          <p className="mt-2 text-sm leading-relaxed">
            Sur la demo Vercel, les sauvegardes, restaurations, imports de fichiers et chemins externes sont desactives pour eviter les erreurs de disque.
          </p>
          <Link href="/dashboard/settings" className="mt-4 inline-flex rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
            Retour aux parametres
          </Link>
        </div>
      </div>
    </section>
  );
}
