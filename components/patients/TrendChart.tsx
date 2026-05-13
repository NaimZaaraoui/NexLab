'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  date: string;
  value: number;
  label: string;
}

interface TrendChartProps {
  testName: string;
  data: DataPoint[];
  unit?: string;
}

export function TrendChart({ testName, data, unit }: TrendChartProps) {
  if (data.length === 0) return null;

  // Sorting data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const values = sortedData.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = range * 0.2;
  
  const chartMin = min - padding;
  const chartMax = max + padding;
  const chartRange = chartMax - chartMin;

  const width = 300;
  const height = 120;
  const margin = 20;

  const getX = (index: number) => margin + (index * (width - 2 * margin)) / (sortedData.length - 1 || 1);
  const getY = (value: number) => height - margin - ((value - chartMin) * (height - 2 * margin)) / chartRange;

  const points = sortedData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  const lastValue = sortedData[sortedData.length - 1].value;
  const prevValue = sortedData.length > 1 ? sortedData[sortedData.length - 2].value : null;
  const diff = prevValue !== null ? lastValue - prevValue : 0;

  return (
    <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{testName}</h4>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-[var(--color-text)]">{lastValue}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{unit}</span>
          </div>
        </div>
        
        {prevValue !== null && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
            diff > 0 ? 'bg-indigo-50 text-[var(--color-accent)]' : diff < 0 ? 'bg-rose-50 text-rose-600' : 'bg-[var(--color-surface-muted)] text-slate-400'
          }`}>
            {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(diff).toFixed(2)}
          </div>
        )}
      </div>

      <div className="relative h-[120px] w-full">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Grid lines (horizontal) */}
          <line x1={margin} y1={getY(min)} x2={width - margin} y2={getY(min)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
          <line x1={margin} y1={getY(max)} x2={width - margin} y2={getY(max)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

          {/* Line Path */}
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="drop-shadow-[0_2px_4px_rgba(37,99,235,0.2)]"
          />

          {/* Dots */}
          {sortedData.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.value)}
              r="4"
              fill="white"
              stroke="#2563eb"
              strokeWidth="2"
              className="group-hover:r-5 transition-all"
            />
          ))}
        </svg>
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
          {new Date(sortedData[0].date).toLocaleDateString()}
        </span>
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
          {new Date(sortedData[sortedData.length - 1].date).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
