'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

type ChartPoint = {
  id: string;
  performedAt: string;
  performedByName?: string;
  measured: number;
  zScore: number | null;
  flag: string;
  rule?: string | null;
  inAcceptanceRange?: boolean | null;
};

type OrderedChartPoint = ChartPoint & {
  displayMeasured: number;
  isClamped: boolean;
  displayDate: string;
  fullDate: string;
};

type ChartTooltipProps<T> = {
  active?: boolean;
  payload?: Array<{ payload: T }>;
};

type DotRendererProps = {
  cx?: number;
  cy?: number;
  payload?: OrderedChartPoint;
};

export function LeveyJenningsChart({
  title,
  points,
  mean,
  sd,
  unit,
  controlMode,
  minAcceptable,
  maxAcceptable,
  printWidth,
}: {
  title: string;
  points: ChartPoint[];
  mean: number;
  sd: number | null;
  unit?: string | null;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  minAcceptable: number | null;
  maxAcceptable: number | null;
  printWidth?: number;
}) {
  const statistical = controlMode === 'STATISTICAL' && sd && sd > 0;

  const CLAMP_MARGIN = 0.2;

  const clampValue = (v: number): { displayMeasured: number; isClamped: boolean } => {
    if (statistical && sd) {
      const upperLimit = mean + 3 * sd;
      const lowerLimit = mean - 3 * sd;
      if (v > upperLimit) return { displayMeasured: upperLimit + CLAMP_MARGIN * sd, isClamped: true };
      if (v < lowerLimit) return { displayMeasured: lowerLimit - CLAMP_MARGIN * sd, isClamped: true };
    } else {
      const upper = maxAcceptable ?? mean;
      const lower = minAcceptable ?? mean;
      const buffer = Math.max((upper - lower) * 0.15, 1);
      if (v > upper) return { displayMeasured: upper + buffer, isClamped: true };
      if (v < lower) return { displayMeasured: lower - buffer, isClamped: true };
    }
    return { displayMeasured: v, isClamped: false };
  };

  const ordered = [...points].slice(0, 30).reverse().map(p => {
    const { displayMeasured, isClamped } = clampValue(p.measured);
    return {
      ...p,
      displayMeasured,
      isClamped,
      displayDate: format(new Date(p.performedAt), 'dd/MM'),
      fullDate: format(new Date(p.performedAt), 'dd/MM/yyyy HH:mm'),
    };
  });

  const rangeMin = statistical && sd
    ? mean - sd * 3.5
    : Math.min(...ordered.map(p => p.displayMeasured), minAcceptable ?? mean, mean) - 1;
  const rangeMax = statistical && sd
    ? mean + sd * 3.5
    : Math.max(...ordered.map(p => p.displayMeasured), maxAcceptable ?? mean, mean) + 1;

  const CustomTooltip = ({ active, payload }: ChartTooltipProps<OrderedChartPoint>) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="min-w-[200px] rounded-2xl border border-slate-700 bg-slate-900 p-3 text-xs text-white shadow-xl opacity-95">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
             <span className="font-bold">{point.fullDate}</span>
             <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
               point.flag === 'fail' ? 'bg-rose-500' : point.flag === 'warn' ? 'bg-amber-500' : point.flag === 'ok' ? 'bg-emerald-500' : 'bg-slate-700'
             }`}>
               {point.flag === 'fail' ? 'Échec' : point.flag === 'warn' ? 'Alerte' : 'Conforme'}
             </span>
          </div>
          <div className="grid gap-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Valeur réelle:</span>
              <span className="font-black text-white">{point.measured} {unit || ''}</span>
            </div>
            {point.isClamped && (
              <div className="text-rose-400 text-[9px] font-black uppercase tracking-wider">
                ⚠ Dépasse les limites ±3SD — affiché tronqué
              </div>
            )}
            {statistical ? (
              <div className="flex justify-between">
                <span className="text-slate-400">Z-Score:</span>
                <span className="font-black text-white">{point.zScore?.toFixed(2) ?? '—'}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-slate-400">Zone:</span>
                <span className="font-black text-white">{point.inAcceptanceRange ? 'Dans la plage' : 'Hors plage'}</span>
              </div>
            )}
            {point.rule && (
              <div className="flex justify-between mt-1 pt-1 border-t border-slate-700">
                <span className="text-slate-400">Règle violée:</span>
                <span className="font-black text-rose-400">{point.rule}</span>
              </div>
            )}
            {point.performedByName && (
              <div className="flex justify-between mt-1 pt-1 border-t border-slate-700">
                <span className="text-slate-400">Opérateur:</span>
                <span className="font-medium text-slate-300">{point.performedByName}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const sdLines = statistical && sd ? [
    { label: '+3SD', value: mean + 3 * sd, color: '#444', dash: '6 6' },
    { label: '+2SD', value: mean + 2 * sd, color: '#888', dash: '6 6' },
    { label: '+1SD', value: mean + 1 * sd, color: '#ccc', dash: '6 6' },
    { label: 'X̄', value: mean, color: '#000', strokeWidth: 2 },
    { label: '-1SD', value: mean - 1 * sd, color: '#ccc', dash: '6 6' },
    { label: '-2SD', value: mean - 2 * sd, color: '#888', dash: '6 6' },
    { label: '-3SD', value: mean - 3 * sd, color: '#444', dash: '6 6' },
  ] : [
    { label: 'Max', value: maxAcceptable ?? mean, color: '#444', dash: '6 6' },
    { label: 'Cible', value: mean, color: '#000', strokeWidth: 2 },
    { label: 'Min', value: minAcceptable ?? mean, color: '#444', dash: '6 6' },
  ];

  const dotRenderer = ({ cx = 0, cy = 0, payload }: DotRendererProps) => {
    if (!payload) return null;
    const fill =
      payload.flag === 'fail' ? '#ef4444' :
      payload.flag === 'warn' ? '#f59e0b' :
      payload.flag === 'ok' ? '#10b981' :
      '#334155';
    if (payload.isClamped) {
      const goingUp = payload.displayMeasured > mean;
      const size = 7;
      const pts = goingUp
        ? `${cx},${cy - size} ${cx - size},${cy + size * 0.7} ${cx + size},${cy + size * 0.7}`
        : `${cx},${cy + size} ${cx - size},${cy - size * 0.7} ${cx + size},${cy - size * 0.7}`;
      return <polygon key={payload.id} points={pts} fill={fill} stroke="var(--color-surface)" strokeWidth={1.5} />;
    }
    return <circle key={payload.id} cx={cx} cy={cy} r={payload.flag === 'fail' ? 5 : 4} fill={fill} stroke="var(--color-surface)" strokeWidth={1.5} />;
  };

  return (
    <div className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5 print:border-none print:shadow-none print:ring-0">
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--color-text-soft)]">
          {statistical ? 'Levey-Jennings (30 derniers points)' : "Courbe de tendance (30 derniers points)"}
        </p>
      </div>

      <div className="h-[280px] w-full">
        {printWidth ? (
          <LineChart data={ordered} width={printWidth} height={280} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
            <YAxis domain={[rangeMin, rangeMax]} axisLine={false} tickLine={false} tick={false} />
            {sdLines.map((line) => (
              <ReferenceLine key={line.label} y={line.value} stroke={line.color} strokeWidth={line.strokeWidth || 1} strokeDasharray={line.dash} label={{ position: 'left', value: line.label, fontSize: 10, fill: '#64748b', fontWeight: line.label === 'X̄' || line.label === 'Cible' ? 800 : 500 }} />
            ))}
            <Line type="monotone" dataKey="displayMeasured" stroke="var(--color-text)" strokeWidth={2.5} dot={dotRenderer} isAnimationActive={false} />
          </LineChart>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ordered} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
              <YAxis domain={[rangeMin, rangeMax]} axisLine={false} tickLine={false} tick={false} />
              {sdLines.map((line) => (
                <ReferenceLine key={line.label} y={line.value} stroke={line.color} strokeWidth={line.strokeWidth || 1} strokeDasharray={line.dash} label={{ position: 'left', value: line.label, fontSize: 10, fill: '#64748b', fontWeight: line.label === 'X̄' || line.label === 'Cible' ? 800 : 500 }} />
              ))}
              <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
              <Line type="monotone" dataKey="displayMeasured" stroke="var(--color-text)" strokeWidth={2.5} dot={dotRenderer} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
