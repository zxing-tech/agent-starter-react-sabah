'use client';

import { useState, useEffect } from 'react';

export function useOffline(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return isOffline;
}
