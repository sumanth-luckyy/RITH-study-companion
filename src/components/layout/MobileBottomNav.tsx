import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  CheckSquare,
  FileText,
  User,
  MoreHorizontal,
  Calendar,
  Bell,
  Archive,
  Users,
  Download,
  AlertTriangle,
  Settings,
  Shield,
  Layers,
  Sun,
  Moon,
  LogOut,
  Activity,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  // 1. ADMIN MOBILE NAVIGATION (Optimized for phones)
  const adminMainTabs = [
    { label: 'Dashboard', path: '/admin', icon: Activity },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Resources', path: '/admin/resources', icon: FileText },
    { label: 'Assignments', path: '/admin/assignments', icon: CheckSquare },
  ];

  const adminMoreItems = [
    { label: 'Users & Admins', path: '/admin/users', icon: Shield, color: 'text-purple-400' },
    { label: 'Hierarchy & Classes', path: '/admin/hierarchy', icon: Layers, color: 'text-primary' },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen, color: 'text-indigo-500' },
    { label: 'Timetable', path: '/admin/timetable', icon: Calendar, color: 'text-emerald-500' },
    { label: 'Announcements', path: '/admin/announcements', icon: Bell, color: 'text-amber-500' },
    { label: 'Reports', path: '/admin/reports', icon: AlertTriangle, color: 'text-rose-500' },
    { label: 'Roll Parser & Settings', path: '/admin/settings', icon: Settings, color: 'text-muted-foreground' },
    { label: 'Switch to Student View', path: '/dashboard', icon: GraduationCap, color: 'text-sky-500' },
  ];

  // 2. STUDENT MOBILE NAVIGATION (No admin items)
  const studentMainTabs = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Subjects', path: '/subjects', icon: BookOpen },
    { label: 'Assignments', path: '/assignments', icon: CheckSquare },
    { label: 'Resources', path: '/resources', icon: FileText },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const studentMoreItems = [
    { label: 'Timetable', path: '/timetable', icon: Calendar, color: 'text-primary' },
    { label: 'Announcements', path: '/announcements', icon: Bell, color: 'text-amber-500' },
    { label: 'Previous Papers', path: '/previous-papers', icon: Archive, color: 'text-emerald-500' },
    { label: 'Classmates', path: '/classmates', icon: Users, color: 'text-sky-500' },
    { label: 'Downloads & Saved', path: '/downloads', icon: Download, color: 'text-indigo-500' },
    { label: 'Settings', path: '/settings', icon: Settings, color: 'text-muted-foreground' },
    { label: 'Report Problem', path: '/report', icon: AlertTriangle, color: 'text-rose-500' },
  ];

  const mainTabs = isAdmin && location.pathname.startsWith('/admin') ? adminMainTabs : studentMainTabs;
  const secondaryItems = isAdmin && location.pathname.startsWith('/admin') ? adminMoreItems : studentMoreItems;

  const handleNav = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  const handleLogout = async () => {
    setMoreOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Bottom bar on mobile (hidden on lg+) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border lg:hidden px-2 py-1.5 safe-area-bottom"
      >
        <div className="flex items-center justify-around">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path || (tab.path === '/admin' && location.pathname === '/admin');
            return (
              <button
                key={tab.path}
                onClick={() => handleNav(tab.path)}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] min-h-[48px]',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'p-1 rounded-lg transition-transform',
                    isActive && 'bg-primary/10 scale-110'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </button>
            );
          })}

          {/* More trigger */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] min-h-[48px]',
              moreOpen
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="Open more menu"
          >
            <div className="p-1 rounded-lg">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* More Sheet / Dialog for Mobile */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-md p-5 rounded-2xl">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold">
              {isAdmin && location.pathname.startsWith('/admin') ? 'Administration Menu' : 'More Features'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2.5 py-3">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border border-border/60 text-left transition-all hover:bg-secondary/60 active:scale-95',
                    isActive && 'bg-primary/10 border-primary/30 font-semibold'
                  )}
                >
                  <div className={cn('p-2 rounded-lg bg-secondary/80', item.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick controls */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  Dark Mode
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-destructive/20 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
