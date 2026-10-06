import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  CheckSquare,
  Calendar,
  FileText,
  Archive,
  Bell,
  Users,
  Download,
  User,
  Shield,
  AlertTriangle,
  Info,
  Settings,
  Sun,
  Moon,
  LogOut,
  X,
  GraduationCap,
  Layers,
  Activity,
  ChevronDown,
  ChevronRight,
  GitFork,
  Hash,
  Clock,
  Sparkles,
  Building,
  FolderGit2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/common/UserAvatar';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [hierarchyExpanded, setHierarchyExpanded] = useState(true);

  const isInAdminMode = isAdmin && location.pathname.startsWith('/admin');

  // Student Navigation Items
  const studentNavItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: BookOpen, label: 'My Subjects', path: '/subjects' },
    { icon: FolderGit2, label: 'Drive Courses', path: '/courses' },
    { icon: CheckSquare, label: 'Assignments', path: '/assignments' },
    { icon: Calendar, label: 'Timetable', path: '/timetable' },
    { icon: FileText, label: 'Notes & Resources', path: '/resources' },
    { icon: Archive, label: 'Previous Papers', path: '/previous-papers' },
    { icon: Bell, label: 'Announcements', path: '/announcements' },
    { icon: Users, label: 'Classmates', path: '/classmates' },
    { icon: Download, label: 'Downloads & Saved', path: '/downloads' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const studentSecondaryItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: AlertTriangle, label: 'Report Problem', path: '/report' },
    { icon: Info, label: 'About', path: '/about' },
  ];

  // Admin Workspace Navigation Items
  const adminHierarchyItems = [
    { icon: Building, label: 'Departments', path: '/admin/hierarchy' },
    { icon: GitFork, label: 'Branches', path: '/admin/hierarchy' },
    { icon: Calendar, label: 'Academic Years', path: '/admin/hierarchy' },
    { icon: Layers, label: 'Classes', path: '/admin/hierarchy' },
    { icon: Hash, label: 'Sections', path: '/admin/hierarchy' },
    { icon: CodeIcon, label: 'Branch Codes', path: '/admin/hierarchy' },
  ];

  function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
    return <Hash {...props} />;
  }

  const handleNav = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card border-r border-border transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div
            onClick={() => handleNav(isInAdminMode ? '/admin' : '/dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground shadow-md transition-transform group-hover:scale-105',
                isInAdminMode ? 'bg-destructive' : 'bg-primary'
              )}
            >
              {isInAdminMode ? <Shield className="w-5 h-5 text-white" /> : <GraduationCap className="w-6 h-6" />}
            </div>
            <div>
              <span className="font-bold text-foreground text-base tracking-tight block">
                {isInAdminMode ? 'Admin Workspace' : 'Study Companion'}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground block -mt-0.5">
                {isInAdminMode
                  ? 'Institutional Control'
                  : profile?.class_group
                  ? `${profile.class_group} • Academics`
                  : 'College Academic Portal'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Card */}
        {profile && (
          <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-secondary/50 border border-border/40 flex items-center gap-3">
            <UserAvatar name={profile.full_name} role={profile.role} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {profile.full_name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {profile.roll_number} • {isInAdminMode ? 'System Administrator' : profile.class_group}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Links Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin">
          {/* ================================================================ */}
          {/* CASE A: ADMIN WORKSPACE DESKTOP SIDEBAR */}
          {/* ================================================================ */}
          {isInAdminMode ? (
            <div className="space-y-4">
              {/* Core Admin */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Administration
                </p>
                <button
                  onClick={() => handleNav('/admin')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
                    location.pathname === '/admin'
                      ? 'bg-destructive text-destructive-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  )}
                >
                  <Activity className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate">Dashboard Overview</span>
                </button>

                <button
                  onClick={() => handleNav('/admin/users')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
                    location.pathname.startsWith('/admin/users')
                      ? 'bg-destructive text-destructive-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  )}
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate">Users & Admins</span>
                </button>

                <button
                  onClick={() => handleNav('/admin/students')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
                    location.pathname.startsWith('/admin/students')
                      ? 'bg-destructive text-destructive-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  )}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate">Students</span>
                </button>
              </div>

              {/* Expandable Academic Hierarchy Group */}
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => setHierarchyExpanded(!hierarchyExpanded)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Academic Hierarchy</span>
                  </span>
                  {hierarchyExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {hierarchyExpanded && (
                  <div className="pl-2 space-y-0.5 border-l-2 border-primary/20 ml-3">
                    {adminHierarchyItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleNav(item.path)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left',
                            location.pathname.startsWith('/admin/hierarchy')
                              ? 'text-primary font-semibold hover:bg-secondary/70'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Operations & Cloud */}
              <div className="space-y-1 pt-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Academic Operations
                </p>
                {[
                  { icon: BookOpen, label: 'Subjects', path: '/admin/subjects' },
                  { icon: FolderGit2, label: 'Drive Courses', path: '/admin/courses' },
                  { icon: FileText, label: 'Resources & Cloud Files', path: '/admin/resources' },
                  { icon: CheckSquare, label: 'Assignments', path: '/admin/assignments' },
                  { icon: Calendar, label: 'Timetable', path: '/admin/timetable' },
                  { icon: Bell, label: 'Announcements', path: '/admin/announcements' },
                  { icon: AlertTriangle, label: 'Problem Reports', path: '/admin/reports' },
                  { icon: Clock, label: 'Activity & Audit Logs', path: '/admin/logs' },
                  { icon: Settings, label: 'Roll Parser & Rules', path: '/admin/settings' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleNav(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
                        isActive
                          ? 'bg-destructive text-destructive-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Portal switcher */}
              <div className="pt-2 border-t border-border/40">
                <button
                  onClick={() => handleNav('/dashboard')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-all text-left"
                >
                  <GraduationCap className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate">Student View</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================================================================ */
            /* CASE B: STUDENT PORTAL DESKTOP SIDEBAR (NO ADMIN FEATURES)       */
            /* ================================================================ */
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Academics
                </p>
                {studentNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Administrative link: ONLY shown if user is actually admin */}
              {isAdmin && (
                <div className="space-y-1 pt-2 border-t border-border/40">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-destructive mb-1">
                    Administration Access
                  </p>
                  <button
                    onClick={() => handleNav('/admin')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all text-left"
                  >
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">Admin Control Panel</span>
                  </button>
                </div>
              )}

              {/* Secondary Navigation */}
              <div className="space-y-1 pt-2 border-t border-border/40">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Account & Help
                </p>
                {studentSecondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Theme & Signout Footer */}
        <div className="p-3 border-t border-border/60 flex items-center justify-between gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px]">Dark</span>
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-destructive/20 text-xs font-medium text-destructive hover:bg-destructive/10 transition-all"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[11px]">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
