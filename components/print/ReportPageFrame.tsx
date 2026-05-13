import React from 'react';

interface ReportPageFrameProps {
  isValidated: boolean;
  breakBefore?: boolean;
  children: React.ReactNode;
}

export function ReportPageFrame({
  isValidated,
  breakBefore = false,
  children,
}: ReportPageFrameProps) {
  return (
    <div className={`${breakBefore ? 'print:break-before-page' : ''} relative`}>
      {!isValidated && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] text-[var(--color-text-soft)]/[0.07] text-[120px] font-black pointer-events-none select-none z-0 tracking-tighter whitespace-nowrap px-12 py-4 rounded-[60px] print:text-black/[0.05] print:border-black/[0.05]">
          BROUILLON
        </div>
      )}
      {children}
    </div>
  );
}
