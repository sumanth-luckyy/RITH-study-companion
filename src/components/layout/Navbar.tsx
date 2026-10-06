import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, GraduationCap, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/common/UserAvatar';
import { academicService } from '@/services/academicService';
import { Announcement } from '@/types/academic';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Navbar({ onMenuClick, showMenuButton = true }: NavbarProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadNotifications() {
      try {
        const list = await academicService.getAnnouncements();
        setAnnouncements(list.slice(0, 5));
        setUnreadCount(list.filter((a) => !a.is_read).length);
      } catch {
        // Ignore
      }
    }
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await academicService.markAllAnnouncementsRead();
    setAnnouncements((prev) => prev.map((a) => ({ ...a, is_read: true })));
    setUnreadCount(0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/resources?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border/80 px-4 md:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Menu button & Greeting / Brand */}
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl border border-border text-foreground hover:bg-secondary lg:hidden transition-colors"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer lg:hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-foreground">Study Companion</span>
          </div>

          {/* Desktop Greeting in Navbar */}
          {profile && (
            <div className="hidden lg:flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                Academic Companion
              </span>
              <span className="text-sm font-semibold text-foreground">
                {profile.class_group} • {profile.department}
              </span>
            </div>
          )}
        </div>

        {/* Center: Quick Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, subjects, assignments..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-border bg-secondary/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary md:hidden"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Announcements and notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card animate-pulse" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 rounded-2xl shadow-lg border-border">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-xs font-semibold text-foreground">Announcements</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-border/40 max-h-72 overflow-y-auto scrollbar-thin">
                {announcements.length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground text-center">No announcements</p>
                ) : (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      onClick={() => navigate('/announcements')}
                      className={`p-3 cursor-pointer hover:bg-secondary/60 transition-colors ${
                        !ann.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-medium text-foreground line-clamp-1">
                          {ann.title}
                        </span>
                        {!ann.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {ann.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/announcements')}
                  className="w-full text-xs h-8 rounded-xl"
                >
                  View All Announcements
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile Avatar button */}
          {user && profile && (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-secondary transition-colors"
              title="View Profile"
            >
              <UserAvatar name={profile.full_name} role={profile.role} size="sm" />
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-medium text-foreground line-clamp-1">
                  {profile.full_name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {profile.roll_number}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Mobile search expanding drawer */}
      {searchOpen && (
        <div className="pt-2.5 pb-1 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, subjects, resources..."
              autoFocus
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-border bg-secondary text-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
