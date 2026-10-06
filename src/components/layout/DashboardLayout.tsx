import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="space-y-2 w-full">
            <LoadingSkeleton className="h-4 w-3/4 mx-auto" />
            <LoadingSkeleton className="h-3 w-1/2 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main app viewport */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <Navbar
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content Area: pb-20 on mobile to clear bottom navigation bar */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile-first bottom navigation bar */}
      <MobileBottomNav />
    </div>
  );
}
