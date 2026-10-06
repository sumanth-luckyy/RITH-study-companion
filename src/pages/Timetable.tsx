import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  CheckCircle,
  PlayCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { academicService } from '@/services/academicService';
import { TimetableSlot, DayOfWeek } from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { useAuth } from '@/contexts/AuthContext';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function Timetable() {
  const { profile } = useAuth();
  const [allSlots, setAllSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Day selection for mobile / single-day view
  const currentDayIndex = new Date().getDay();
  const todayName: DayOfWeek =
    currentDayIndex >= 1 && currentDayIndex <= 5 ? DAYS[currentDayIndex - 1] : 'Monday';

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayName);
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('today');

  const fetchTimetable = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await academicService.getTimetable(profile?.class_group || '25CS-A');
      setAllSlots(data);
    } catch {
      setError('Could not load the timetable schedule.');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.class_group]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // Determine current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

  const getSlotStatus = (slot: TimetableSlot) => {
    if (slot.day !== todayName) return 'upcoming';
    if (currentTimeStr >= slot.start_time && currentTimeStr < slot.end_time) return 'current';
    if (currentTimeStr >= slot.end_time) return 'completed';
    return 'upcoming';
  };

  const daySchedule = allSlots
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Schedule & Timetable"
        subtitle={`Official lecture and laboratory schedule for section ${profile?.class_group || '25CS-A'}.`}
        badge={profile?.class_group || '25CS-A'}
        actions={
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/80 border border-border">
            <button
              onClick={() => setViewMode('today')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'today'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'weekly'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Weekly Grid
            </button>
          </div>
        }
      />

      {/* Day Picker Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {DAYS.map((day) => {
          const isToday = day === todayName;
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{day}</span>
              {isToday && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-primary-foreground' : 'bg-primary'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTimetable} />
      ) : viewMode === 'today' ? (
        /* Clean vertical schedule */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing schedule for <strong className="text-foreground">{selectedDay}</strong>
            </span>
            <span>{daySchedule.length} sessions</span>
          </div>

          {daySchedule.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title={`No classes on ${selectedDay}`}
              description="No formal lectures or lab sessions are scheduled for this day."
            />
          ) : (
            <div className="relative border-l-2 border-primary/20 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
              {daySchedule.map((slot) => {
                const status = getSlotStatus(slot);

                return (
                  <div key={slot.id} className="relative group">
                    {/* Timeline Node */}
                    <div
                      className={`absolute -left-[25px] sm:-left-[33px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                        status === 'current'
                          ? 'bg-primary border-primary ring-4 ring-primary/20 animate-pulse'
                          : status === 'completed'
                          ? 'bg-muted-foreground/30 border-muted-foreground'
                          : 'bg-card border-primary'
                      }`}
                    />

                    {/* Card */}
                    <div
                      className={`rounded-2xl border p-4 sm:p-5 transition-all bg-card ${
                        status === 'current'
                          ? 'border-primary ring-1 ring-primary/30 shadow-sm'
                          : status === 'completed'
                          ? 'border-border/60 bg-card/60 opacity-70'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-primary flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">
                            {slot.period_type}
                          </span>
                        </div>

                        {status === 'current' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary text-primary-foreground animate-pulse">
                            IN PROGRESS
                          </span>
                        )}
                        {status === 'completed' && (
                          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" /> Completed
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                        {slot.subject_name}
                      </h3>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 mt-2 border-t border-border/50 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {slot.faculty}
                        </span>

                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {slot.room}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Weekly Desktop Grid */
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="min-w-[760px] grid grid-cols-5 gap-3">
            {DAYS.map((day) => {
              const slotsForDay = allSlots
                .filter((s) => s.day === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              const isToday = day === todayName;

              return (
                <div
                  key={day}
                  className={`rounded-2xl border p-3 bg-card space-y-3 ${
                    isToday ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-bold text-foreground">{day}</span>
                    {isToday && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {slotsForDay.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-4">No classes</p>
                    ) : (
                      slotsForDay.map((slot) => (
                        <div
                          key={slot.id}
                          className="rounded-xl border border-border/60 p-2.5 bg-secondary/30 text-xs space-y-1 hover:border-primary/30 transition-colors"
                        >
                          <span className="text-[10px] font-bold text-primary block">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <span className="font-semibold text-foreground block line-clamp-1">
                            {slot.subject_name}
                          </span>
                          <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                            <span className="truncate">{slot.faculty}</span>
                            <span className="font-medium text-foreground">{slot.room}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
