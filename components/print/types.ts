import type { Analysis, Result } from '@/lib/types';
import type { LabSettingsMap } from '@/lib/settings-schema';

export type PrintSettings = Partial<LabSettingsMap>;

export interface AnalysisPrintProps {
  analysis: Analysis;
  settings?: PrintSettings;
}

export interface OptionalAnalysisPrintProps {
  analysis?: Analysis;
  settings?: PrintSettings;
}

export interface InvoicePrintItem {
  name: string;
  price: number;
  isGroup: boolean;
}

export interface ReportPrintProps extends AnalysisPrintProps {
  results: Record<string, string>;
  selectedResultIds?: string[];
}

export interface CategoryGroupMeta {
  rank: number;
  name: string;
}

export interface ReferenceDisplay {
  min: number | null;
  max: number | null;
  display: string;
}

export interface HistogramSeries {
  bins: number[];
  markers: number[];
}

export interface ParsedHistogramPayload {
  wbc: HistogramSeries;
  rbc: HistogramSeries;
}

export interface ParsedHistogramState {
  histogramData: ParsedHistogramPayload | null;
  pltData: HistogramSeries | null;
}

export interface CategorizedResultsState {
  categoryGroups: Record<string, Result[]>;
  allOrderedCategories: string[];
}
