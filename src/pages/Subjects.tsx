import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  User,
  GraduationCap,
  FileText,
  CheckSquare,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { academicService } from '@/services/academicService';
import { Subject } from '@/types/academic';
import { useAcademicHierarchy } from '@/hooks/useAcademicHierarchy';
import { PageHeader } from '@/components/common/PageHeader';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';

export default function Subjects() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const hierarchy = useAcademicHierarchy();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All');

  const semesters = useMemo(() => {
    return ['All', ...hierarchy.getSemestersForBranch(profile?.branch)];
  }, [hierarchy, profile?.branch]);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await academicService.getSubjects(selectedSemester);
      setSubjects(data);
    } catch {
      setError('Failed to load your enrolled subjects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSemester]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const filteredSubjects = subjects.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.faculty.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Enrolled Subjects"
        subtitle={`Academic curriculum for ${profile?.class_group || '25CS-A'} • ${profile?.department || 'CSE'}`}
        badge={`${subjects.length} Subjects`}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects by name, code, or faculty..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSemester === sem
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {sem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSubjects} />
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects found"
          description="Try changing your search term or semester filter."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedSemester('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => navigate(`/subjects/${subject.id}`)}
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {subject.code.slice(0, 2)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">
                      {subject.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                      {subject.credits} Credits
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors line-clamp-1">
                    {subject.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate">{subject.faculty}</span>
                  </div>
                </div>

                {subject.syllabus && subject.syllabus.length > 0 && (
                  <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground line-clamp-2">
                    {subject.syllabus[0]}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-[11px] font-medium">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-primary" /> {subject.notes_count} Notes
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 text-amber-500" /> {subject.assignments_count} Tasks
                  </span>
                </div>

                <span className="text-primary font-semibold flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition-transform">
                  View Subject <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
