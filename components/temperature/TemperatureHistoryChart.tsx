import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Scatter
} from 'recharts';
import { format } from 'date-fns';
import type { TemperatureReading } from '@/components/temperature/types';

interface TemperatureHistoryChartProps {
  readings: TemperatureReading[];
  min: number;
  max: number;
  unit: string;
  printWidth?: number;
}

type TemperatureChartPoint = TemperatureReading & {
  displayValue: number;
  isClamped: boolean;
  timestamp: number;
  displayDate: string;
};

type ChartTooltipProps<T> = {
  active?: boolean;
  payload?: Array<{ payload: T }>;
};

type ScatterShapeProps<T> = {
  cx?: number;
  cy?: number;
  payload?: T;
};

export function TemperatureHistoryChart({ readings, min, max, unit, printWidth }: TemperatureHistoryChartProps) {
  if (readings.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-16 text-center text-sm text-slate-400">
        Aucun point de mesure à afficher.
      </div>
    );
  }

  const sorted = [...readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const data = sorted.slice(-30).map(r => {
    const raw = r.value;
    const isClamped = raw > max || raw < min;
    const displayValue = raw > max ? max : raw < min ? min : raw;
    return {
      ...r,
      displayValue,
      isClamped,
      timestamp: new Date(r.recordedAt).getTime(),
      displayDate: format(new Date(r.recordedAt), 'dd/MM'),
    };
  });

  const domainMin = min - 0.5;
  const domainMax = max + 0.5;

  const CustomTooltip = ({ active, payload }: ChartTooltipProps<TemperatureChartPoint>) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="min-w-[180px] rounded-2xl border border-slate-700 bg-slate-900 p-3 text-xs text-white shadow-xl opacity-95">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
            <span className="font-bold">{format(new Date(item.recordedAt), 'dd/MM/yyyy HH:mm')}</span>
            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
              item.isOutOfRange ? 'bg-rose-500' : 'bg-slate-700'
            }`}>
              {item.isOutOfRange ? 'Hors Plage' : 'Conforme'}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Température:</span>
              <span className="font-black text-white">{item.value.toFixed(1)}{unit}</span>
            </div>
            {item.isClamped && (
              <div className="text-rose-400 text-[9px] font-black uppercase tracking-wider">
                ⚠ Dépasse les limites — affiché tronqué
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Période:</span>
              <span className="font-medium text-slate-300">{item.period}</span>
            </div>
            {item.recordedBy && (
              <div className="flex justify-between">
                <span className="text-slate-400">Opérateur:</span>
                <span className="font-medium text-slate-300">{item.recordedBy}</span>
              </div>
            )}
            {item.correctiveAction && (
              <div className="mt-1 pt-1 border-t border-slate-800">
                <p className="text-[8px] font-black uppercase text-amber-500 mb-0.5">Action corrective:</p>
                <p className="italic text-slate-400 leading-tight">{item.correctiveAction}</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-soft)]">
              Plage de Conformité: {min.toFixed(1)} à {max.toFixed(1)}{unit}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
               {data.length} dernières mesures
            </span>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)]/50 print:border-black/10 print:rounded-none print:border-none print:ring-0 print:shadow-none bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5">
        <div className="h-[320px] w-full">
          {printWidth ? (
            <ComposedChart width={printWidth} height={320} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
              <YAxis domain={[min, max]} axisLine={false} tickLine={false} tick={false} />
              <ReferenceArea y1={min} y2={max} fill="rgba(148, 163, 184, 0.05)" />
              <ReferenceLine y={max} stroke="#94a3b8" strokeDasharray="4 4" label={{ position: 'left', value: `${max}${unit}`, fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} />
              <ReferenceLine y={min} stroke="#94a3b8" strokeDasharray="4 4" label={{ position: 'left', value: `${min}${unit}`, fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} />
              <Line type="monotone" dataKey="displayValue" stroke="var(--color-text)" strokeWidth={2.5} dot={false} activeDot={false} isAnimationActive={false} />
              <Scatter dataKey="displayValue" isAnimationActive={false} shape={(props: ScatterShapeProps<TemperatureChartPoint>) => {
                const { cx = 0, cy = 0, payload } = props;
                if (!payload) return null;
                const isOut = payload.isOutOfRange;
                if (payload.isClamped) {
                  const goingUp = payload.value > max;
                  const size = 7;
                  const pts = goingUp ? `${cx},${cy - size} ${cx - size},${cy + size * 0.7} ${cx + size},${cy + size * 0.7}` : `${cx},${cy + size} ${cx - size},${cy - size * 0.7} ${cx + size},${cy - size * 0.7}`;
                  return <polygon points={pts} fill="#f43f5e" stroke="var(--color-surface)" strokeWidth={1.5} />;
                }
                return <circle cx={cx} cy={cy} r={4.5} fill={isOut ? '#f43f5e' : 'var(--color-text)'} stroke="var(--color-surface)" strokeWidth={1.5} />;
              }} />
            </ComposedChart>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                <YAxis domain={[min, max]} axisLine={false} tickLine={false} tick={false} />
                <ReferenceArea y1={min} y2={max} fill="rgba(148, 163, 184, 0.05)" />
                <ReferenceLine y={max} stroke="#94a3b8" strokeDasharray="4 4" label={{ position: 'left', value: `${max}${unit}`, fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} />
                <ReferenceLine y={min} stroke="#94a3b8" strokeDasharray="4 4" label={{ position: 'left', value: `${min}${unit}`, fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="displayValue" stroke="var(--color-text)" strokeWidth={2.5} dot={false} activeDot={false} isAnimationActive={false} />
                <Scatter dataKey="displayValue" isAnimationActive={false} shape={(props: ScatterShapeProps<TemperatureChartPoint>) => {
                  const { cx = 0, cy = 0, payload } = props;
                  if (!payload) return null;
                  const isOut = payload.isOutOfRange;
                  if (payload.isClamped) {
                    const goingUp = payload.value > max;
                    const size = 7;
                    const pts = goingUp ? `${cx},${cy - size} ${cx - size},${cy + size * 0.7} ${cx + size},${cy + size * 0.7}` : `${cx},${cy + size} ${cx - size},${cy - size * 0.7} ${cx + size},${cy - size * 0.7}`;
                    return <polygon points={pts} fill="#f43f5e" stroke="var(--color-surface)" strokeWidth={1.5} />;
                  }
                  return <circle cx={cx} cy={cy} r={4.5} fill={isOut ? '#f43f5e' : 'var(--color-text)'} stroke="var(--color-surface)" strokeWidth={1.5} />;
                }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
