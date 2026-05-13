'use client';

export type InventoryStatus = 'ok' | 'low' | 'critical' | 'expired';

export type InventoryItemSummary = {
  id: string;
  name: string;
  category: string;
  kind: string;
  supplier?: string | null;
  unit: string;
  currentStock: number;
  minThreshold: number;
  status: InventoryStatus;
  nearestExpiry: string | null;
  daysUntilExpiry: number | null;
  consumption30d?: number;
  avgDailyConsumption30d?: number;
};

export type InventoryAnalytics = {
  windowDays: number;
  totals: {
    consumption30d: number;
    waste30d: number;
    avgDailyConsumption30d: number;
  };
  topConsumedItems: Array<{
    itemId: string;
    name: string;
    unit: string;
    category: string;
    consumption30d: number;
    waste30d: number;
    avgDailyConsumption30d: number;
  }>;
  topWastedItems: Array<{
    itemId: string;
    name: string;
    unit: string;
    category: string;
    consumption30d: number;
    waste30d: number;
    avgDailyConsumption30d: number;
  }>;
};

export type TestRule = {
  id: string;
  quantityPerTest: number;
  isActive: boolean;
  test: {
    id: string;
    name: string;
    code: string;
  };
};

export type InventoryLot = {
  id: string;
  lotNumber: string;
  expiryDate: string;
  quantity: number;
  remaining: number;
  isActive: boolean;
};

export type StockMovement = {
  id: string;
  type: string;
  quantity: number;
  lotNumber: string | null;
  reason: string | null;
  performedBy: string;
  performedAt: string;
};

export type InventoryDetailItem = {
  id: string;
  name: string;
  category: string;
  kind: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  reference: string | null;
  storage: string | null;
  supplier: string | null;
  notes: string | null;
  isActive: boolean;
  status: InventoryStatus;
  nearestExpiry: string | null;
  daysUntilExpiry: number | null;
  lots: InventoryLot[];
  movements: StockMovement[];
  rules: TestRule[];
};

export type TestOption = {
  id: string;
  name: string;
  code: string;
};

export type InventoryItemFormValues = {
  name: string;
  reference: string;
  category: string;
  unit: string;
  minThreshold: string;
  currentStock?: string;
  storage: string;
  supplier: string;
  notes: string;
  kind: string;
};

export const UNIT_OPTIONS = ['mL', 'Tests', 'Boîtes', 'Kits', 'Flacons', 'Unités'];
