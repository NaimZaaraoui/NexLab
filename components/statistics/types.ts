export type StatRange = '7d' | '30d' | 'month' | 'ytd' | 'all' | 'custom';

export type StatTab = 'overview' | 'analyses' | 'patients' | 'financial' | 'inventory';

export interface PeriodConfig {
  range: StatRange;
  from?: string;
  to?: string;
}

// ── Overview ──────────────────────────────────────────────────────────────────
export interface OverviewKpis {
  totalRevenue: number;
  totalAnalyses: number;
  urgentPercentage: number;
  averageTatMinutes: number;
  totalPatients: number;
  revenueVariation: number | null;
  volumeVariation: number | null;
}

export interface TimelineEntry {
  date: string;
  revenue: number;
  volume: number;
}

export interface TopTest {
  id: string;
  name: string;
  category: string;
  count: number;
}

export interface GenderEntry {
  gender: string;
  count: number;
}

export interface OverviewData {
  kpis: OverviewKpis;
  genderDistribution: GenderEntry[];
  timeline: TimelineEntry[];
  topTests: TopTest[];
}

// ── Analyses ──────────────────────────────────────────────────────────────────
export interface AnalysesKpis {
  total: number;
  validated: number;
  pending: number;
  urgent: number;
}

export interface StatusEntry {
  status: string;
  count: number;
}

export interface UrgentWeekEntry {
  week: string;
  urgent: number;
  normal: number;
}

export interface TatCategoryEntry {
  name: string;
  avgMin: number;
  minMin: number;
  maxMin: number;
  count: number;
}

export interface AbnormalRateEntry {
  name: string;
  total: number;
  abnormal: number;
  rate: number;
}

export interface PrescripteurEntry {
  name: string;
  count: number;
}

export interface MonthlyVolumeEntry {
  month: string;
  volume: number;
  urgent: number;
}

export interface AnalysesData {
  kpis: AnalysesKpis;
  statusDistribution: StatusEntry[];
  urgentVsNormal: UrgentWeekEntry[];
  tatByCategory: TatCategoryEntry[];
  abnormalRates: AbnormalRateEntry[];
  topPrescripteurs: PrescripteurEntry[];
  monthlyVolume: MonthlyVolumeEntry[];
}

// ── Patients ──────────────────────────────────────────────────────────────────
export interface PatientsKpis {
  totalPatients: number;
  newPatients: number;
  uniquePatientsInPeriod: number;
  recurringCount: number;
  newVisitors: number;
}

export interface AgePyramidEntry {
  bracket: string;
  M: number;
  F: number;
}

export interface TopPatientEntry {
  id: string;
  name: string;
  gender: string;
  count: number;
}

export interface FrequencyEntry {
  visits: number;
  patients: number;
}

export interface PatientsData {
  kpis: PatientsKpis;
  genderDistribution: GenderEntry[];
  agePyramid: AgePyramidEntry[];
  topPatients: TopPatientEntry[];
  frequencyHistogram: FrequencyEntry[];
}

// ── Financial ─────────────────────────────────────────────────────────────────
export interface FinancialKpis {
  totalRevenue: number;
  totalPaid: number;
  totalInsuranceShare: number;
  totalPatientShare: number;
  recoveryRate: number;
  pendingAmount: number;
  cnamAnalysesCount: number;
  totalAnalyses: number;
}

export interface PaymentStatusEntry {
  status: string;
  count: number;
  amount: number;
}

export interface PaymentMethodEntry {
  method: string;
  count: number;
}

export interface MonthlyRevenueEntry {
  month: string;
  label: string;
  revenue: number;
  paid: number;
  count: number;
}

export interface CnamProviderEntry {
  provider: string;
  count: number;
  totalPrice: number;
  insuranceShare: number;
  patientShare: number;
}

export interface FinancialData {
  kpis: FinancialKpis;
  paymentStatusBreakdown: PaymentStatusEntry[];
  paymentMethodBreakdown: PaymentMethodEntry[];
  monthlyRevenue: MonthlyRevenueEntry[];
  cnamByProvider: CnamProviderEntry[];
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export interface InventoryKpis {
  totalMovements: number;
  totalConsumed: number;
  totalReceived: number;
  totalWasted: number;
  criticalItemsCount: number;
  uniqueItemsConsumed: number;
}

export interface ConsumptionRankingEntry {
  id: string;
  name: string;
  unit: string;
  category: string;
  totalQty: number;
  count: number;
}

export interface MovementTypeEntry {
  type: string;
  quantity: number;
}

export interface MovementTimelineEntry {
  date: string;
  RECEIVE: number;
  CONSUME: number;
  WASTE: number;
  ADJUST: number;
}

export interface CategoryConsumptionEntry {
  category: string;
  quantity: number;
}

export interface CriticalItemEntry {
  id: string;
  name: string;
  unit: string;
  category: string;
  currentStock: number;
  minThreshold: number;
}

export interface InventoryData {
  kpis: InventoryKpis;
  consumptionRanking: ConsumptionRankingEntry[];
  movementTypeBreakdown: MovementTypeEntry[];
  movementTimeline: MovementTimelineEntry[];
  consumptionByCategory: CategoryConsumptionEntry[];
  criticalItems: CriticalItemEntry[];
}
