'use client';

import React from 'react';

const CODE39_PATTERNS: Record<string, string> = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  $: 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn',
};

function sanitizeCode39Value(value: string) {
  return value
    .toUpperCase()
    .replace(/[^0-9A-Z. \-$/+%]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildBars(value: string) {
  const encoded = `*${sanitizeCode39Value(value) || 'NA'}*`;
  const bars: Array<{ isBar: boolean; width: number }> = [];

  for (let charIndex = 0; charIndex < encoded.length; charIndex += 1) {
    const pattern = CODE39_PATTERNS[encoded[charIndex]];
    if (!pattern) continue;

    for (let i = 0; i < pattern.length; i += 1) {
      bars.push({
        isBar: i % 2 === 0,
        width: pattern[i] === 'w' ? 3 : 1,
      });
    }

    if (charIndex < encoded.length - 1) {
      bars.push({ isBar: false, width: 1 });
    }
  }

  return bars;
}

type Code39BarcodeProps = {
  value: string;
  height?: number;
  className?: string;
  labelClassName?: string;
  barColor?: string;
  showLabel?: boolean;
};

export function Code39Barcode({
  value,
  height = 54,
  className,
  labelClassName,
  barColor = '#0f172a',
  showLabel = true,
}: Code39BarcodeProps) {
  const safeValue = sanitizeCode39Value(value) || 'NA';
  const bars = buildBars(safeValue);
  const width = bars.reduce((sum, item) => sum + item.width, 0);
  const positionedBars = bars.reduce<Array<{ isBar: boolean; width: number; x: number }>>((acc, bar) => {
    const previous = acc[acc.length - 1];
    const x = previous ? previous.x + previous.width : 0;
    acc.push({ ...bar, x });
    return acc;
  }, []);

  return (
    <div className={className}>
      <svg
        role="img"
        aria-label={`Barcode ${safeValue}`}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
        {positionedBars.map((bar, index) => {
          if (!bar.isBar) {
            return null;
          }

          return <rect key={`${index}-${bar.x}`} x={bar.x} y="0" width={bar.width} height={height} fill={barColor} />;
        })}
      </svg>
      {showLabel && (
        <div className={labelClassName || 'mt-1 text-center font-mono text-[10px] font-bold tracking-[0.28em] text-slate-700'}>
          {safeValue}
        </div>
      )}
    </div>
  );
}
