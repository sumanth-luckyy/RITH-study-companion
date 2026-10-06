import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  ExternalLink,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { academicService } from '@/services/academicService';
import { StudentDriveCourseItem } from '@/types/academic';
import { useAcademicHierarchy } from '@/hooks/useAcademicHierarchy';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function DriveCourses() {
  const { profile } = useAuth();
  const hierarchy = useAcademicHierarchy();

  const [courses, setCourses] = useState<StudentDriveCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [authorizingCourseId, setAuthorizingCourseId] = useState<string | null>(null);

  const availableSemesters = useMemo(() => {
    return hierarchy.getSemestersForBranch(profile?.branch);
  }, [hierarchy, profile?.branch]);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicService.getStudentDriveCourses(profile);
      setCourses(data);
    } catch (err) {
      console.error('Error fetching drive courses:', err);
      toast.error('Unable to load drive courses.');
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenCourse = async (courseId: string) => {
    setAuthorizingCourseId(courseId);
    try {
      const res = await academicService.resolveDriveCourseAccess(courseId, profile);
      if (res.error) {
        toast.error(res.error);
      } else if (res.url) {
        toast.success('Course access verified. Opening drive portal...');
        window.open(res.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Error authorizing course:', err);
      toast.error("You don't have access to this course.");
    } finally {
      setAuthorizingCourseId(null);
    }
  };

  // Filter courses by search and semester
  const filteredCourses = courses.filter((c) => {
    if (selectedSemester !== 'All') {
      if (c.semester && c.semester !== 'All' && c.semester !== selectedSemester) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.subject_name && c.subject_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Drive Courses"
        description="Official institutional Google Drive course materials, lecture drives, and resources tailored to your academic group."
        icon={FolderGit2}
      />

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, topic, or subject..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="All">All Semesters</option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Course Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="rounded-2xl border-border p-5 animate-pulse space-y-4">
              <div className="h-32 bg-secondary/60 rounded-xl" />
              <div className="h-4 bg-secondary/60 rounded w-3/4" />
              <div className="h-3 bg-secondary/40 rounded w-full" />
              <div className="h-8 bg-secondary/60 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          title="No courses available for your class yet."
          description="Your instructors and administrators have not published Drive courses for your branch or semester yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const isAuthorizing = authorizingCourseId === course.id;

            return (
              <Card
                key={course.id}
                className="rounded-2xl border-border bg-card/90 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Thumbnail / Header Banner */}
                  {course.thumbnail_url ? (
                    <div className="h-36 w-full overflow-hidden bg-secondary relative">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Hide broken thumbnail gracefully
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-background/90 text-foreground backdrop-blur-sm border-border text-[10px] font-mono">
                          {course.year_of_study || 'All Years'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 w-full bg-gradient-to-br from-primary/15 via-secondary to-primary/5 p-4 flex flex-col justify-between border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-primary/20 text-primary">
                          <FolderGit2 className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-background/80 font-mono">
                          {course.year_of_study || 'All Years'}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {course.subject_name || course.branch || 'Course Series'}
                      </span>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Academic Targeting Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {course.branch && course.branch !== 'All' && (
                        <Badge variant="secondary" className="text-[10px] font-normal gap-1">
                          <GraduationCap className="w-2.5 h-2.5 text-primary" />
                          {course.branch}
                        </Badge>
                      )}
                      {course.semester && course.semester !== 'All' && (
                        <Badge variant="secondary" className="text-[10px] font-normal gap-1">
                          <Calendar className="w-2.5 h-2.5 text-amber-500" />
                          {course.semester}
                        </Badge>
                      )}
                      {course.section && course.section !== 'All' && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          Sec {course.section}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Button
                    onClick={() => handleOpenCourse(course.id)}
                    disabled={isAuthorizing}
                    className="w-full rounded-xl text-xs font-semibold gap-2 h-10 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isAuthorizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Access...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Course</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
