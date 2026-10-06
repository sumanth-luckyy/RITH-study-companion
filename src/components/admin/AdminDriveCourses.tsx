import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { academicService } from '@/services/academicService';
import {
  DriveCourse,
  CourseStatus,
  Subject,
} from '@/types/academic';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/common/EmptyState';
import { useAcademicHierarchy } from '@/hooks/useAcademicHierarchy';
import { AcademicHierarchyCascade } from '@/components/common/AcademicHierarchyCascade';
import { toast } from 'sonner';

export function AdminDriveCourses() {
  const { profile } = useAuth();
  const hierarchy = useAcademicHierarchy();

  // Data States
  const [courses, setCourses] = useState<DriveCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filters (Search | Status | Branch | Year | Semester)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<DriveCourse | null>(null);
  const [selectedCourseForDelete, setSelectedCourseForDelete] = useState<DriveCourse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State with relational IDs
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    drive_url: '',
    thumbnail_url: '',
    department_id: '',
    department: 'Engineering & Technology',
    branch_id: '',
    branch: 'CSE',
    academic_year_id: '',
    academic_year: '2026–27',
    year_of_study: '1st Year',
    semester: 'Semester 1',
    section_id: '',
    section: 'All',
    subject_id: '',
    subject_name: 'General',
    status: 'published' as CourseStatus,
  });

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        const subList = await academicService.getSubjects();
        setSubjects(subList);
      } catch (e) {
        console.error('Error loading subjects:', e);
      }
    }
    loadSubjects();
  }, []);

  // Compute available Years from the single source of truth for the selected Branch
  const availableYearOptions = useMemo(() => {
    return hierarchy.getYearsForBranch(branchFilter);
  }, [hierarchy, branchFilter]);

  // Compute available Semesters for the selected Branch & Year
  const availableSemesterOptions = useMemo(() => {
    return hierarchy.getSemestersForBranch(branchFilter, yearFilter);
  }, [hierarchy, branchFilter, yearFilter]);

  // Auto-reset Year filter if the currently selected Year is not available
  useEffect(() => {
    if (yearFilter !== 'all' && !availableYearOptions.includes(yearFilter)) {
      setYearFilter('all');
    }
  }, [availableYearOptions, yearFilter]);

  // Auto-reset Semester filter if the currently selected Semester is not available
  useEffect(() => {
    if (semesterFilter !== 'all' && !availableSemesterOptions.includes(semesterFilter)) {
      setSemesterFilter('all');
    }
  }, [availableSemesterOptions, semesterFilter]);

  // Fetch Courses
  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicService.getDriveCourses({
        search: searchTerm,
        status: statusFilter,
        branch: branchFilter,
        year: yearFilter,
        semester: semesterFilter,
      });
      setCourses(data);
    } catch (e) {
      console.error('Error fetching drive courses:', e);
      toast.error('Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, branchFilter, yearFilter, semesterFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenAddModal = () => {
    setEditingCourse(null);
    const firstDept = hierarchy.activeDepartments[0];
    const firstBranch = hierarchy.getBranchesForDepartment(firstDept?.id)[0];
    const defaultYear = hierarchy.getYearsForBranch(firstBranch?.id)[0] || '1st Year';
    const defaultSem = hierarchy.getSemestersForBranch(firstBranch?.id, defaultYear)[0] || 'Semester 1';

    setFormState({
      title: '',
      description: '',
      drive_url: '',
      thumbnail_url: '',
      department_id: firstDept?.id || '',
      department: firstDept?.name || 'All',
      branch_id: firstBranch?.id || '',
      branch: firstBranch?.name || 'All',
      academic_year_id: hierarchy.activeAcademicYears.find((y) => y.is_current)?.id || '',
      academic_year: hierarchy.activeAcademicYears.find((y) => y.is_current)?.name || 'All',
      year_of_study: defaultYear,
      semester: defaultSem,
      section_id: '',
      section: 'All',
      subject_id: subjects[0]?.id || '',
      subject_name: subjects[0]?.name || 'General',
      status: 'published',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: DriveCourse) => {
    setEditingCourse(course);
    setFormState({
      title: course.title,
      description: course.description,
      drive_url: course.drive_url,
      thumbnail_url: course.thumbnail_url || '',
      department_id: course.department_id || '',
      department: course.department || 'All',
      branch_id: course.branch_id || '',
      branch: course.branch || 'All',
      academic_year_id: course.academic_year_id || '',
      academic_year: course.academic_year || 'All',
      year_of_study: course.year_of_study || 'All',
      semester: course.semester || 'All',
      section_id: course.section_id || '',
      section: course.section || 'All',
      subject_id: course.subject_id || '',
      subject_name: course.subject_name || 'General',
      status: course.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error('Course title is required.');
      return;
    }
    if (!formState.drive_url.trim()) {
      toast.error('Google Drive URL is required.');
      return;
    }

    // Basic URL validation
    if (!formState.drive_url.startsWith('http://') && !formState.drive_url.startsWith('https://')) {
      toast.error('Please enter a valid URL starting with https://');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCourse) {
        const ok = await academicService.updateDriveCourse(editingCourse.id, {
          title: formState.title.trim(),
          description: formState.description.trim(),
          drive_url: formState.drive_url.trim(),
          thumbnail_url: formState.thumbnail_url.trim() || undefined,
          department_id: formState.department_id || undefined,
          department: formState.department,
          branch_id: formState.branch_id || undefined,
          branch: formState.branch,
          academic_year_id: formState.academic_year_id || undefined,
          academic_year: formState.academic_year,
          year_of_study: formState.year_of_study,
          semester: formState.semester,
          section_id: formState.section_id || undefined,
          section: formState.section,
          subject_id: formState.subject_id || undefined,
          subject_name: formState.subject_name,
          status: formState.status,
        });

        if (ok) {
          toast.success('Drive course updated successfully.');
          setIsModalOpen(false);
          fetchCourses();
        } else {
          toast.error('Failed to update course.');
        }
      } else {
        await academicService.createDriveCourse({
          title: formState.title.trim(),
          description: formState.description.trim(),
          drive_url: formState.drive_url.trim(),
          thumbnail_url: formState.thumbnail_url.trim() || undefined,
          department_id: formState.department_id || undefined,
          department: formState.department,
          branch_id: formState.branch_id || undefined,
          branch: formState.branch,
          academic_year_id: formState.academic_year_id || undefined,
          academic_year: formState.academic_year,
          year_of_study: formState.year_of_study,
          semester: formState.semester,
          section_id: formState.section_id || undefined,
          section: formState.section,
          subject_id: formState.subject_id || undefined,
          subject_name: formState.subject_name,
          status: formState.status,
          created_by: profile?.full_name || 'Admin',
        });

        toast.success('Drive course published successfully.');
        setIsModalOpen(false);
        fetchCourses();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error saving course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (course: DriveCourse) => {
    try {
      const res = await academicService.toggleCoursePublish(course.id);
      if (res.success) {
        toast.success(`Course ${res.newStatus === 'published' ? 'published' : 'unpublished'}.`);
        fetchCourses();
      }
    } catch {
      toast.error('Failed to change course status.');
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourseForDelete) return;
    setIsSubmitting(true);
    try {
      const ok = await academicService.deleteDriveCourse(selectedCourseForDelete.id);
      if (ok) {
        toast.success(`Course "${selectedCourseForDelete.title}" deleted.`);
        setIsDeleteModalOpen(false);
        fetchCourses();
      } else {
        toast.error('Failed to delete course.');
      }
    } catch {
      toast.error('Error deleting course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-primary" />
            Drive Courses Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Publish, edit, and target institutional Google Drive course materials and lecture portals to academic cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCourses}
            disabled={isLoading}
            className="rounded-xl h-9 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="rounded-xl h-9 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Publish Drive Course
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar: Search | Status | Branch | Year | Semester */}
      <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3">
          {/* 1. Search */}
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses by title, topic..."
              className="pl-9 text-xs rounded-xl h-9"
              aria-label="Search Drive courses"
            />
          </div>

          {/* 2. Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
            className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground h-9 col-span-1 lg:col-span-2 truncate focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft (Hidden)</option>
          </select>

          {/* 3. Branch Filter (Real Academic Hierarchy from Database) */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            aria-label="Filter by Branch"
            className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground h-9 col-span-1 lg:col-span-2 truncate focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">All Branches</option>
            {hierarchy.activeBranches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          {/* 4. Year Filter (Filtered dynamically when Branch is selected) */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            aria-label="Filter by Year"
            className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground h-9 col-span-1 lg:col-span-2 truncate focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">All Years</option>
            {availableYearOptions.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {/* 5. Semester Filter (Filtered dynamically when Branch/Year is selected) */}
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            aria-label="Filter by Semester"
            className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground h-9 col-span-1 lg:col-span-2 truncate focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">All Semesters</option>
            {availableSemesterOptions.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filter Indicators & Reset Shortcut */}
        {(branchFilter !== 'all' || yearFilter !== 'all' || semesterFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/40 text-[11px] text-muted-foreground flex-wrap">
            <span className="font-semibold text-foreground/80">Active Filters:</span>
            {branchFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-[10px] rounded-lg font-medium">
                Branch: {branchFilter}
                <button
                  onClick={() => setBranchFilter('all')}
                  className="ml-1 hover:text-foreground focus:outline-none"
                  aria-label="Remove branch filter"
                >
                  ×
                </button>
              </Badge>
            )}
            {yearFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-[10px] rounded-lg font-medium">
                Year: {yearFilter}
                <button
                  onClick={() => setYearFilter('all')}
                  className="ml-1 hover:text-foreground focus:outline-none"
                  aria-label="Remove year filter"
                >
                  ×
                </button>
              </Badge>
            )}
            {semesterFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-[10px] rounded-lg font-medium">
                {semesterFilter}
                <button
                  onClick={() => setSemesterFilter('all')}
                  className="ml-1 hover:text-foreground focus:outline-none"
                  aria-label="Remove semester filter"
                >
                  ×
                </button>
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-[10px] rounded-lg font-medium capitalize">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-1 hover:text-foreground focus:outline-none"
                  aria-label="Remove status filter"
                >
                  ×
                </button>
              </Badge>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setBranchFilter('all');
                setYearFilter('all');
                setSemesterFilter('all');
              }}
              className="text-xs text-primary hover:underline ml-auto font-medium"
            >
              Reset filters
            </button>
          </div>
        )}
      </Card>

      {/* Course List: Desktop Table & Mobile Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="rounded-2xl border-border p-4 animate-pulse h-16 bg-card/60" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          title="No Drive courses found."
          description="No Google Drive courses have been published yet matching your filter."
          action={{
            label: 'Publish First Course',
            onClick: handleOpenAddModal,
          }}
        />
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-3">Target Cohort</th>
                  <th className="py-3 px-3">Branch & Sec</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Published Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                          <FolderGit2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate max-w-xs">{course.title}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs">{course.description}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-foreground">{course.year_of_study || 'All Years'}</div>
                      <div className="text-[10px] text-muted-foreground">{course.semester || 'All Semesters'}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-foreground font-medium">{course.branch || 'CSE'}</div>
                      <div className="text-[10px] text-muted-foreground">Sec {course.section || 'All'}</div>
                    </td>

                    <td className="py-3 px-3">
                      {course.status === 'published' ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] gap-1">
                          <XCircle className="w-2.5 h-2.5" />
                          Draft
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-muted-foreground">
                      {new Date(course.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(course)}
                          className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                        >
                          {course.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(course)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          title="Edit Course"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCourseForDelete(course);
                            setIsDeleteModalOpen(true);
                          }}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="block md:hidden space-y-3">
            {courses.map((course) => (
              <Card key={course.id} className="rounded-2xl border-border bg-card p-4 space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-foreground text-sm truncate">{course.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{course.description}</p>
                  </div>

                  {course.status === 'published' ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] flex-shrink-0">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] flex-shrink-0">
                      Draft
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border/50 text-muted-foreground">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 block">Target Year</span>
                    <span className="text-foreground font-medium">{course.year_of_study || 'All Years'} • {course.semester || 'All Semesters'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 block">Branch & Sec</span>
                    <span className="text-foreground font-medium">{course.branch || 'CSE'} • Sec {course.section || 'All'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublish(course)}
                    className="h-8 text-xs rounded-xl"
                  >
                    {course.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(course)}
                      className="h-8 text-xs rounded-xl gap-1 text-primary"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCourseForDelete(course);
                        setIsDeleteModalOpen(true);
                      }}
                      className="h-8 text-xs rounded-xl gap-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* CREATE / EDIT COURSE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FolderGit2 className="w-5 h-5 text-primary" />
              {editingCourse ? 'Edit Drive Course' : 'Publish New Drive Course'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2 text-xs">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Course Title *</label>
              <Input
                value={formState.title}
                onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                placeholder="e.g. Complete Python & Data Structures Course"
                required
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Course Description</label>
              <textarea
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="Describe course objectives, covered topics, and syllabus links..."
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Google Drive URL */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Google Drive URL *</label>
              <Input
                type="url"
                value={formState.drive_url}
                onChange={(e) => setFormState({ ...formState, drive_url: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
                required
                className="h-9 text-xs rounded-xl font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Note: This raw URL is stored securely and never exposed in the student UI.
              </p>
            </div>

            {/* Thumbnail URL (Optional) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Thumbnail / Cover Image URL (Optional)</label>
              <Input
                type="url"
                value={formState.thumbnail_url}
                onChange={(e) => setFormState({ ...formState, thumbnail_url: e.target.value })}
                placeholder="https://images.unsplash.com/... (optional)"
                className="h-9 text-xs rounded-xl font-mono"
              />
            </div>

            {/* Academic Cohort Targeting Grid */}
            <div className="pt-2 border-t border-border/50">
              <h4 className="font-bold text-foreground text-xs mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Academic Targeting Constraints (Single Source of Truth)
              </h4>

              <AcademicHierarchyCascade
                values={{
                  department_id: formState.department_id,
                  department: formState.department,
                  branch_id: formState.branch_id,
                  branch: formState.branch,
                  academic_year_id: formState.academic_year_id,
                  academic_year: formState.academic_year,
                  year_of_study: formState.year_of_study,
                  semester: formState.semester,
                  section_id: formState.section_id,
                  section: formState.section,
                }}
                onChange={(updates) => setFormState((prev) => ({ ...prev, ...updates }))}
                allowAllOption={true}
                showAcademicYear={true}
                showSection={true}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {/* Linked Subject (Optional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Linked Subject (Optional)</label>
                  <select
                    value={formState.subject_id}
                    onChange={(e) => {
                      const sel = subjects.find((s) => s.id === e.target.value);
                      setFormState({
                        ...formState,
                        subject_id: e.target.value,
                        subject_name: sel?.name || 'General',
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="">General / None</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Publication Status</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as CourseStatus })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground font-semibold"
                  >
                    <option value="published">Published (Visible to Target Cohort)</option>
                    <option value="draft">Draft (Hidden from Students)</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl h-9 text-xs bg-primary text-primary-foreground"
              >
                {isSubmitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Publish Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Drive Course
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete course{' '}
            <strong className="text-foreground">{selectedCourseForDelete?.title}</strong>? Students will immediately lose access to this course portal.
          </p>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-xl h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDeleteCourse}
              className="rounded-xl h-9 text-xs"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
