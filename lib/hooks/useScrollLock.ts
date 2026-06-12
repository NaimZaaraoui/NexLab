import { useEffect } from 'react';

export function useScrollLock(lock: boolean = true) {
  useEffect(() => {
    if (!lock) return;
    
    // Prevent scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Cleanup on unmount or when lock becomes false
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [lock]);
}
