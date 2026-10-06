import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { academicService } from '@/services/academicService';
import { Announcement, AnnouncementCategory } from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES: ('All' | AnnouncementCategory)[] = [
  'All',
  'Urgent',
  'Exam',
  'Department',
  'Class',
  'General',
];

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'All' | AnnouncementCategory>('All');
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await academicService.getAnnouncements(user?.id);
      setAnnouncements(data);
    } catch {
      setError('Could not load announcements.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await academicService.markAnnouncementRead(id, user?.id);
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
    );
  };

  const handleMarkAllRead = async () => {
    await academicService.markAllAnnouncementsRead(user?.id);
    setAnnouncements((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  const handleOpenAnnouncement = (ann: Announcement) => {
    setActiveAnnouncement(ann);
    if (!ann.is_read) {
      handleMarkRead(ann.id);
    }
  };

  const filtered = announcements.filter((a) => {
    if (selectedCategory === 'All') return true;
    return a.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const unreadCount = announcements.filter((a) => !a.is_read).length;

  const getPriorityBadge = (priority: Announcement['priority'], category: string) => {
    if (priority === 'urgent' || category === 'Urgent') {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    }
    if (priority === 'high' || category === 'Exam') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (category === 'Department') {
      return 'bg-primary/10 text-primary border-primary/20';
    }
    return 'bg-secondary text-secondary-foreground border-border';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="College & Department Announcements"
        subtitle="Important circulars, exam schedules, events, and class timetable updates."
        badge={unreadCount > 0 ? `${unreadCount} Unread` : undefined}
        actions={
          unreadCount > 0 ? (
            <Button
              onClick={handleMarkAllRead}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 h-8"
            >
              <CheckCheck className="w-3.5 h-3.5 text-primary" />
              Mark All as Read
            </Button>
          ) : undefined
        }
      />

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAnnouncements} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No announcements found"
          description="There are currently no active announcements in this category."
        />
      ) : (
        <div className="space-y-3.5">
          {filtered.map((ann) => (
            <div
              key={ann.id}
              onClick={() => handleOpenAnnouncement(ann)}
              className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer hover:shadow-sm ${
                !ann.is_read
                  ? 'border-primary/40 bg-primary/5 hover:border-primary'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getPriorityBadge(
                        ann.priority,
                        ann.category
                      )}`}
                    >
                      {ann.category}
                    </span>

                    {!ann.is_read && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary text-primary-foreground">
                        NEW
                      </span>
                    )}

                    <span className="text-[11px] text-muted-foreground">
                      {new Date(ann.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {ann.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <User className="w-3 h-3 text-muted-foreground" />
                      {ann.author}
                    </span>

                    <span className="text-primary font-semibold flex items-center gap-1">
                      Read Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {!ann.is_read && (
                  <button
                    onClick={(e) => handleMarkRead(ann.id, e)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Announcement Dialog */}
      {activeAnnouncement && (
        <Dialog open={!!activeAnnouncement} onOpenChange={() => setActiveAnnouncement(null)}>
          <DialogContent className="max-w-lg rounded-2xl p-6">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getPriorityBadge(
                    activeAnnouncement.priority,
                    activeAnnouncement.category
                  )}`}
                >
                  {activeAnnouncement.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(activeAnnouncement.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                {activeAnnouncement.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs sm:text-sm">
              <p className="text-foreground leading-relaxed">
                {activeAnnouncement.content || activeAnnouncement.description}
              </p>

              <div className="rounded-xl bg-secondary/50 p-3 text-xs border border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground">Issued By:</span>
                <span className="font-semibold text-foreground">{activeAnnouncement.author}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveAnnouncement(null)}
                className="rounded-xl"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
