'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { RapportImpression } from '@/components/print/RapportImpression';
import { Analysis } from '@/lib/types';

export default function ExportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reportSettings, setReportSettings] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const autoPrint = searchParams.get('autoprint') === '1';
  const closeAfterPrint = searchParams.get('closeAfterPrint') === '1';
  const selectedResultIds = (searchParams.get('selected') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  useEffect(() => {
    const printToken = searchParams.get('printToken') || '';
    const tokenHeaders = printToken ? { 'x-internal-print-token': printToken } : undefined;
    const patchHeaders = {
      'Content-Type': 'application/json',
      ...(tokenHeaders || {}),
    };

    const loadData = async () => {
      try {
        const [analysisRes, settingsRes] = await Promise.all([
          fetch(`/api/analyses/${id}`, { headers: tokenHeaders }),
          fetch('/api/settings', { headers: tokenHeaders })
        ]);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setReportSettings(settingsData);
        }

        if (analysisRes.ok) {
          const data = await analysisRes.json();
          setAnalysis(data);
          
          if (!data.printedAt) {
             fetch(`/api/analyses/${id}`, {
              method: 'PATCH',
              headers: patchHeaders,
              body: JSON.stringify({ printedAt: new Date().toISOString() })
            }).catch(console.error);
          }
        }
        
        // Wait for React to render the newly fetched settings (images) into the DOM
        setTimeout(() => setReady(true), 800);
      } catch (error) {
        console.error('Error fetching data for export:', error);
        setTimeout(() => setReady(true), 1500);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, searchParams]);

  useEffect(() => {
    if (!ready || !autoPrint) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 150);

    if (closeAfterPrint) {
      const previous = window.onafterprint;
      window.onafterprint = () => {
        previous?.call(window, new Event('afterprint'));
        window.close();
      };

      return () => {
        window.clearTimeout(timer);
        window.onafterprint = previous;
      };
    }

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint, closeAfterPrint, ready]);

  if (!analysis) return null;

  const resultsRecord: Record<string, string> = {};
  analysis.results?.forEach(r => {
    resultsRecord[r.id] = r.value || '';
  });

  return (
    <div className="font-sans min-h-screen bg-[var(--color-surface)]">
      <style>{`
        *, body, html {
          font-family: "Segoe UI", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif !important;
        }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          min-height: 100% !important;
        }
      `}</style>

      <RapportImpression
        analysis={analysis}
        results={resultsRecord}
        selectedResultIds={selectedResultIds}
        settings={reportSettings}
      />

      {ready && <div id="render-complete" style={{ display: 'none' }} />}
    </div>
  );
}
