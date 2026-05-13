'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface NexLabMarkProps {
  className?: string;
  variant?: 'brand' | 'light' | 'dark' | 'mono';
}

export function NexLabMark({ className = 'h-8 w-10', variant = 'brand' }: NexLabMarkProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const lightAsset = { src: '/branding/icon-light.png', width: 209, height: 228 };
  const darkAsset = { src: '/branding/icon-dark.png', width: 138, height: 186 };
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
  const imageClassName = `${className} w-auto shrink-0${variant === 'mono' ? ' brightness-0 saturate-0' : ''}`;

  return (
    <img
      key={asset.src}
      src={asset.src}
      alt=""
      width={asset.width}
      height={asset.height}
      className={imageClassName}
      loading="eager"
      decoding="async"
      aria-hidden="true"
    />
  );
}
