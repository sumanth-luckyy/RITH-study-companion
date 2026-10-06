import { useState, useEffect } from 'react';

export type PlatformType = 'mobile-app' | 'mobile-web' | 'tablet' | 'desktop';

export interface PlatformInfo {
  viewportWidth: number;
  viewportHeight: number;
  isMobile: boolean;
  isSmallMobile: boolean; // <= 375px
  isTablet: boolean; // 768px - 1023px
  isDesktop: boolean; // >= 1024px
  isWideDesktop: boolean; // >= 1440px
  isTouch: boolean;
  isStandaloneApp: boolean;
  platform: PlatformType;
}

export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        viewportWidth: 1200,
        viewportHeight: 800,
        isMobile: false,
        isSmallMobile: false,
        isTablet: false,
        isDesktop: true,
        isWideDesktop: false,
        isTouch: false,
        isStandaloneApp: false,
        platform: 'desktop',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);

    const isMobile = width < 768;
    const isSmallMobile = width <= 375;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const isWideDesktop = width >= 1440;

    let platform: PlatformType = 'desktop';
    if (isMobile) {
      platform = isStandalone ? 'mobile-app' : 'mobile-web';
    } else if (isTablet) {
      platform = 'tablet';
    }

    return {
      viewportWidth: width,
      viewportHeight: height,
      isMobile,
      isSmallMobile,
      isTablet,
      isDesktop,
      isWideDesktop,
      isTouch,
      isStandaloneApp: isStandalone,
      platform,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);

      const isMobile = width < 768;
      const isSmallMobile = width <= 375;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const isWideDesktop = width >= 1440;

      let platform: PlatformType = 'desktop';
      if (isMobile) {
        platform = isStandalone ? 'mobile-app' : 'mobile-web';
      } else if (isTablet) {
        platform = 'tablet';
      }

      setPlatformInfo({
        viewportWidth: width,
        viewportHeight: height,
        isMobile,
        isSmallMobile,
        isTablet,
        isDesktop,
        isWideDesktop,
        isTouch,
        isStandaloneApp: isStandalone,
        platform,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return platformInfo;
}
