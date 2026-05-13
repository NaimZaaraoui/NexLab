'use client';

import { PlayCircle, ShieldAlert, FileQuestion, Mail, Server, Wrench, FileSearch, Bug, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const TUTORIAL_VIDEOS = [
  { title: "Saisir une nouvelle ordonnance", duration: "4:12", icon: FileSearch, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Gérer le Contrôle Qualité (QC)", duration: "6:30", icon: Wrench, color: "text-amber-500", bg: "bg-amber-50" },
  { title: "Valider une analyse en urgence", duration: "2:45", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-50" },
];

const FAQS = [
  { 
    q: "Comment restaurer une sauvegarde de la base de données ?",
    a: "Connectez-vous en tant qu'Administrateur, allez dans 'Paramètres > Base de données', cliquez sur 'Sauvegardes' puis importez votre fichier SQLite. Le système validera l'intégrité avant d'écraser la base actuelle."
  },
  {
    q: "Le rapport PDF s'imprime en noir et blanc au lieu des couleurs ?",
    a: "Vérifiez que l'option 'Graphiques d'arrière-plan' est bien cochée dans les paramètres de votre pilote d'imprimante (Chrome ou Firefox), ou optez pour l'impression native sans boite de dialogue."
  },
  {
    q: "Mon automate Diatron ne transmet plus les résultats.",
    a: "Assurez-vous que le service 'NexLab LIS Bridge' tourne sur le PC de l'automate et que la connexion réseau (RJ45 ou Wi-fi) entre l'automate et le serveur Docker local est opérationnelle."
  }
];

export default function SupportHubPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      
      {/* HEADER BENTO */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-600 to-indigo-900 px-8 py-10 shadow-lg lg:col-span-2">
         <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
         <div className="absolute right-32 -bottom-32 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl"></div>
         <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-white">Hub de Support & Aide</h1>
             <p className="mt-2 max-w-xl text-indigo-100">
               Bienvenue dans le centre de connaissances de NexLab. Explorez les tutoriels vidéos ou consultez notre base FAQ pour résoudre vos problématiques techniques instantanément.
             </p>
           </div>
           <div className="flex shrink-0 gap-3">
             <button className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-transform hover:scale-105 hover:shadow-md">
               <Mail className="h-4 w-4" />
               Contacter NexLab
             </button>
           </div>
         </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* VIDEOS SECTION */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-text-soft)]">
            Tutoriels Vidéos Essentiels
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {TUTORIAL_VIDEOS.map((vid, idx) => (
              <div key={idx} className="group relative flex flex-col overflow-hidden rounded-2xl border bg-[var(--color-surface)] p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${vid.bg} ${vid.color}`}>
                  <vid.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-[var(--color-text)]">
                  {vid.title}
                </h3>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="text-xs font-semibold text-[var(--color-text-soft)]">{vid.duration}</span>
                  <button className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition-colors group-hover:bg-indigo-50">
                    <PlayCircle className="h-4 w-4" />
                    Lecture
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-[var(--color-text-soft)]">
            Foire Aux Questions (FAQ)
          </h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                className="overflow-hidden rounded-2xl border bg-[var(--color-surface)] shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-muted)]"
                >
                  <span className="text-sm font-semibold text-[var(--color-text)]">{faq.q}</span>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-soft)] transition-transform ${openFaq === idx ? 'rotate-90' : ''}`}>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
                <div 
                  className={`border-t bg-[var(--color-surface-muted)]/30 px-5 text-sm text-[var(--color-text-secondary)] transition-all ${
                    openFaq === idx ? 'py-4 opacity-100' : 'h-0 py-0 overflow-hidden opacity-0'
                  }`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SIDEBAR WIDGETS */}
        <section className="flex flex-col gap-6">
          <div className="rounded-2xl border bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Diagnostic Système</h3>
                <p className="text-xs text-[var(--color-text-soft)]">Analyser l'état local</p>
              </div>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              En cas d'anomalie critique sur le laboratoire, générez un rapport réseau et système à transmettre à l'équipe informatique.
            </p>
            <Link href="/dashboard/monitoring" className="flex w-full justify-center rounded-xl bg-[var(--color-surface-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-slate-200 hover:text-slate-900">
              Ouvrir le portail de Diagnostic
            </Link>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
             <div className="mb-4 flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                 <Bug className="h-5 w-5" />
               </div>
               <div>
                 <h3 className="text-sm font-semibold text-blue-900">Assistance Avancée</h3>
                 <p className="text-xs text-blue-700/70">NexLab Pro Contract Required</p>
               </div>
             </div>
             <p className="mb-4 text-xs leading-relaxed text-blue-800">
               Votre licence inclut un support d'urgence technique de niveau 2 (Intervention base de données & Mises à niveau réseaux).
             </p>
             <button className="flex w-full justify-center items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-blue-500">
               Demander une intervention
             </button>
          </div>
        </section>
      </div>
    </div>
  );
}
