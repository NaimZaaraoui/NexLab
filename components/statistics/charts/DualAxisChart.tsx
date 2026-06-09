'use client';

import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface DualAxisChartProps {
  data: { date: string; revenue: number; volume: number }[];
  revenueLabel?: string;
  volumeLabel?: string;
  formatRevenue?: (v: number) => string;
}

export function DualAxisChart({
  data,
  revenueLabel = "Chiffre d'affaires",
  volumeLabel = 'Volume',
  formatRevenue = v => v.toLocaleString('fr-FR'),
}: DualAxisChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          dy={8}
          tickFormatter={val => {
            const d = new Date(val);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
        />
        <YAxis
          yAxisId="revenue"
          orientation="left"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
        />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number, name: string) =>
            name === revenueLabel ? [formatRevenue(value), name] : [value, name]
          ) as any}
          labelFormatter={label => {
            const d = new Date(label);
            return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Bar yAxisId="volume" dataKey="volume" name={volumeLabel} fill="#E0E7FF" radius={[4, 4, 0, 0]} barSize={12} />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name={revenueLabel}
          stroke="#4F46E5"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
