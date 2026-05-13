'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { QcMonthlyReport } from '@/components/print/QcMonthlyReport';

type QcLotResponse = {
  id: string;
  lotNumber: string;
  material: {
    name: string;
    level: string;
  };
  targets: Array<{
    id: string;
    testCode: string;
    testName: string;
    controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
    mean: number;
    sd: number | null;
    minAcceptable: number | null;
    maxAcceptable: number | null;
    unit: string | null;
  }>;
  results: Array<{
    id: string;
    performedAt: string;
    performedByName: string | null;
    values: Array<{
      id: string;
      testCode: string;
      measured: number;
      zScore: number | null;
      controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
      minAcceptable: number | null;
      maxAcceptable: number | null;
      inAcceptanceRange: boolean | null;
      flag: string;
      rule: string | null;
    }>;
  }>;
};

export default function QcPrintPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const searchParams = useSearchParams();
  const [lot, setLot] = useState<QcLotResponse | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const selectedTestCode = searchParams.get('testCode');
  const autoPrint = searchParams.get('autoprint') === '1';
  const closeAfterPrint = searchParams.get('closeAfterPrint') === '1';

  useEffect(() => {
    const fetchPayload = async () => {
      try {
        const [lotRes, settingsRes] = await Promise.all([
          fetch(`/api/qc/lots/${lotId}`, { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
        ]);

        if (lotRes.ok) {
          setLot(await lotRes.json());
        }
        if (settingsRes.ok) {
          setSettings(await settingsRes.json());
        }
      } catch (error) {
        console.error('QC print loading error:', error);
      } finally {
        setTimeout(() => setReady(true), 300);
      }
    };

    if (lotId) {
      fetchPayload();
    }
  }, [lotId]);

  useEffect(() => {
    if (!ready || !autoPrint) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 120);

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

  if (!lot) return null;

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

      <QcMonthlyReport lot={lot} settings={settings} selectedTestCode={selectedTestCode} />
      {ready && <div id="render-complete" style={{ display: 'none' }} />}
    </div>
  );
}
