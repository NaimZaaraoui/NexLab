
import React from 'react';

interface HistogramProps {
  data: {
    bins: number[];
    markers: number[];
  };
  title: string;
  color?: string;
  width?: number;
  height?: number;
  xAxisMax?: number; // Maximum value on X axis (e.g. 400 fL for WBC)
  variant?: 'default' | 'report';
}

export function HistogramView({
  data,
  title,
  color = '#3b82f6',
  width = 300,
  height = 150,
  xAxisMax = 250,
  variant = 'default',
}: HistogramProps) {
  const { bins, markers } = data;

  const maxVal = Math.max(...bins, 1);
  const padding = 25;
  const bottomPadding = 45; // More space for labels
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding - bottomPadding;

  // Generate SVG path for the curve
  const pathData = React.useMemo(() => {
    if (!bins || bins.length === 0) {
      return '';
    }
    const pts = bins.map((val, i) => {
      const x = padding + (i / bins.length) * chartWidth;
      const y = height - bottomPadding - (val / maxVal) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${pts[0]} ${pts.slice(1).map(p => `L ${p}`).join(' ')} L ${padding + chartWidth},${height - bottomPadding} L ${padding},${height - bottomPadding} Z`;
  }, [bins, maxVal, chartWidth, chartHeight, padding, height, bottomPadding]);

  if (!bins || bins.length === 0) return null;

  const isReport = variant === 'report';
  const containerClassName = isReport
    ? 'bg-transparent px-0 py-1 overflow-hidden'
    : 'bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] overflow-hidden';
  const titleClassName = isReport
    ? 'text-[11px] font-black text-[var(--color-text)] uppercase tracking-[0.2em] print:text-black'
    : 'text-[10px] font-black text-slate-400 uppercase tracking-widest';
  const axisStroke = isReport ? '#cbd5e1' : '#f1f5f9';
  const markerStroke = isReport ? '#64748b' : '#94a3b8';
  const markerValueClassName = isReport ? 'fill-slate-900 font-bold' : 'fill-indigo-600 font-medium';
  const markerLabelClassName = isReport
    ? 'fill-slate-500 font-medium uppercase tracking-tighter'
    : 'fill-slate-400 font-medium uppercase tracking-tighter';

  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={titleClassName}>{title}</h3>
      </div>
      
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grids / Axes */}
        <line x1={padding} y1={height - bottomPadding} x2={padding + chartWidth} y2={height - bottomPadding} stroke={axisStroke} strokeWidth="1" />
        
        {/* The Curve */}
        <path
          d={pathData}
          stroke={color}
          fill="transparent"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Start Label (0) */}
        <text x={padding} y={height - bottomPadding + 14} textAnchor="middle" fontSize="9" className="fill-slate-400 font-bold">
          0
        </text>

        {/* End Label (Max) */}
        <text x={padding + chartWidth} y={height - bottomPadding + 14} textAnchor="middle" fontSize="9" className="fill-slate-400 font-bold">
          {xAxisMax}
        </text>

        {/* Markers (Vertical Lines & Values) */}
        {markers.map((m, i) => {
          if (m < 0) return null;
          const x = padding + (m / bins.length) * chartWidth;
          const fLValue = Math.round((m / bins.length) * xAxisMax);
          
          return (
            <React.Fragment key={i}>
              <line
                x1={x}
                y1={padding}
                x2={x}
                y2={height - bottomPadding}
                stroke={markerStroke}
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <text x={x} y={height - bottomPadding + 14} textAnchor="middle" fontSize="10" className={markerValueClassName}>
                {fLValue}
              </text>
              <text x={x} y={height - bottomPadding + 28} textAnchor="middle" fontSize="8" className={markerLabelClassName}>
                M{i + 1}
              </text>
            </React.Fragment>
          );
        })}

        {/* Baseline Gradient/Shadow */}
        <defs>
          <linearGradient id={`grad-${title.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
