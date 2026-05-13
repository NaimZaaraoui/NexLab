'use client';

import React, { useState } from 'react';
import { DownloadCloud, UserX, AlertTriangle, Check, Loader2 } from 'lucide-react';

interface GDPRPanelProps {
  patientId: string;
  patientName: string;
  onPurgeSuccess?: () => void;
}

export function GDPRPanel({ patientId, patientName, onPurgeSuccess }: GDPRPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/export`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient_${patientId}_gdpr.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      setError('L\'export a échoué. Assurez-vous d\'avoir les droits administrateur.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurge = async () => {
    setIsPurging(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/purge`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setShowPurgeConfirm(false);
      if (onPurgeSuccess) {
        onPurgeSuccess();
      } else {
        window.location.href = '/patients';
      }
    } catch (err) {
      setError('La purge a échoué. Vérifiez vos permissions administrateur.');
      setIsPurging(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
      
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
        Protections des Données (RGPD)
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-2xl">
        Ces outils vous permettent de vous conformer aux exigences légales concernant les données personnelles de <strong>{patientName}</strong>. 
        Toute action est conservée dans les journaux d'audit de sécurité.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* EXPORT CARD */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Droit à la portabilité</h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 grow">
            Télécharge une archive complète structurée (JSON) contenant l'ensemble des données démographiques, de facturation et de résultats d'analyses du patient.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : exportSuccess ? <Check className="w-4 h-4 text-green-500" /> : <DownloadCloud className="w-4 h-4" />}
            {isExporting ? 'Génération...' : exportSuccess ? 'Archive téléchargée' : 'Exporter les données (JSON)'}
          </button>
        </div>

        {/* PURGE CARD */}
        <div className="border border-red-100 dark:border-red-900/30 rounded-2xl p-5 flex flex-col hover:border-red-300 dark:hover:border-red-800/50 transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-bl-full -z-10"></div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <UserX className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Droit à l'oubli</h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 grow">
            Supprime définitivement le profil du patient ET toutes ses analyses associées du système.
            <strong className="text-red-600 dark:text-red-400 block mt-1">⚠️ Action irréversible.</strong>
          </p>
          
          {!showPurgeConfirm ? (
            <button
              onClick={() => setShowPurgeConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl transition-colors"
            >
              <UserX className="w-4 h-4" />
              Purger le dossier
            </button>
          ) : (
             <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={handlePurge}
                  disabled={isPurging}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {isPurging ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  {isPurging ? 'Suppression...' : 'Confirmer la purge définitive'}
                </button>
                <button
                  onClick={() => setShowPurgeConfirm(false)}
                  disabled={isPurging}
                  className="w-full flex items-center justify-center py-2 px-4 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-sm rounded-xl transition-colors"
                >
                  Annuler
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
