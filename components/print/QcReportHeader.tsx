import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrintDocHeader } from '@/components/print/PrintDocHeader';
import type { PrintSettings } from '@/components/print/types';

interface QcReportHeaderProps {
  lotNumber: string;
  materialName: string;
  materialLevel: string;
  testCode: string;
  testName: string;
  targetMean: number;
  targetSd: number | null;
  targetUnit: string | null;
  month: Date;
  settings?: PrintSettings;
}

export const QcReportHeader: React.FC<QcReportHeaderProps> = ({
  lotNumber,
  materialName,
  materialLevel,
  testCode,
  testName,
  targetMean,
  targetSd,
  targetUnit,
  month,
  settings,
}) => {
  const targetMonth = format(month, 'MMMM yyyy', { locale: fr });

  return (
    <thead className="display-table-header-group">
      <tr>
        <td>
          <PrintDocHeader
            settings={settings}
            docTitle="RAPPORT QC"
            docRef={`Période: ${targetMonth}`}
            docAccent={`${testCode} · ${testName}`}
            infoLabel="Lot QC"
            infoTitle={materialName}
            infoChips={
              <>
                <span>Lot {lotNumber}</span>
                <span className="text-slate-300 print:text-black/30">·</span>
                <span>Niveau {materialLevel}</span>
              </>
            }
            metaCells={[
              { label: 'Test surveillé', value: `${testName} (${testCode})` },
              { label: 'Cible', value: `${targetMean.toFixed(2)} ${targetUnit || ''}` },
              { label: 'Écart-type (SD)', value: targetSd ? targetSd.toFixed(3) : 'N/A' },
              { label: 'Période', value: targetMonth },
            ]}
          />
        </td>
      </tr>
    </thead>
  );
};

