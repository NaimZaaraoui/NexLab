'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PALETTE = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];

interface DonutChartProps {
  data: { name: string; value: number }[];
  formatValue?: (v: number) => string;
  innerRadius?: number;
  outerRadius?: number;
}

export function DonutChart({ data, formatValue, innerRadius = 55, outerRadius = 85 }: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: 12 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: number, name: string) => [
              formatValue ? formatValue(value) : value,
              name,
            ]) as any}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-[var(--color-text)]">
            {formatValue ? formatValue(total) : total}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Total</span>
        </div>
      )}
    </div>
  );
}
