'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface ComparisonBarChartProps {
  data: { label: string; current: number; previous: number }[];
  currentLabel?: string;
  previousLabel?: string;
  formatValue?: (v: number) => string;
}

export function ComparisonBarChart({
  data,
  currentLabel = 'Période actuelle',
  previousLabel = 'Période précédente',
  formatValue,
}: ComparisonBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          dy={6}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <Tooltip
          contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number, name: string) => [formatValue ? formatValue(value) : value, name]) as any}
          cursor={{ fill: 'rgba(99,102,241,0.04)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
        <Bar dataKey="previous" name={previousLabel} fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={14} />
        <Bar dataKey="current"  name={currentLabel}  fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
