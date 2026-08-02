'use client';

import { useCallback } from 'react';

export function useDirectPrint() {
  const printUrl = useCallback((url: string) => {
    // Check if iframe already exists
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      // Some browsers block window.print() on display:none iframes
      iframe.style.position = 'fixed';
      iframe.style.left = '-10000px';
      iframe.style.top = '-10000px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      document.body.appendChild(iframe);
    }

    // Set src and wait for it to load
    // The target page should have window.print() in its useEffect
    iframe.src = url;
  }, []);

  return { printUrl };
}
