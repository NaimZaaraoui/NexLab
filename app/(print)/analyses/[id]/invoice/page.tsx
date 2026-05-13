'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FactureImpression } from '@/components/print/FactureImpression';
import { Analysis } from '@/lib/types';

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reportSettings, setReportSettings] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const autoPrint = searchParams.get('autoprint') === '1';
  const closeAfterPrint = searchParams.get('closeAfterPrint') === '1';

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const [analysisResponse, settingsResponse] = await Promise.all([
          fetch(`/api/analyses/${id}`),
          fetch('/api/settings'),
        ]);

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setAnalysis(analysisData);
        }

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setReportSettings(settingsData);
        }
      } catch (error) {
        console.error('Error loading invoice print data:', error);
      } finally {
        window.setTimeout(() => setReady(true), 250);
      }
    };

    if (id) {
      fetchInvoiceData();
    }
  }, [id]);

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

  return (
    <div className="font-sans">
      <style>{`
        *, body, html {
          font-family: "Segoe UI", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif !important;
        }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0 !important; padding: 0 !important; background: white !important; }
      `}</style>

      <FactureImpression analysis={analysis} settings={reportSettings} />
    </div>
  );
}
