'use client';

import {
  ArrowRight,
  Beaker,
  Database,
  Key,
  Layers,
  Printer,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { PageBackLink } from '@/components/ui/PageBackLink';

const settingsGroups = [
  {
    title: 'Configuration des analyses',
    description: 'Tout ce qui pilote la structure du catalogue, les raccourcis de saisie et la présentation des documents remis au laboratoire.',
    icon: Sparkles,
    tone: {
      icon: 'text-indigo-700',
      iconBg: 'bg-indigo-50',
      ring: 'hover:border-indigo-200 hover:ring-indigo-100/80',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
      accent: 'bg-indigo-500',
    },
    items: [
      {
        title: 'Raccourcis & Bilans',
        description: 'Gérez vos groupes de tests rapides, les panneaux standards et les raccourcis utilisés à l’accueil.',
        badge: 'Flux rapide',
        icon: Sparkles,
        href: '/dashboard/settings/bilans',
      },
      {
        title: "Catalogue d'analyses",
        description: "Organisez les catégories, l’ordre d’affichage et la structure du catalogue analytique.",
        badge: 'Structure',
        icon: Layers,
        href: '/tests/ordering',
      },
      {
        title: "Modèles d'impression",
        description: 'Ajustez les en-têtes, pieds de page et le rendu final des documents remis au patient ou au médecin.',
        badge: 'Sorties',
        icon: Printer,
        href: '/dashboard/settings/print',
      },
      {
        title: 'Configuration métier',
        description: "Centralisez les types d’échantillons, paramètres financiers et réglages métier du laboratoire.",
        badge: 'Réglages labo',
        icon: Beaker,
        href: '/dashboard/settings/lab',
      },
    ],
  },
  {
    title: 'Système & sécurité',
    description: 'Les zones sensibles pour l’administration, la protection des données et la supervision du fonctionnement général.',
    icon: ShieldCheck,
    tone: {
      icon: 'text-emerald-700',
      iconBg: 'bg-emerald-50',
      ring: 'hover:border-emerald-200 hover:ring-emerald-100/80',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
      accent: 'bg-emerald-500',
    },
    items: [
      {
        title: 'Gestion du personnel',
        description: 'Contrôlez les accès, les rôles, les comptes actifs et l’organisation des utilisateurs.',
        badge: 'Accès',
        icon: Users,
        href: '/dashboard/users',
      },
      {
        title: 'Maintenance base de données',
        description: 'Sauvegardes, tests de restauration, supervision et protection opérationnelle de la base.',
        badge: 'Protection',
        icon: Database,
        href: '/dashboard/settings/database',
      },
      {
        title: "Journal d'audit",
        description: 'Consultez l’historique détaillé des actions critiques et la traçabilité administrative.',
        badge: 'Traçabilité',
        icon: ShieldCheck,
        href: '/dashboard/settings/audit',
      },
      {
        title: 'Licence NexLab',
        description: 'Vérifiez le statut de licence, les limitations et les informations de renouvellement.',
        badge: 'Abonnement',
        icon: Key,
        href: '/dashboard/settings/license',
      },
    ],
  },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, role, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-transparent" />
      </div>
    );
  }

  if (role !== 'ADMIN') {
    return null;
  }

  const totalSpaces = settingsGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="mx-auto max-w-[1500px] space-y-8 pb-16">
      <section className="bento-panel px-6 py-6 sm:px-7 lg:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <PageBackLink href="/" />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                <Settings className="h-3.5 w-3.5" />
                Centre de configuration
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Mode administrateur
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Réglages essentiels du laboratoire.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-[15px]">
              Catalogue, impression, utilisateurs, sécurité et sauvegardes: les zones sensibles de NexLab sont regroupées ici pour un accès plus simple et plus sûr.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <div className="rounded-2xl border bg-[var(--color-surface-muted)]/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">Espaces</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{totalSpaces}</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Zones d’administration accessibles</p>
            </div>
            <div className="rounded-2xl border bg-[var(--color-surface-muted)]/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">Pôles</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{settingsGroups.length}</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Configuration et sécurité séparées</p>
            </div>
            <div className="rounded-2xl border bg-[var(--color-surface-muted)]/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">Conseil</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">Sauvegardes + audit</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">À vérifier avant toute mise en production</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8">
        {settingsGroups.map((group) => (
          <section
            key={group.title}
            className="bento-panel p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                  <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${group.tone.accent}`} />
                  <group.icon size={22} className={group.tone.icon} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)] sm:text-xl">
                      {group.title}
                    </h2>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${group.tone.badge}`}>
                      {group.items.length} modules
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {group.description}
                  </p>
                </div>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                Choisissez un espace de travail
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {group.items.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border bg-[var(--color-surface-muted)]/70 p-5 text-left shadow-[0_6px_18px_rgba(15,31,51,0.03)] transition-colors duration-150 hover:bg-[var(--color-surface)] hover:ring-2 ${group.tone.ring}`}
                >
                  <div className="relative flex items-start justify-between gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] ${group.tone.iconBg} ${group.tone.icon}`}>
                      <item.icon size={20} />
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] transition-colors group-hover:text-[var(--color-text)]">
                      <ArrowRight size={18} />
                    </div>
                  </div>

                  <div className="relative">
                    <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                      {item.badge}
                    </span>
                    <h3 className="mt-3 text-base font-semibold text-[var(--color-text)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {item.description}
                    </p>
                  </div>

                  <div className="relative mt-auto flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                    Ouvrir l&apos;espace
                    <span className="h-px flex-1 bg-[var(--color-border)] transition-colors group-hover:bg-[var(--color-text-soft)]" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
