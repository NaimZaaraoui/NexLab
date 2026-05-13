'use client';

import React from 'react';

export function PrintPageButton({ label = 'Imprimer', className = '' }: { label?: string; className?: string }) {
  return (
    <button 
      onClick={() => window.print()}
      className={className || "px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg hover:bg-indigo-700 transition-colors"}
    >
      {label}
    </button>
  );
}
