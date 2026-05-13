'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

type PageBackLinkProps = {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
  iconSize?: number;
  children?: ReactNode;
};

export function PageBackLink({
  href,
  onClick,
  label = 'Retour',
  className = '',
  iconSize = 16,
  children,
}: PageBackLinkProps) {
  const content = (
    <>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--color-surface-muted)]">
        <ArrowLeft size={iconSize} />
      </span>
      <span>{label}</span>
      {children}
    </>
  );

  const classes = `mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)] ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
