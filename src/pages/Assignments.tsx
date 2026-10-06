import { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Download,
  Filter,
} from 'lucide-react';
import { academicService } from '@/services/academicService';
import { Assignment, AssignmentStatus } from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Assignments() {
  const { profile, user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Due Soon' | 'Completed'>('All');

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await academicService.getAssignments(profile?.class_group, user?.id);
      setAssignments(data);
    } catch {
      setError('Could not retrieve assignments.');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.class_group, user?.id]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleToggle = async (id: string) => {
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

  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Completed') return a.is_completed;
    if (activeTab === 'Due Soon') return a.status === 'Due Soon' && !a.is_completed;
    if (activeTab === 'Pending') return !a.is_completed;
    return true;
  });

  const getStatusBadge = (status: AssignmentStatus) => {
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

  const pendingCount = assignments.filter((a) => !a.is_completed).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments & Coursework"
        subtitle={`Track academic submissions, problem sets, and lab report deadlines for ${profile?.class_group || '25CS-A'}.`}
        badge={pendingCount > 0 ? `${pendingCount} Pending` : 'All Caught Up'}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1 overflow-x-auto scrollbar-thin">
        {(['All', 'Pending', 'Due Soon', 'Completed'] as const).map((tab) => {
          let count = assignments.length;
          if (tab === 'Pending') count = assignments.filter((a) => !a.is_completed).length;
          if (tab === 'Due Soon') count = assignments.filter((a) => a.status === 'Due Soon' && !a.is_completed).length;
          if (tab === 'Completed') count = assignments.filter((a) => a.is_completed).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  activeTab === tab
                    ? 'bg-primary/20 text-primary font-bold'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {count}
              </span>
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
        <ErrorState message={error} onRetry={fetchAssignments} />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={
            activeTab === 'Completed'
              ? 'No completed assignments yet'
              : 'No assignments found in this category'
          }
          description={
            activeTab === 'Completed'
              ? 'Complete tasks by clicking the check circle next to each assignment.'
              : 'All your assignments for this section are up to date!'
          }
        />
      ) : (
        <div className="space-y-3.5">
          {filteredAssignments.map((asg) => (
            <div
              key={asg.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all flex items-start gap-4 bg-card ${
                asg.is_completed
                  ? 'border-border/60 bg-card/60 opacity-80'
                  : 'border-border hover:border-primary/40 hover:shadow-sm'
              }`}
            >
              {/* Checkbox action */}
              <button
                onClick={() => handleToggle(asg.id)}
                className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                title={asg.is_completed ? 'Mark as pending' : 'Mark as complete'}
              >
                <CheckCircle2
                  className={`w-5 h-5 ${
                    asg.is_completed ? 'text-emerald-500 fill-emerald-500/20' : 'text-muted-foreground'
                  }`}
                />
              </button>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary text-foreground">
                      {asg.subject_name}
                    </span>
                    {asg.max_marks && (
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Max: {asg.max_marks} pts
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadge(
                      asg.status
                    )}`}
                  >
                    {asg.status}
                  </span>
                </div>

                <h3
                  className={`text-sm sm:text-base font-semibold leading-snug ${
                    asg.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {asg.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {asg.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Due Date:{' '}
                      {new Date(asg.due_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {asg.attachment_name && (
                    <span className="inline-flex items-center gap-1.5 text-primary hover:underline text-[11px] font-semibold cursor-pointer">
                      <FileText className="w-3.5 h-3.5" />
                      {asg.attachment_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
