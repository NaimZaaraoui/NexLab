'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { type AgePyramidEntry } from '../types';

interface AgePyramidChartProps {
  data: AgePyramidEntry[];
}

export function AgePyramidChart({ data }: AgePyramidChartProps) {
  const normalized = data.map(d => ({ ...d, MNeg: -d.M }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={normalized}
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        barSize={18}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          tickFormatter={v => String(Math.abs(v))}
        />
        <YAxis
          dataKey="bracket"
          type="category"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#64748B' }}
          width={80}
        />
        <Tooltip
          contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number, name: string) => [Math.abs(value), name === 'MNeg' ? 'Hommes' : 'Femmes']) as any}
          cursor={{ fill: 'rgba(99,102,241,0.06)' }}
        />
        <Bar dataKey="MNeg" name="Hommes" fill="#6366F1" radius={[4, 0, 0, 4]} />
        <Bar dataKey="F"    name="Femmes" fill="#EC4899" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
