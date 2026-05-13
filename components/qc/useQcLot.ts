import { useState, useEffect, useCallback, useMemo } from 'react';

export interface QcTarget {
  id: string;
  testId: string | null;
  testCode: string;
  testName: string;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  mean: number;
  sd: number | null;
  minAcceptable: number | null;
  maxAcceptable: number | null;
  unit: string | null;
}

export interface QcValue {
  id: string;
  testCode: string;
  testName: string;
  measured: number;
  mean: number;
  sd: number | null;
  flag: string;
  zScore: number | null;
  unit: string | null;
  controlMode?: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  minAcceptable?: number | null;
  maxAcceptable?: number | null;
  inAcceptanceRange?: boolean | null;
  rule?: string | null;
}

export interface QcResult {
  id: string;
  performedAt: string;
  performedByName: string | null;
  status: string;
  values: QcValue[];
}

export interface QcLotPoint extends QcValue {
  performedAt: string;
  performedByName: string | null;
  status: string;
  resultId: string;
}

export interface LotDetails {
  id: string;
  lotNumber: string;
  materialId: string;
  material: {
    id: string;
    name: string;
    level: string;
    manufacturer: string | null;
  };
  isActive: boolean;
  expiryDate: string;
  targets: QcTarget[];
  results: QcResult[];
}

export interface DailyAverage {
  date: string;
  mean: number;
  points: QcLotPoint[];
}

export function useQcLot(lotId: string) {
  const [lot, setLot] = useState<LotDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTestCode, setSelectedTestCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    lab_name: 'NexLab CSSB',
  });

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadLot = useCallback(async () => {
    if (!lotId) return;
    try {
      const response = await fetch(`/api/qc/lots/${lotId}`);
      if (!response.ok) throw new Error('Erreur de chargement');
      const data = await response.json();
      setLot(data);
      
      // Auto-select first test code if none selected
      if (!selectedTestCode && data.targets && data.targets.length > 0) {
        setSelectedTestCode(data.targets[0].testCode);
      }
    } catch {
      showNotification('error', 'Impossible de charger les données du lot');
    } finally {
      setLoading(false);
    }
  }, [lotId, selectedTestCode, showNotification]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.lab_name) {
          setSettings({ lab_name: data.lab_name });
        }
      }
    } catch (e) {
      console.error('Settings load error:', e);
    }
  }, []);

  useEffect(() => {
    loadLot();
    loadSettings();
  }, [loadLot, loadSettings]);

  // Derived state for the specific selected test
  const activeData = useMemo(() => {
    if (!lot || !selectedTestCode) return null;
    
    const target = lot.targets.find(t => t.testCode === selectedTestCode);
    if (!target) return null;

    // Filter results to only include points for this test
    const points: QcLotPoint[] = lot.results.flatMap(result => 
      result.values
        .filter(v => v.testCode === selectedTestCode)
        .map(v => ({
          ...v,
          performedAt: result.performedAt,
          performedByName: result.performedByName,
          status: result.status,
          resultId: result.id
        }))
    );

    // Group by day for the historical table
    const dailyMap = new Map<string, QcLotPoint[]>();
    points.forEach(p => {
      const day = p.performedAt.split('T')[0];
      if (!dailyMap.has(day)) dailyMap.set(day, []);
      dailyMap.get(day)!.push(p);
    });

    const activeArray = Array.from(dailyMap.entries()).map(([date, pts]) => ({
      date,
      points: pts,
      mean: pts.reduce((sum, p) => sum + p.measured, 0) / pts.length
    })).sort((a, b) => b.date.localeCompare(a.date));

    return {
      target,
      points,
      activeArray
    };
  }, [lot, selectedTestCode]);

  return {
    lot,
    activeData,
    loading,
    selectedTestCode,
    setSelectedTestCode,
    notification,
    settings,
    showNotification
  };
}
