import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 text-amber-950 dark:bg-amber-600 dark:text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-sm sticky top-0 z-50 transition-all duration-300"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>You're offline. Some features may be unavailable.</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (navigator.onLine) setIsOffline(false);
            else window.location.reload();
          }}
          className="flex items-center gap-1 underline hover:no-underline font-semibold text-[11px] ml-4 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Check connection
        </button>
      </div>
    </div>
  );
}
