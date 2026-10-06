import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  User,
  Mail,
  GraduationCap,
  FileText,
  CheckSquare,
  Archive,
  Download,
  Bookmark,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { academicService } from '@/services/academicService';
import { Subject, AcademicResource, Assignment } from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'assignments' | 'papers' | 'resources'>('overview');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [subj, allRes, allAsg] = await Promise.all([
          academicService.getSubjectById(id),
          academicService.getResources(undefined, user?.id),
          academicService.getAssignments(undefined, user?.id),
        ]);
        setSubject(subj);

        if (subj) {
          const matchingRes = allRes.filter(
            (r) =>
              r.subject_id === subj.id ||
              r.subject.toLowerCase() === subj.name.toLowerCase()
          );
          setResources(matchingRes);

          const matchingAsg = allAsg.filter(
            (a) =>
              a.subject_id === subj.id ||
              a.subject_name.toLowerCase() === subj.name.toLowerCase()
          );
          setAssignments(matchingAsg);
        }
      } catch (err) {
        console.error('Failed to load subject detail:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, user?.id]);

  const handleToggleBookmark = async (resId: string) => {
    const isNow = await academicService.toggleBookmark(resId, user?.id);
    setResources((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, is_bookmarked: isNow } : r))
    );
  };

  const handleToggleAssignment = async (asgId: string) => {
    const isNow = await academicService.toggleAssignmentCompletion(asgId, user?.id);
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === asgId
          ? {
              ...a,
              is_completed: isNow,
              status: isNow ? 'Completed' : 'Pending',
            }
          : a
      )
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!subject) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Subject Not Found"
        description="The requested subject curriculum could not be located."
        actionLabel="Back to All Subjects"
        onAction={() => navigate('/subjects')}
      />
    );
  }

  const notesList = resources.filter((r) => r.category === 'Notes');
  const papersList = resources.filter((r) => r.category === 'Question Papers');
  const otherResources = resources.filter(
    (r) => r.category === 'Lab Manuals' || r.category === 'Study Materials' || r.category === 'Important Documents'
  );

  return (
    <div className="space-y-6">
      {/* Back button & Subject Hero Card */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/subjects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Subjects
        </button>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {subject.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
                  {subject.semester}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {subject.credits} Credits
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {subject.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-foreground">{subject.faculty}</span>
                </span>
                {subject.faculty_email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{subject.faculty_email}</span>
                  </span>
                )}
                <span>•</span>
                <span>{subject.department}</span>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/resources?subject=${encodeURIComponent(subject.name)}`)}
              size="sm"
              variant="outline"
              className="rounded-xl text-xs"
            >
              Browse All Subject Files
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1 scrollbar-thin">
        {[
          { key: 'overview', label: 'Overview & Syllabus', count: subject.syllabus?.length },
          { key: 'notes', label: 'Notes', count: notesList.length },
          { key: 'assignments', label: 'Assignments', count: assignments.length },
          { key: 'papers', label: 'Previous Papers', count: papersList.length },
          { key: 'resources', label: 'Lab & Manuals', count: otherResources.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                activeTab === tab.key ? 'bg-primary/20 text-primary font-bold' : 'bg-secondary text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Syllabus & Course Structure
              </h3>
              <div className="space-y-2 divide-y divide-border/40">
                {subject.syllabus?.map((unit, index) => (
                  <div key={index} className="pt-2 text-xs text-foreground flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-secondary text-muted-foreground flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Course Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Course Code</span>
                  <span className="font-semibold text-foreground">{subject.code}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-semibold text-foreground">{subject.credits} Credits</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Semester</span>
                  <span className="font-semibold text-foreground">{subject.semester}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="font-semibold text-foreground">{subject.branch}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Faculty</span>
                  <span className="font-semibold text-foreground">{subject.faculty}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-3">
          {notesList.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No lecture notes uploaded yet"
              description="Your instructor has not uploaded lecture notes for this course yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {notesList.map((res) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-border bg-card p-4 space-y-2.5 hover:border-primary/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-primary/10 text-primary">
                        {res.unit_or_topic}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{res.file_size}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                      {res.title}
                    </h4>
                    {res.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {res.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleToggleBookmark(res.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                      title="Bookmark"
                    >
                      <Bookmark className={`w-4 h-4 ${res.is_bookmarked ? 'fill-primary text-primary' : ''}`} />
                    </button>
                    <a
                      href={res.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary font-semibold text-xs hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No assignments due"
              description="There are currently no assignments listed for this subject."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3.5 hover:border-primary/30 transition-all"
                >
                  <button
                    onClick={() => handleToggleAssignment(asg.id)}
                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                    title={asg.is_completed ? 'Mark as pending' : 'Mark as complete'}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        asg.is_completed ? 'text-emerald-500 fill-emerald-500/20' : 'text-muted-foreground'
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-foreground">
                        {asg.title}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-secondary text-secondary-foreground border border-border">
                        {asg.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {asg.description}
                    </p>

                    <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground font-medium">
                      <span>Due: {new Date(asg.due_date).toLocaleDateString()}</span>
                      {asg.max_marks && <span>Max Marks: {asg.max_marks}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'papers' && (
        <div className="space-y-3">
          {papersList.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="No previous question papers"
              description="Previous semester question papers will be published before exam revisions."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {papersList.map((res) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-border bg-card p-4 space-y-2 hover:border-primary/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      {res.exam_year || '2025'} • {res.exam_type || 'Examination'}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground mt-2">
                      {res.title}
                    </h4>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{res.file_size}</span>
                    <a
                      href={res.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary font-semibold text-xs hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Paper
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-3">
          {otherResources.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No laboratory manuals or reference documents"
              description="Course reference materials will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {otherResources.map((res) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-border bg-card p-4 space-y-2 hover:border-primary/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-secondary text-secondary-foreground border border-border">
                      {res.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground mt-2">
                      {res.title}
                    </h4>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{res.file_size}</span>
                    <a
                      href={res.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary font-semibold text-xs hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
