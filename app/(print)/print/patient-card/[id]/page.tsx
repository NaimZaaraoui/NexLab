'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LucideMicroscope, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PageBackLink } from '@/components/ui/PageBackLink';

type PatientAnalysis = { id: string };

type PatientData = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  gender: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  analyses: PatientAnalysis[];
};

export default function PatientCardPrintPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const autoPrint = searchParams.get('autoprint') === '1';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [patientResponse, settingsResponse] = await Promise.all([
          fetch(`/api/patients/${id}/history`),
          fetch('/api/settings'),
        ]);
        if (!mounted) return;
        if (patientResponse.ok) setPatient(await patientResponse.json());
        if (settingsResponse.ok) setSettings(await settingsResponse.json());
      } finally {
        if (mounted) {
          setLoading(false);
          window.setTimeout(() => setReady(true), 250);
        }
      }
    };
    if (id) load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!ready || !autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [autoPrint, ready]);

  const patientName = useMemo(() => {
    if (!patient) return '';
    return `${patient.firstName} ${patient.lastName}`.trim();
  }, [patient]);

  const memberCode = useMemo(() => {
    if (!patient) return '';
    return patient.id.slice(-8).toUpperCase();
  }, [patient]);

  const labName = settings.lab_name || 'NexLab';
  const labSubtitle = settings.lab_subtitle || 'Centre de Santé';

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm font-medium text-[var(--color-text-secondary)] animate-pulse">Chargement...</div>;
  }
  if (!patient) {
    return <div className="flex h-screen items-center justify-center text-sm font-bold text-rose-500">Patient introuvable.</div>;
  }

  const dateEdition = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#f3f6f9] py-12 px-4 print:p-0 print:bg-white flex flex-col items-center print:items-stretch">

      {/* Screen-only toolbar */}
      <section className="w-full max-w-[21cm] mb-8 print:hidden">
        <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <PageBackLink href={`/dashboard/patients/${patient.id}`} />
            <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight">Fiche Médicale Patient</h1>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Document standardisé, identique aux rapports d&apos;analyse.</p>
          </div>
          <button onClick={() => window.print()} className="group btn-primary h-14 px-8 rounded-2xl">
            <Printer size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="font-bold">Imprimer</span>
          </button>
        </div>
      </section>

      {/* A4 page — plain divs, no outer table (avoids 2-page split bug) */}
      <div className="w-[21cm] bg-white shadow-[0_40px_80px_rgba(15,31,51,0.12)] border border-[var(--color-border)] print:border-none print:shadow-none print:m-0 print:w-full flex flex-col">

        {/* ── HEADER ── */}
        <div>
          <div className="flex justify-between items-end mb-4 pt-4 px-4">
            <div className="flex items-center gap-4 mb-4">
              {settings.lab_logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={settings.lab_logo} alt={labName} className="h-14 w-auto max-w-[120px] object-contain" />
              ) : (
                <div className="p-2 bg-black rounded-xl">
                  <LucideMicroscope size={40} className="text-white" />
                </div>
              )}
              <div className="flex flex-col ml-2">
                <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight uppercase print:text-black leading-none">{labName}</h1>
                <div className="text-xs font-black text-[var(--color-text-secondary)] uppercase tracking-[0.08em] mt-2 flex items-center gap-2 print:text-black/70">
                  <span className="w-6 h-[2px] bg-indigo-600 print:bg-black"></span>
                  {labSubtitle}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-5 pr-6">
              <div className="text-right">
                <h2 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-tight mb-1 print:text-black">FICHE PATIENT</h2>
                <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.08em] print:text-black/60">ID Dossier: {memberCode}</p>
              </div>
              {settings.report_show_barcode !== 'false' && (
                <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-sm print:border-black/20 print:shadow-none shrink-0 mix-blend-multiply">
                  <QRCodeSVG value={memberCode} size={54} level="M" />
                </div>
              )}
            </div>
          </div>

          {/* Patient identity bar */}
          <div className="grid grid-cols-12 gap-4 mb-6 px-4">
            <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/10"></div>
            <div className="col-span-4">
              <span className="text-xs font-black text-[var(--color-accent)] uppercase tracking-[0.08em] print:text-black">Patient</span>
              <div className="flex flex-col mt-2">
                <h3 className="text-2xl font-black text-[var(--color-text)] mb-2 print:text-black">{patientName}</h3>
                <div className="flex gap-4 text-sm font-medium text-[var(--color-text-secondary)] print:text-black">
                  <span>{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                  <span className="text-slate-200 print:text-black/30">|</span>
                  <span className="uppercase">{patient.gender === 'M' ? 'H' : 'F'}</span>
                  <span className="text-slate-200 print:text-black/30">|</span>
                  <span>ID: <span className="font-bold text-[var(--color-text)] print:text-black">{memberCode}</span></span>
                </div>
              </div>
            </div>
            <div className="col-span-8 grid grid-cols-2 gap-4 pl-8 border-l border-[var(--color-border)] print:border-black/10">
              <div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Statut Dossier</span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">
                  {patient.analyses.length > 0 ? 'Dossier Existant' : 'Dossier Nouveau'}
                </p>
              </div>
              <div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Édition</span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{dateEdition}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Établissement</span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{labName}</p>
              </div>
            </div>
            <div className="col-span-12 h-[2px] bg-indigo-600 print:bg-black rounded-full"></div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 px-4 mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-muted)]/50 print:bg-black/5">
                <th className="py-2 pl-4 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 print:text-black/80 w-[40%]">Champ / Catégorie</th>
                <th className="py-2 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 print:text-black/80">Informations Enregistrées</th>
              </tr>
            </thead>
            <tbody>
              {/* IDENTITÉ */}
              <tr>
                <td colSpan={2} className="py-2">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">État Civil &amp; Identité</span>
                    <div className="h-[1px] flex-1 bg-[var(--color-surface-muted)] print:bg-black/10"></div>
                  </div>
                </td>
              </tr>
              <tr className="even:bg-[var(--color-surface-muted)]/30 break-inside-avoid">
                <td className="py-2.5 pl-8"><span className="text-[12px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">Nom &amp; Prénom</span></td>
                <td className="py-2.5"><span className="text-[14px] tracking-tight font-black text-[var(--color-text)] print:text-black uppercase">{patientName}</span></td>
              </tr>
              <tr className="even:bg-[var(--color-surface-muted)]/30 break-inside-avoid">
                <td className="py-2.5 pl-8"><span className="text-[12px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">Date de Naissance</span></td>
                <td className="py-2.5">
                  <span className="text-[14px] tracking-tight font-bold text-[var(--color-text)] print:text-black">
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Non renseignée'}
                  </span>
                </td>
              </tr>
              <tr className="even:bg-[var(--color-surface-muted)]/30 break-inside-avoid">
                <td className="py-2.5 pl-8"><span className="text-[12px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">Sexe</span></td>
                <td className="py-2.5"><span className="text-[14px] tracking-tight font-bold text-[var(--color-text)] print:text-black uppercase">{patient.gender === 'F' ? 'Féminin' : 'Masculin'}</span></td>
              </tr>

              {/* COORDONNÉES */}
              <tr>
                <td colSpan={2} className="py-2 pt-5">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Coordonnées de Contact</span>
                    <div className="h-[1px] flex-1 bg-[var(--color-surface-muted)] print:bg-black/10"></div>
                  </div>
                </td>
              </tr>
              <tr className="even:bg-[var(--color-surface-muted)]/30 break-inside-avoid">
                <td className="py-2.5 pl-8"><span className="text-[12px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">Téléphone Principal</span></td>
                <td className="py-2.5"><span className="text-[14px] tracking-tight font-bold text-[var(--color-text)] print:text-black">{patient.phoneNumber || '—'}</span></td>
              </tr>
              <tr className="even:bg-[var(--color-surface-muted)]/30 break-inside-avoid">
                <td className="py-2.5 pl-8"><span className="text-[12px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">Adresse Email</span></td>
                <td className="py-2.5"><span className="text-[14px] tracking-tight font-bold text-[var(--color-text)] print:text-black">{patient.email || '—'}</span></td>
              </tr>
              <tr className="even:bg-[var(--color-surface-muted)]/30 break-inside-avoid">
                <td className="py-2.5 pl-8"><span className="text-[12px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">Adresse Complète</span></td>
                <td className="py-2.5"><span className="text-[14px] tracking-tight font-bold text-[var(--color-text)] print:text-black">{patient.address || '—'}</span></td>
              </tr>

              {/* HISTORIQUE */}
              <tr>
                <td colSpan={2} className="py-2 pt-5">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Historique Laboratoire</span>
                    <div className="h-[1px] flex-1 bg-[var(--color-surface-muted)] print:bg-black/10"></div>
                  </div>
                </td>
              </tr>
              <tr className="even:bg-[var(--color-surface-muted)]/30 break-inside-avoid">
                <td className="py-2.5 pl-8"><span className="text-[12px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">Dossiers d&apos;Analyse</span></td>
                <td className="py-2.5"><span className="text-[14px] tracking-tight font-bold text-[var(--color-text)] print:text-black">{patient.analyses.length} dossier(s) archivé(s)</span></td>
              </tr>
              <tr className="even:bg-[var(--color-surface-muted)]/30 break-inside-avoid">
                <td className="py-2.5 pl-8"><span className="text-[12px] font-bold text-[var(--color-text)] uppercase tracking-tight print:text-black">Statut Informatique</span></td>
                <td className="py-2.5"><span className="text-[14px] tracking-tight font-bold text-[var(--color-text)] print:text-black uppercase">Compte Actif</span></td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* ── FOOTER ── */}
        <div className="border-t-2 border-slate-900 print:border-black mx-4 pt-6 pb-6">
          <div className="grid grid-cols-3 gap-12">
            <div className="col-span-2">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] mb-4 print:text-black">Notes du Service</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed print:text-black">
                Fiche administrative générée le {dateEdition} par NexLab LIMS.<br />
                <span className="text-xs font-black text-slate-300 uppercase print:text-black/40">Usage professionnel exclusif — Document confidentiel</span>
              </p>
              <div className="mt-4 flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-300 uppercase print:text-black/40">ID Patient</span>
                  <span className="text-[11px] font-bold text-[var(--color-text)] print:text-black">{memberCode}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-300 uppercase print:text-black/40">Dossiers</span>
                  <span className="text-[11px] font-bold text-[var(--color-text)] print:text-black">{patient.analyses.length}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full border-b border-slate-900 pb-2 mb-4 text-center print:border-black">
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] print:text-black">Signature &amp; Cachet</span>
              </div>
              <div style={{ position: 'relative', width: '120px', height: '90px', margin: '0 auto' }}>
                {settings.lab_stamp_image && settings.lab_bio_signature && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.lab_stamp_image} alt="Cachet" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90px', height: '90px', objectFit: 'contain', opacity: 0.9 }} />
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '130px', height: '30px', backgroundColor: 'hsla(0,0%,100%,0.5)', paddingBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={settings.lab_bio_signature} alt="Signature" style={{ width: '120px', height: '30px', objectFit: 'contain', objectPosition: 'center bottom', filter: 'contrast(1.15)' }} />
                    </div>
                  </>
                )}
                {settings.lab_stamp_image && !settings.lab_bio_signature && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.lab_stamp_image} alt="Cachet" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '90px', height: '90px', objectFit: 'contain' }} />
                )}
                {!settings.lab_stamp_image && settings.lab_bio_signature && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.lab_bio_signature} alt="Signature" style={{ width: '130px', height: '30px', objectFit: 'contain', filter: 'contrast(1.15)' }} />
                    <div style={{ width: '120px', height: '60px', border: '1px dashed #cfd2d7', borderRadius: '4px', opacity: 0.5 }}></div>
                  </div>
                )}
                {!settings.lab_stamp_image && !settings.lab_bio_signature && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '120px', height: '90px', border: '2px dashed #cfd2d7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <span style={{ fontSize: '8px', color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.15em', transform: 'rotate(-15deg)' }}>Zone de cachet</span>
                  </div>
                )}
              </div>
              <div className="text-center mt-2">
                <p className="text-xs font-black text-[var(--color-accent)] uppercase tracking-[0.08em] print:text-black">
                  {settings.lab_bio_title && settings.lab_bio_name ? `${settings.lab_bio_title} ${settings.lab_bio_name}` : 'Biologiste Responsable'}
                </p>
                {settings.lab_bio_onmpt && <p className="text-xs font-bold text-slate-500 print:text-black/60 mt-0.5">ONMPT: {settings.lab_bio_onmpt}</p>}
              </div>
            </div>
          </div>

         
        </div>

      </div>

      <style jsx global>{`
        .break-inside-avoid { break-inside: avoid; }
        @media print {
          @page {
            margin: 12mm 10mm;
            size: A4;
            width: 189mm;
          }
          body {
            background: white !important;
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          tr { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
