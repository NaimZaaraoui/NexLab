'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface NexLabLockupProps {
  className?: string;
  variant?: 'default' | 'light' | 'dark' | 'mono';
  size?: 'sm' | 'md' | 'lg';
  suffix?: string;
  subtitle?: string;
}

const sizeClasses = {
  sm: {
    gap: 'gap-1.5',
    logo: 'h-7',
    suffix: 'text-[11px]',
    subtitle: 'text-[9px]',
  },
  md: {
    gap: 'gap-2',
    logo: 'h-9',
    suffix: 'text-xs',
    subtitle: 'text-[10px]',
  },
  lg: {
    gap: 'gap-2.5',
    logo: 'h-11',
    suffix: 'text-sm',
    subtitle: 'text-xs',
  },
} as const;

export function NexLabLockup({
  className = '',
  variant = 'default',
  size = 'md',
  suffix,
  subtitle,
}: NexLabLockupProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const classes = sizeClasses[size];
  const lightAsset = { src: '/branding/logo-light.png', width: 660, height: 241 };
  const darkAsset = { src: '/branding/logo-dark.png', width: 646, height: 223 };
  const monoAsset = lightAsset;

  useEffect(() => {
    setMounted(true);
  }, []);

  const asset =
    variant === 'light'
      ? darkAsset
      : variant === 'dark'
        ? lightAsset
      : variant === 'mono'
        ? monoAsset
        : mounted && resolvedTheme === 'dark'
          ? darkAsset
          : lightAsset;
  const imageClassName = `${classes.logo} w-auto shrink-0${variant === 'mono' ? ' brightness-0 saturate-0' : ''}`;
  const suffixTone =
    variant === 'light'
      ? 'text-white/80'
      : variant === 'mono'
        ? 'text-current opacity-70'
        : 'text-[#4F3C55]/70';
  const subtitleTone =
    variant === 'light'
      ? 'text-white/70'
      : variant === 'mono'
        ? 'text-current opacity-70'
        : 'text-[#4F3C55]/70';

  return (
    <div className={`${className}`}>
      <div className="min-w-0">
        <div className={`flex items-end ${classes.gap}`}>
          <img
            key={asset.src}
            src={asset.src}
            alt="NexLab"
            width={asset.width}
            height={asset.height}
            className={imageClassName}
            loading={size === 'sm' ? 'lazy' : 'eager'}
            decoding="async"
          />
          {suffix ? <span className={`font-semibold uppercase tracking-[0.16em] ${classes.suffix} ${suffixTone}`}>{suffix}</span> : null}
        </div>
        {subtitle ? <p className={`font-medium uppercase tracking-[0.16em] ${classes.subtitle} ${subtitleTone}`}>{subtitle}</p> : null}
      </div>
    </div>
  );
}
