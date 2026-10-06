import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  BookOpen,
  CheckSquare,
  FileText,
  Archive,
  ArrowRight,
  Bell,
  AlertCircle,
  Download,
  CheckCircle2,
  Bookmark,
  MapPin,
  User,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { academicService } from '@/services/academicService';
import {
  Subject,
  TimetableSlot,
  Assignment,
  Announcement,
  AcademicResource,
  DayOfWeek,
} from '@/types/academic';
import { CardSkeleton, LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/UserAvatar';

export default function Home() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [todaySchedule, setTodaySchedule] = useState<{
    today: DayOfWeek;
    schedule: TimetableSlot[];
    currentClass: TimetableSlot | null;
    nextClass: TimetableSlot | null;
  }>({
    today: 'Monday',
    schedule: [],
    currentClass: null,
    nextClass: null,
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentResources, setRecentResources] = useState<AcademicResource[]>([]);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const classGroup = profile?.class_group || '25CS-A';
      const academicFilters = {
        department_id: profile?.department_id || undefined,
        branch_id: profile?.branch_id || undefined,
        sub_branch_id: profile?.sub_branch_id || undefined,
        sub_branch: profile?.sub_branch || undefined,
        section_id: profile?.section_id || undefined,
        section: profile?.section || undefined,
      };

      const [todayData, subjData, asgData, annData, resData] = await Promise.all([
        academicService.getTodayTimetable(classGroup, academicFilters),
        academicService.getSubjects(profile?.semester, profile?.branch, profile?.sub_branch),
        academicService.getAssignments(classGroup, user?.id, academicFilters),
        academicService.getAnnouncements(classGroup, user?.id, academicFilters),
        academicService.getResources({ ...academicFilters, semester: profile?.semester }, user?.id),
      ]);

      setTodaySchedule(todayData);
      setSubjects(subjData);
      setAssignments(asgData.slice(0, 4));
      setAnnouncements(annData.slice(0, 3));
      setRecentResources(resData.slice(0, 4));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Unable to load some dashboard academic content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [profile, user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleToggleAssignment = async (id: string) => {
    const isNowDone = await academicService.toggleAssignmentCompletion(id, user?.id);
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              is_completed: isNowDone,
              status: isNowDone ? 'Completed' : 'Pending',
            }
          : a
      )
    );
  };

  const handleToggleBookmark = async (id: string) => {
    const isNowBookmarked = await academicService.toggleBookmark(id, user?.id);
    setRecentResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_bookmarked: isNowBookmarked } : r))
    );
  };

  const getStatusBadge = (status: Assignment['status']) => {
    switch (status) {
      case 'Due Soon':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Completed':
      case 'Submitted':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Overdue':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getPriorityBadge = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const quickActions = [
    {
      icon: FileText,
      label: 'Notes & Resources',
      desc: 'Syllabus, notes, lab files',
      path: '/resources',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: CheckSquare,
      label: 'Assignments',
      desc: 'Active deadlines & tasks',
      path: '/assignments',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Calendar,
      label: 'Timetable',
      desc: 'Class schedule & rooms',
      path: '/timetable',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Archive,
      label: 'Previous Papers',
      desc: 'Mid & End-sem papers',
      path: '/previous-papers',
      color: 'text-sky-500',
      bg: 'bg-sky-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <LoadingSkeleton className="h-8 w-64" />
          <LoadingSkeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  const studentName = profile?.full_name?.split(' ')[0] || 'Student';
  const hierarchyDisplay = [
    profile?.department || 'Engineering',
    profile?.branch || 'CSE',
    profile?.sub_branch && profile.sub_branch !== 'Core' ? profile.sub_branch : null,
    profile?.year_of_study || '1st Year',
    profile?.semester || 'Semester 1',
    `Section ${profile?.section || 'A'}`
  ].filter(Boolean).join(' • ');

  return (
    <div className="space-y-8">
      {/* ---------------- 1. HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{getGreeting()}, {studentName}</span>
            <span className="text-xl sm:text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
            {hierarchyDisplay} • Roll: <span className="font-mono font-bold text-foreground">{profile?.roll_number || '—'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/timetable')}
            className="rounded-xl text-xs gap-1.5 h-8"
          >
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Today's Classes</span>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/resources')}
            className="rounded-xl text-xs gap-1.5 h-8"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Browse Notes</span>
          </Button>
        </div>
      </div>

      {/* ---------------- 2. TODAY SECTION ---------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground">Today's Schedule</h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-secondary text-secondary-foreground border border-border">
              {todaySchedule.today}
            </span>
          </div>
          <button
            onClick={() => navigate('/timetable')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Full Timetable <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todaySchedule.schedule.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              No classes scheduled for today. Enjoy your study time!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {todaySchedule.schedule.map((slot) => {
              const isCurrent = todaySchedule.currentClass?.id === slot.id;
              const isNext = todaySchedule.nextClass?.id === slot.id && !isCurrent;

              return (
                <div
                  key={slot.id}
                  className={`rounded-2xl border p-4 transition-all relative overflow-hidden bg-card ${
                    isCurrent
                      ? 'border-primary shadow-sm ring-1 ring-primary/30'
                      : isNext
                      ? 'border-border/90 bg-card hover:border-primary/40'
                      : 'border-border/60 bg-card/60'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">
                      CURRENT CLASS
                    </div>
                  )}
                  {isNext && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">
                      UP NEXT
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{slot.start_time} - {slot.end_time}</span>
                  </div>

                  <h3 className="font-semibold text-foreground text-sm line-clamp-1 mb-1">
                    {slot.subject_name}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
                    <span className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{slot.faculty}</span>
                    </span>
                    <span className="flex items-center gap-1 font-medium text-foreground flex-shrink-0">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      {slot.room}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- 3. QUICK ACTIONS ---------------- */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">Quick Academic Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group flex flex-col p-3.5 sm:p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center ${action.color} mb-3 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {action.label}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                  {action.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------------- 4. TWO-COLUMN LAYOUT: MY SUBJECTS & RECENT ANNOUNCEMENTS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): My Subjects */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">My Subjects</h2>
            <button
              onClick={() => navigate('/subjects')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View All ({subjects.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {subjects.slice(0, 4).map((subject) => (
              <div
                key={subject.id}
                onClick={() => navigate(`/subjects/${subject.id}`)}
                className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {subject.code.slice(0, 2)}
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary text-muted-foreground border border-border/60">
                    {subject.code} • {subject.credits} Credits
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1 hover:text-primary transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {subject.faculty}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                  <span>{subject.notes_count} Notes</span>
                  <span>•</span>
                  <span>{subject.assignments_count} Tasks</span>
                  <span>•</span>
                  <span>{subject.papers_count} Papers</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (1 col): Recent Announcements */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">Announcements</h2>
            <button
              onClick={() => navigate('/announcements')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {announcements.length === 0 ? (
              <div className="p-4 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
                No recent announcements
              </div>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => navigate('/announcements')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:bg-secondary/40 ${
                    !ann.is_read
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${getPriorityBadge(
                        ann.priority
                      )}`}
                    >
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ann.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-foreground line-clamp-1 mt-1">
                    {ann.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {ann.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ---------------- 5. UPCOMING ASSIGNMENTS & RECENT MATERIALS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">Upcoming Assignments</h2>
            <button
              onClick={() => navigate('/assignments')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Manage Tasks <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {assignments.length === 0 ? (
              <div className="p-4 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
                No upcoming assignments
              </div>
            ) : (
              assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-3.5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all flex items-start gap-3"
                >
                  <button
                    onClick={() => handleToggleAssignment(asg.id)}
                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                    title={asg.is_completed ? 'Mark pending' : 'Mark completed'}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        asg.is_completed ? 'text-emerald-500 fill-emerald-500/20' : 'text-muted-foreground'
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        {asg.subject_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${getStatusBadge(
                          asg.status
                        )}`}
                      >
                        {asg.status}
                      </span>
                    </div>

                    <h3
                      className={`text-xs font-semibold line-clamp-1 ${
                        asg.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {asg.title}
                    </h3>

                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      Due: {new Date(asg.due_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Study Materials */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">Recent Study Notes</h2>
            <button
              onClick={() => navigate('/resources')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              All Notes & Files <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentResources.length === 0 ? (
              <div className="p-4 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
                No materials available
              </div>
            ) : (
              recentResources.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-foreground truncate">
                        {res.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {res.subject} • {res.unit_or_topic} • {res.file_size}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggleBookmark(res.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                      title={res.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          res.is_bookmarked ? 'fill-primary text-primary' : ''
                        }`}
                      />
                    </button>
                    <a
                      href={res.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
