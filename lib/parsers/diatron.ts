/**
 * Parser for Diatron Abacus 380 export files (TAB separated TXT)
 */

export interface DiatronResult {
  sampleId: string;
  date: string;
  time: string;
  patientId?: string;
  results: Record<string, string>;
  histograms?: {
    wbc: {
      bins: number[];
      markers: number[];
      flags?: string;
    };
    rbc: {
      bins: number[];
      markers: number[];
      flags?: string;
    };
    plt: {
      flags?: string;
    };
    warning?: string; // General instrument warning
  };
}

import { MACHINE_ALIASES } from '@/lib/lab-rules';

type RawDiatronRecord = Record<string, string>;

export function parseDiatronFile(content: string): DiatronResult[] {
  // Split by line and filter empty lines (including those with just whitespace)
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  // Parse headers and find the last non-empty header to handle trailing tabs
  const allHeaders = lines[0].split('\t').map(h => h.trim());
  
  // Find fixed positions for histograms if present
  const wbcHistIdx = allHeaders.indexOf('WBC Histogram');
  const wbcM1Idx = allHeaders.indexOf('WBC Marker 1');
  const wbcM2Idx = allHeaders.indexOf('WBC Marker 2');
  const wbcM3Idx = allHeaders.indexOf('WBC Marker 3');
  const rbcHistIdx = allHeaders.indexOf('RBC Histogram');
  const rbcM1Idx = allHeaders.indexOf('RBC Marker 1');

  let lastNonEmptyIndex = allHeaders.length - 1;
  while (lastNonEmptyIndex >= 0 && !allHeaders[lastNonEmptyIndex]) {
    lastNonEmptyIndex--;
  }
  
  const headers = allHeaders.slice(0, lastNonEmptyIndex + 1);
  const dataLines = lines.slice(1);

  const results: DiatronResult[] = [];

  for (const line of dataLines) {
    const values = line.split('\t').map(v => v.trim());
    
    // Check if we have at least the identifying columns (ID, Date, Heure are usually first 3)
    if (values.length < 3) continue;

    const record: RawDiatronRecord = {};
    headers.forEach((header, index) => {
      if (header && index < values.length) {
        record[header] = values[index];
      }
    });

    const mappedResults: Record<string, string> = {};
    
    // Helper to add result if valid
    const addResult = (keys: string[], val: string) => {
        const cleanVal = val.trim().replace(',', '.');
        keys.forEach(k => mappedResults[k] = cleanVal);
    };

    Object.entries(MACHINE_ALIASES).forEach(([diatronKey, appKeys]) => {
      const val = record[diatronKey];
      if (val) {
        addResult(appKeys, val);
      }
    });

    // Extract Histograms and Flags
    let histograms: DiatronResult['histograms'];
    if (wbcHistIdx !== -1 && rbcHistIdx !== -1) {
      histograms = {
        wbc: {
          bins: values.slice(wbcHistIdx, wbcM1Idx || wbcHistIdx + 256).map(Number),
          markers: [
            wbcM1Idx !== -1 ? Number(values[wbcM1Idx]) : 0,
            wbcM2Idx !== -1 ? Number(values[wbcM2Idx]) : 0,
            wbcM3Idx !== -1 ? Number(values[wbcM3Idx]) : 0,
          ],
          flags: record['GB flags'] || ''
        },
        rbc: {
          bins: values.slice(rbcHistIdx, rbcM1Idx || rbcHistIdx + 256).map(Number),
          markers: [
            rbcM1Idx !== -1 ? Number(values[rbcM1Idx]) : 0
          ],
          flags: record['GR flags'] || ''
        },
        plt: {
          flags: record['PLT flags'] || ''
        },
        warning: record['Avertissement'] || ''
      };
    }

    results.push({
      sampleId: record['ID Échantillon'] || '',
      date: record['Date'] || '',
      time: record['Heure'] || '',
      patientId: record['ID du patient'] || '',
      results: mappedResults,
      histograms
    });
  }

  return results;
}
