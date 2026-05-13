export type TemperatureReading = {
  id: string;
  value: number;
  period: 'matin' | 'soir';
  recordedAt: string;
  measuredAt: string;
  isOutOfRange: boolean;
  correctiveAction?: string | null;
  recordedBy?: string;
};

export type TemperaturePeriod = 'matin' | 'soir';

export type Instrument = {
  id: string;
  name: string;
  type: string;
  unit: string;
  targetMin: number;
  targetMax: number;
  location?: string | null;
  isActive?: boolean;
  todayReadings: TemperatureReading[];
  lastReading: TemperatureReading | null;
  morningDone: boolean;
  eveningDone: boolean;
  todayStatus: 'ok' | 'alert' | 'missing' | 'empty';
};

export type CreateInstrumentPayload = {
  name: string;
  type: string;
  targetMin: string;
  targetMax: string;
  unit: string;
  location: string;
};

export const INSTRUMENT_TYPES = [
  'Refrigerateur',
  'Congelateur',
  'Incubateur',
  'Etuve',
  'Temperature ambiante',
  'Transport',
  'Chambre froide',
  'Autre',
] as const;

export const EMPTY_INSTRUMENT_PAYLOAD: CreateInstrumentPayload = {
  name: '',
  type: 'Refrigerateur',
  targetMin: '',
  targetMax: '',
  unit: '°C',
  location: '',
};

export const PERIOD_LABELS: Record<'matin' | 'soir', string> = {
  matin: 'Matin',
  soir: 'Soir',
};
