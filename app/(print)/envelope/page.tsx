'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EnvelopeImpression } from '@/components/print/EnvelopeImpression';
import { Analysis } from '@/lib/types';

export default function EnvelopePrintPage() {
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reportSettings, setReportSettings] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const autoPrint = searchParams.get('autoprint') === '1';
  const closeAfterPrint = searchParams.get('closeAfterPrint') === '1';
  const analysisId = searchParams.get('analysisId');

  useEffect(() => {
    const loadEnvelopeData = async () => {
      try {
        const requests: Promise<Response>[] = [fetch('/api/settings')];

        if (analysisId) {
          requests.unshift(fetch(`/api/analyses/${analysisId}`));
        }

        const responses = await Promise.all(requests);
        const [analysisResponse, settingsResponse] = analysisId ? responses : [null, responses[0]];

        if (analysisResponse?.ok) {
          const analysisData = await analysisResponse.json();
          setAnalysis(analysisData);
        }

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setReportSettings(settingsData);
        }
      } catch (error) {
        console.error('Error loading envelope print data:', error);
      } finally {
        window.setTimeout(() => setReady(true), 250);
      }
    };

    loadEnvelopeData();
  }, [analysisId]);

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

  return (
    <div className="font-sans">
      <style>{`
        *, body, html {
          font-family: "Segoe UI", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif !important;
        }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0 !important; padding: 0 !important; background: white !important; }
      `}</style>

      <EnvelopeImpression analysis={analysis ?? undefined} settings={reportSettings} />

      {ready && <div id="render-complete" style={{ display: 'none' }} />}
    </div>
  );
}
