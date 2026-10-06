import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

export function useCapacitorBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backListener: { remove: () => void } | null = null;

    async function setupBack() {
      try {
        const handler = await CapApp.addListener('backButton', ({ canGoBack }) => {
          const currentPath = window.location.pathname;

          // If on home/dashboard or login root, exit app or minimize
          if (currentPath === '/dashboard' || currentPath === '/login' || currentPath === '/') {
            CapApp.exitApp();
          } else if (canGoBack) {
            window.history.back();
          } else {
            navigate('/dashboard', { replace: true });
          }
        });
        backListener = handler;
      } catch (err) {
        console.warn('Capacitor backButton listener error:', err);
      }
    }

    setupBack();

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, [location.pathname, navigate]);
}
