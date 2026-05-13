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
      iframe.style.position = 'absolute';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    // Set src and wait for it to load
    // The target page should have window.print() in its useEffect
    iframe.src = url;
  }, []);

  return { printUrl };
}
