import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  BookOpen,
  FileText,
  CheckSquare,
  Bell,
  AlertTriangle,
  Calendar,
  Layers,
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Upload,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Activity,
  Settings,
  GitFork,
  Hash,
  Check,
  X,
  FolderGit2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { academicService } from '@/services/academicService';
import {
  UserProfile,
  AcademicResource,
  Assignment,
  Announcement,
  ReportItem,
  Subject,
  TimetableSlot,
  Classmate,
  ActivityLog,
  AdminAuditLog,
  Department,
  Branch,
  AcademicYear,
  AcademicClass,
  Section,
  ParsedRollNumber,
  deriveClassGroup,
} from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AcademicHierarchyManager } from '@/components/admin/AcademicHierarchyManager';
import { RollParserSettings } from '@/components/admin/RollParserSettings';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { AdminDriveCourses } from '@/components/admin/AdminDriveCourses';
import { AcademicHierarchyCascade } from '@/components/common/AcademicHierarchyCascade';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'students'
  | 'hierarchy'
  | 'courses'
  | 'subjects'
  | 'resources'
  | 'assignments'
  | 'timetable'
  | 'announcements'
  | 'reports'
  | 'logs'
  | 'settings';

export default function AdminPanel() {
  const { profile, isAdmin, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Sync tab with URL if user directly navigated to /admin/:tab
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/users')) setActiveTab('users');
    else if (path.includes('/admin/students')) setActiveTab('students');
    else if (path.includes('/admin/courses')) setActiveTab('courses');
    else if (path.includes('/admin/hierarchy') || path.includes('/admin/classes') || path.includes('/admin/departments') || path.includes('/admin/branches')) setActiveTab('hierarchy');
    else if (path.includes('/admin/subjects')) setActiveTab('subjects');
    else if (path.includes('/admin/resources')) setActiveTab('resources');
    else if (path.includes('/admin/assignments')) setActiveTab('assignments');
    else if (path.includes('/admin/timetable')) setActiveTab('timetable');
    else if (path.includes('/admin/announcements')) setActiveTab('announcements');
    else if (path.includes('/admin/reports')) setActiveTab('reports');
    else if (path.includes('/admin/logs')) setActiveTab('logs');
    else if (path.includes('/admin/settings')) setActiveTab('settings');
  }, [location.pathname]);

  // Real Database Statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    totalAdmins: 0,
    totalClasses: 0,
    totalDepartments: 0,
    totalBranches: 0,
    totalSections: 0,
    totalSubjects: 0,
    totalResources: 0,
    totalAssignments: 0,
    upcomingAssignments: 0,
    totalAnnouncements: 0,
    totalCourses: 0,
    openReports: 0,
  });

  // Database Data States
  const [students, setStudents] = useState<Classmate[]>([]);
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Academic Hierarchy Options for Cascading Dropdowns
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Student Filter & Search States
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranchFilter, setStudentBranchFilter] = useState('All');
  const [studentSectionFilter, setStudentSectionFilter] = useState('All');

  // Student Add / Edit Modal
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Classmate | null>(null);
  const [studentForm, setStudentForm] = useState({
    full_name: '',
    roll_number: '',
    email: '',
    department: 'Engineering & Technology',
    branch: 'CSE',
    academic_year: '2026–27',
    year_of_study: '1st Year',
    semester: 'Semester 1',
    section: 'A',
    department_id: '',
    branch_id: '',
    academic_year_id: '',
    section_id: '',
  });

  // Live roll number parser state inside student modal
  const [parsedRollPreview, setParsedRollPreview] = useState<ParsedRollNumber | null>(null);

  // Bulk CSV Import Modal
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [liveBulkPreview, setLiveBulkPreview] = useState<{
    roll_number: string;
    full_name: string;
    email: string;
    joining_year?: number;
    college_code?: string;
    branch_code?: string;
    numeric_roll?: string;
    mapped_branch?: string;
    valid: boolean;
    error?: string;
  }[]>([]);
  const [bulkImportResult, setBulkImportResult] = useState<{
    successCount: number;
    failedCount: number;
    duplicatesCount: number;
    errors: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Resource Upload Modal (Direct Supabase Storage)
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    subject: 'General',
    unit_or_topic: 'General Topic',
    category: 'Notes' as AcademicResource['category'],
    semester: 'Semester 1',
    class_group: '25CS-A',
    department_id: '',
    branch_id: '',
    section_id: '',
    exam_year: '',
    exam_type: 'End-Semester',
  });

  // Assignment Modal
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    subject_name: 'Python Programming',
    class_group: '25CS-A',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    max_marks: 25,
    branch_id: '',
    section_id: '',
    section: 'A',
  });

  // Timetable Slot Modal
  const [timetableModalOpen, setTimetableModalOpen] = useState(false);
  const [timetableForm, setTimetableForm] = useState({
    subject_name: 'Python Programming',
    faculty: 'Dr. Ramesh Kumar',
    room: 'Room 204',
    day: 'Monday' as TimetableSlot['day'],
    start_time: '09:00',
    end_time: '10:00',
    class_group: '25CS-A',
    period_type: 'Lecture' as TimetableSlot['period_type'],
    branch_id: '',
    section_id: '',
    section: 'A',
  });

  // Announcement Modal
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    description: '',
    content: '',
    category: 'General' as Announcement['category'],
    priority: 'normal' as Announcement['priority'],
    class_group: 'All',
    target_type: 'all' as Announcement['target_type'],
    branch_id: '',
    section: '',
  });

  // Report Modal
  const [reportModalReport, setReportModalReport] = useState<ReportItem | null>(null);
  const [reportAdminNotes, setReportAdminNotes] = useState('');
  const [reportStatusSelect, setReportStatusSelect] = useState<ReportItem['status']>('pending');

  const loadAllAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [st, res, asg, ann, rep, sub, stList, tt, logs, aLogs, dList, bList, ayList, secList] = await Promise.all([
        academicService.getAdminStats(),
        academicService.getResources(),
        academicService.getAssignments(),
        academicService.getAnnouncements(),
        academicService.getReports(),
        academicService.getSubjects(),
        academicService.getAllStudents(),
        academicService.getTimetable(),
        academicService.getActivityLogs(),
        academicService.getAdminAuditLogs(30),
        academicService.getDepartments(),
        academicService.getBranches(),
        academicService.getAcademicYears(),
        academicService.getSections(),
      ]);

      setStats(st);
      setResources(res);
      setAssignments(asg);
      setAnnouncements(ann);
      setReports(rep);
      setSubjects(sub);
      setStudents(stList);
      setTimetableSlots(tt);
      setActivityLogs(logs);
      setAuditLogs(aLogs);
      setDepartments(dList);
      setBranches(bList);
      setAcademicYears(ayList);
      setSections(secList);
    } catch (err) {
      console.error('Error loading admin portal data:', err);
      toast({
        title: 'Error loading admin data',
        description: 'Failed to load some datasets from the database.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllAdminData();

    // Single source of truth: re-fetch all admin data automatically when hierarchy is mutated anywhere
    const handleHierarchyUpdated = () => {
      loadAllAdminData();
    };

    window.addEventListener('academic-hierarchy-updated', handleHierarchyUpdated);
    return () => {
      window.removeEventListener('academic-hierarchy-updated', handleHierarchyUpdated);
    };
  }, [loadAllAdminData]);

  // Handle live roll number evaluation during student form entry
  const handleRollNumberChange = async (val: string) => {
    const clean = val.toUpperCase().trim();
    setStudentForm((prev) => ({ ...prev, roll_number: clean }));

    if (clean.length >= 4) {
      try {
        const parsed = await academicService.parseStudentRoll(clean);
        setParsedRollPreview(parsed);

        // If mapped branch found, auto-populate cascading selectors
        if (parsed.isValid && parsed.mappedBranchName) {
          const matchedBranch = branches.find((b) =>
            b.name.toLowerCase().includes(parsed.mappedBranchName!.toLowerCase()) ||
            b.code.toLowerCase() === parsed.mappedBranchName!.toLowerCase()
          );
          if (matchedBranch) {
            setStudentForm((prev) => ({
              ...prev,
              branch: matchedBranch.name,
              branch_id: matchedBranch.id,
            }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setParsedRollPreview(null);
    }
  };

  // ---------------- STUDENT HANDLERS ----------------
  const handleOpenStudentModal = (st?: Classmate) => {
    if (st) {
      setEditingStudent(st);
      setStudentForm({
        full_name: st.full_name,
        roll_number: st.roll_number,
        email: st.email || '',
        branch: st.branch,
        section: st.section,
        academic_year: st.academic_year || '2026–27',
        year_of_study: '1st Year',
        semester: 'Semester 1',
        department: 'Engineering & Technology',
        department_id: departments[0]?.id || '',
        branch_id: branches.find((b) => b.name === st.branch)?.id || '',
        academic_year_id: academicYears[0]?.id || '',
        section_id: sections.find((sec) => sec.code === st.section)?.id || '',
      });
      setParsedRollPreview(null);
    } else {
      setEditingStudent(null);
      setStudentForm({
        full_name: '',
        roll_number: '',
        email: '',
        department: departments[0]?.name || 'Engineering & Technology',
        branch: branches[0]?.name || 'Computer Science & Engineering',
        academic_year: academicYears.find((y) => y.is_current)?.name || '2026–27',
        year_of_study: '1st Year',
        semester: 'Semester 1',
        section: 'A',
        department_id: departments[0]?.id || '',
        branch_id: branches[0]?.id || '',
        academic_year_id: academicYears.find((y) => y.is_current)?.id || '',
        section_id: sections[0]?.id || '',
      });
      setParsedRollPreview(null);
    }
    setStudentModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.full_name.trim() || !studentForm.roll_number.trim() || !studentForm.email.trim()) {
      toast({
        title: 'Missing information',
        description: 'Full Name, Roll Number, and Email are required.',
        variant: 'destructive',
      });
      return;
    }

    // Check duplicate roll number on creation
    if (!editingStudent) {
      const exists = students.some(
        (s) => s.roll_number.toUpperCase() === studentForm.roll_number.toUpperCase().trim()
      );
      if (exists) {
        toast({
          title: 'Duplicate Roll Number',
          description: `Roll number ${studentForm.roll_number} is already enrolled.`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      if (editingStudent) {
        const ok = await academicService.updateStudent(
          editingStudent.id,
          {
            full_name: studentForm.full_name.trim(),
            roll_number: studentForm.roll_number.trim().toUpperCase(),
            branch: studentForm.branch,
            section: studentForm.section,
            semester: studentForm.semester,
            email: studentForm.email.trim().toLowerCase(),
            department_id: studentForm.department_id,
            branch_id: studentForm.branch_id,
            section_id: studentForm.section_id,
            academic_year_id: studentForm.academic_year_id,
          },
          profile?.full_name || 'Admin'
        );

        if (ok) {
          toast({ title: 'Student Updated', description: 'Student profile modified.' });
          setStudentModalOpen(false);
          loadAllAdminData();
        } else {
          toast({ title: 'Update failed', variant: 'destructive' });
        }
      } else {
        const res = await academicService.createStudent({
          full_name: studentForm.full_name.trim(),
          roll_number: studentForm.roll_number.trim().toUpperCase(),
          email: studentForm.email.trim().toLowerCase(),
          branch: studentForm.branch,
          section: studentForm.section,
          semester: studentForm.semester,
          academic_year: studentForm.academic_year,
          department: studentForm.department,
          department_id: studentForm.department_id,
          branch_id: studentForm.branch_id,
          section_id: studentForm.section_id,
          academic_year_id: studentForm.academic_year_id,
          adminName: profile?.full_name || 'Admin',
        });

        if (res) {
          toast({
            title: 'Student Enrolled',
            description: `Enrolled ${res.full_name} (${res.roll_number}) in ${res.class_group}.`,
          });
          setStudentModalOpen(false);
          loadAllAdminData();
        } else {
          toast({ title: 'Failed to enroll student', variant: 'destructive' });
        }
      }
    } catch {
      toast({ title: 'An error occurred', variant: 'destructive' });
    }
  };

  const handleToggleStudentStatus = async (st: Classmate) => {
    try {
      const ok = await academicService.toggleStudentStatus(st.id, st.is_active !== false, profile?.full_name || 'Admin');
      if (ok) {
        toast({
          title: 'Status Updated',
          description: `Student ${st.roll_number} is now ${st.is_active ? 'Disabled' : 'Active'}.`,
        });
        loadAllAdminData();
      }
    } catch {
      toast({ title: 'Error changing status', variant: 'destructive' });
    }
  };

  // ---------------- LIVE BULK IMPORT PREVIEW ----------------
  const handleCsvChange = async (val: string) => {
    setCsvContent(val);
    setBulkImportResult(null);

    const lines = val
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const previewRows = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip header row if present
      if (line.toLowerCase().startsWith('roll') || line.toLowerCase().startsWith('name')) continue;

      const cols = line.split(',').map((c) => c.trim());
      const roll = (cols[0] || '').toUpperCase();
      const name = cols[1] || '';
      const email = cols[2] || '';

      if (roll) {
        const parsed = await academicService.parseStudentRoll(roll);
        previewRows.push({
          roll_number: roll,
          full_name: name,
          email,
          joining_year: parsed.joiningYear,
          college_code: parsed.collegeCode,
          branch_code: parsed.branchCode,
          numeric_roll: parsed.numericRoll,
          mapped_branch: parsed.mappedBranchName || cols[3] || 'CSE',
          valid: parsed.isValid,
          error: parsed.errorMessage,
        });
      }
    }
    setLiveBulkPreview(previewRows);
  };

  const handleProcessBulkImport = async () => {
    if (!csvContent.trim()) {
      toast({ title: 'Empty CSV', description: 'Paste student CSV rows to import.', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    setBulkImportResult(null);

    try {
      const lines = csvContent
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const toImport = [];
      for (const line of lines) {
        if (line.toLowerCase().startsWith('roll') || line.toLowerCase().startsWith('name')) continue;
        const [roll, name, email, branch, section, semester] = line.split(',').map((c) => c.trim());
        if (roll && name && email) {
          toImport.push({
            roll_number: roll,
            full_name: name,
            email,
            branch: branch || 'CSE',
            section: section || 'A',
            semester: semester || 'Semester 1',
          });
        }
      }

      if (toImport.length === 0) {
        toast({ title: 'No valid rows', description: 'Format: roll_number,full_name,email', variant: 'destructive' });
        setIsImporting(false);
        return;
      }

      const res = await academicService.bulkImportStudents(toImport, profile?.full_name || 'Admin');
      setBulkImportResult(res);

      if (res.successCount > 0) {
        toast({
          title: 'Bulk Import Completed',
          description: `Successfully enrolled ${res.successCount} students.`,
        });
        loadAllAdminData();
      }
    } catch (err: unknown) {
      toast({
        title: 'Bulk import failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // ---------------- RESOURCE HANDLERS ----------------
  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdfFile) {
      toast({ title: 'Select a document', description: 'Please choose a PDF or document file to upload.', variant: 'destructive' });
      return;
    }

    setIsUploadingResource(true);
    try {
      const created = await academicService.uploadAndCreateResource(
        selectedPdfFile,
        {
          title: resourceForm.title.trim() || selectedPdfFile.name,
          description: resourceForm.description.trim() || undefined,
          subject: resourceForm.subject,
          unit_or_topic: resourceForm.unit_or_topic,
          category: resourceForm.category,
          semester: resourceForm.semester,
          class_group: resourceForm.class_group,
          department_id: resourceForm.department_id || undefined,
          branch_id: resourceForm.branch_id || undefined,
          section_id: resourceForm.section_id || undefined,
          exam_year: resourceForm.exam_year || undefined,
          exam_type: resourceForm.exam_type || undefined,
        },
        profile?.full_name || 'Admin'
      );

      if (created) {
        toast({ title: 'Resource Published', description: `Uploaded "${created.title}" successfully.` });
        setResourceModalOpen(false);
        setSelectedPdfFile(null);
        setResourceForm({
          title: '',
          description: '',
          subject: 'General',
          unit_or_topic: 'General Topic',
          category: 'Notes',
          semester: 'Semester 1',
          class_group: '25CS-A',
          department_id: '',
          branch_id: '',
          section_id: '',
          exam_year: '',
          exam_type: 'End-Semester',
        });
        loadAllAdminData();
      }
    } catch (err: unknown) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Storage upload error',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingResource(false);
    }
  };

  const handleDeleteResource = async (res: AcademicResource) => {
    if (!confirm(`Delete resource "${res.title}" from storage and database?`)) return;
    try {
      await academicService.deleteResource(res.id);
      toast({ title: 'Resource Deleted', description: 'File and database record removed.' });
      loadAllAdminData();
    } catch {
      toast({ title: 'Error deleting resource', variant: 'destructive' });
    }
  };

  // ---------------- ASSIGNMENT HANDLERS ----------------
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }

    try {
      await academicService.createAssignment({
        title: assignmentForm.title.trim(),
        description: assignmentForm.description.trim(),
        subject_id: '',
        subject_name: assignmentForm.subject_name,
        class_group: assignmentForm.class_group,
        due_date: new Date(assignmentForm.due_date).toISOString(),
        max_marks: Number(assignmentForm.max_marks) || 25,
        branch_id: assignmentForm.branch_id || undefined,
        section_id: assignmentForm.section_id || undefined,
        section: assignmentForm.section,
      });

      toast({ title: 'Assignment Created', description: `Task created for ${assignmentForm.class_group}.` });
      setAssignmentModalOpen(false);
      setAssignmentForm({
        title: '',
        description: '',
        subject_name: subjects[0]?.name || 'Python Programming',
        class_group: '25CS-A',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        max_marks: 25,
        branch_id: '',
        section_id: '',
        section: 'A',
      });
      loadAllAdminData();
    } catch {
      toast({ title: 'Failed to create assignment', variant: 'destructive' });
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await academicService.deleteAssignment(id);
      toast({ title: 'Assignment Deleted' });
      loadAllAdminData();
    } catch {
      toast({ title: 'Error deleting assignment', variant: 'destructive' });
    }
  };

  // ---------------- TIMETABLE HANDLERS ----------------
  const handleCreateTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicService.createTimetableSlot({
        subject_id: '',
        subject_name: timetableForm.subject_name,
        faculty: timetableForm.faculty,
        room: timetableForm.room,
        day: timetableForm.day,
        start_time: timetableForm.start_time,
        end_time: timetableForm.end_time,
        class_group: timetableForm.class_group,
        period_type: timetableForm.period_type,
        branch_id: timetableForm.branch_id || undefined,
        section_id: timetableForm.section_id || undefined,
        section: timetableForm.section,
      });

      toast({ title: 'Timetable Slot Added', description: 'Schedule updated successfully.' });
      setTimetableModalOpen(false);
      loadAllAdminData();
    } catch {
      toast({ title: 'Failed to add timetable slot', variant: 'destructive' });
    }
  };

  const handleDeleteTimetableSlot = async (id: string) => {
    if (!confirm('Delete this timetable period?')) return;
    try {
      await academicService.deleteTimetableSlot(id);
      toast({ title: 'Timetable Slot Removed' });
      loadAllAdminData();
    } catch {
      toast({ title: 'Error removing timetable slot', variant: 'destructive' });
    }
  };

  // ---------------- ANNOUNCEMENT HANDLERS ----------------
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.description.trim()) {
      toast({ title: 'Title & description required', variant: 'destructive' });
      return;
    }

    try {
      await academicService.createAnnouncement({
        title: announcementForm.title.trim(),
        description: announcementForm.description.trim(),
        content: announcementForm.content.trim() || undefined,
        category: announcementForm.category,
        priority: announcementForm.priority,
        class_group: announcementForm.class_group || 'All',
        author: profile?.full_name || 'Academic Administrator',
        target_type: announcementForm.target_type,
        branch_id: announcementForm.branch_id || undefined,
        section: announcementForm.section || undefined,
      });

      toast({ title: 'Notice Broadcasted', description: 'Announcement posted to student portals.' });
      setAnnouncementModalOpen(false);
      setAnnouncementForm({
        title: '',
        description: '',
        content: '',
        category: 'General',
        priority: 'normal',
        class_group: 'All',
        target_type: 'all',
        branch_id: '',
        section: '',
      });
      loadAllAdminData();
    } catch {
      toast({ title: 'Failed to publish announcement', variant: 'destructive' });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await academicService.deleteAnnouncement(id);
      toast({ title: 'Notice Deleted' });
      loadAllAdminData();
    } catch {
      toast({ title: 'Error deleting notice', variant: 'destructive' });
    }
  };

  // ---------------- REPORT UPDATE HANDLERS ----------------
  const handleUpdateReportStatus = async () => {
    if (!reportModalReport) return;
    try {
      await academicService.updateReportStatus(
        reportModalReport.id,
        reportStatusSelect,
        reportAdminNotes
      );
      toast({ title: 'Ticket Updated' });
      setReportModalReport(null);
      loadAllAdminData();
    } catch {
      toast({ title: 'Failed to update ticket', variant: 'destructive' });
    }
  };

  // Filtered students
  const filteredStudents = students.filter((s) => {
    if (studentBranchFilter !== 'All' && s.branch !== studentBranchFilter) return false;
    if (studentSectionFilter !== 'All' && s.section !== studentSectionFilter) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.branch && s.branch.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
              ADMINISTRATIVE WORKSPACE
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Institutional Admin Portal
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Academic Hierarchy, Configurable Roll Parsing, Student Enrollment, and Targeted Cloud Resources.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={loadAllAdminData}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1.5 h-8"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Synchronize Database
          </Button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1 overflow-x-auto scrollbar-thin">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'Users & Admins', icon: Shield },
          { id: 'students', label: `Students (${students.length})`, icon: Users },
          { id: 'hierarchy', label: 'Academic Hierarchy', icon: Layers },
          { id: 'courses', label: `Drive Courses (${stats.totalCourses || 0})`, icon: FolderGit2 },
          { id: 'subjects', label: `Subjects (${subjects.length})`, icon: BookOpen },
          { id: 'resources', label: `Resources (${resources.length})`, icon: FileText },
          { id: 'assignments', label: `Assignments (${assignments.length})`, icon: CheckSquare },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Bell },
          { id: 'reports', label: `Reports (${reports.length})`, icon: AlertTriangle },
          { id: 'logs', label: 'Audit Logs', icon: Clock },
          { id: 'settings', label: 'Parser & Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as AdminTab);
                navigate(`/admin/${tab.id === 'overview' ? '' : tab.id}`);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 1. OVERVIEW TAB */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real Database Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="text-primary" />
            <StatCard label="Active Students" value={stats.activeStudents} icon={CheckCircle2} color="text-emerald-500" />
            <StatCard label="Inactive / Suspended" value={stats.inactiveStudents} icon={X} color="text-amber-500" />
            <StatCard label="Total Admins" value={stats.totalAdmins} icon={Shield} color="text-purple-500" />
            <StatCard label="Total Departments" value={stats.totalDepartments} icon={GraduationCap} color="text-indigo-500" />
            <StatCard label="Total Branches" value={stats.totalBranches} icon={GitFork} color="text-cyan-500" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Classes" value={stats.totalClasses} icon={Layers} color="text-sky-500" />
            <StatCard label="Total Subjects" value={stats.totalSubjects} icon={BookOpen} color="text-primary" />
            <StatCard label="Total Resources" value={stats.totalResources} icon={FileText} color="text-emerald-500" />
            <StatCard label="Total Assignments" value={stats.totalAssignments} icon={CheckSquare} color="text-amber-500" />
            <StatCard label="Upcoming Assignments" value={stats.upcomingAssignments} icon={Clock} color="text-orange-500" />
            <StatCard label="Announcements" value={stats.totalAnnouncements} icon={Bell} color="text-rose-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Management Quick Launch</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button variant="outline" size="sm" onClick={() => handleOpenStudentModal()} className="justify-start gap-2 h-9">
                  <UserPlus className="w-3.5 h-3.5 text-primary" />
                  <span>Enroll Student</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBulkImportOpen(true)} className="justify-start gap-2 h-9">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bulk Roll Import</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setResourceModalOpen(true)} className="justify-start gap-2 h-9">
                  <Upload className="w-3.5 h-3.5 text-sky-500" />
                  <span>Upload Resource</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAnnouncementModalOpen(true)} className="justify-start gap-2 h-9">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>Broadcast Notice</span>
                </Button>
              </div>
            </div>

            {/* Recent Audit Activities */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Institutional Audit Logs</h3>
                <span className="text-[10px] text-muted-foreground">Recent Actions</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2 rounded-xl bg-secondary/40 border border-border/40 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-foreground block">{log.action}</span>
                      <span className="text-[10px] text-muted-foreground">{log.target_type} • By {log.admin_name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. USERS MANAGEMENT TAB (STUDENTS + ADMINS + REAL ACCOUNTS)         */}
      {/* ==================================================================== */}
      {activeTab === 'users' && <AdminUserManagement />}

      {/* ==================================================================== */}
      {/* 3. ACADEMIC HIERARCHY TAB */}
      {/* ==================================================================== */}
      {activeTab === 'hierarchy' && <AcademicHierarchyManager />}

      {/* ==================================================================== */}
      {/* 3B. DRIVE COURSES MANAGEMENT TAB */}
      {/* ==================================================================== */}
      {activeTab === 'courses' && <AdminDriveCourses />}

      {/* ==================================================================== */}
      {/* 3C. ROLL PARSER SETTINGS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'settings' && <RollParserSettings />}

      {/* ==================================================================== */}
      {/* 4. STUDENTS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name, roll, email, or branch..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setBulkImportOpen(true)} variant="outline" className="h-8 gap-1.5 text-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bulk CSV Import</span>
              </Button>
              <Button size="sm" onClick={() => handleOpenStudentModal()} className="h-8 gap-1.5 text-xs bg-primary">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Enroll Student</span>
              </Button>
            </div>
          </div>

          {/* Student Table */}
          {filteredStudents.length === 0 ? (
            <EmptyState
              title="No students yet."
              description="No students have been enrolled yet. Use Enroll Student or Bulk CSV Import to add students."
              action={{
                label: 'Enroll Student',
                onClick: () => handleOpenStudentModal(),
              }}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Roll Number</th>
                      <th className="py-3 px-4 font-semibold">Full Name</th>
                      <th className="py-3 px-4 font-semibold">Branch</th>
                      <th className="py-3 px-4 font-semibold">Section</th>
                      <th className="py-3 px-4 font-semibold">Class Group</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-secondary/20">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{st.roll_number}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{st.full_name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{st.branch}</td>
                        <td className="py-3 px-4 text-foreground font-semibold">Sec {st.section}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">{st.class_group}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                            {st.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenStudentModal(st)}
                              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                              title="Edit Student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStudentStatus(st)}
                              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                              title={st.is_active ? 'Disable' : 'Enable'}
                            >
                              {st.is_active ? <X className="w-3.5 h-3.5 text-destructive" /> : <Check className="w-3.5 h-3.5 text-emerald-500" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. RESOURCES TAB */}
      {/* ==================================================================== */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">Academic Resources & Cloud Files</h3>
            <Button size="sm" onClick={() => setResourceModalOpen(true)} className="h-8 gap-1.5 text-xs bg-primary">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Button>
          </div>

          {resources.length === 0 ? (
            <EmptyState
              title="No resources yet."
              description="No academic resources, notes, or lab manuals have been uploaded yet."
              action={{
                label: 'Upload First Document',
                onClick: () => setResourceModalOpen(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {resources.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary">
                      {r.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{r.file_size}</span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">{r.title}</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{r.description || r.subject}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span>{r.class_group || 'All Classes'}</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded hover:bg-secondary text-primary"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteResource(r)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. ASSIGNMENTS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">Coursework & Assignments</h3>
            <Button size="sm" onClick={() => setAssignmentModalOpen(true)} className="h-8 gap-1.5 text-xs bg-primary">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Assignment</span>
            </Button>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              title="No assignments yet."
              description="No coursework or assignments have been created yet."
              action={{
                label: 'Create First Assignment',
                onClick: () => setAssignmentModalOpen(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignments.map((asg) => (
                <div key={asg.id} className="p-4 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-600">
                        Due: {new Date(asg.due_date).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-bold text-foreground">{asg.max_marks} Marks</span>
                    </div>
                    <h4 className="text-xs font-bold text-foreground">{asg.title}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{asg.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                    <span>Target: {asg.class_group}</span>
                    <button
                      onClick={() => handleDeleteAssignment(asg.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. TIMETABLE TAB */}
      {/* ==================================================================== */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">Master Class Timetable</h3>
            <Button size="sm" onClick={() => setTimetableModalOpen(true)} className="h-8 gap-1.5 text-xs bg-primary">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Period</span>
            </Button>
          </div>

          {timetableSlots.length === 0 ? (
            <EmptyState
              title="No timetable entries yet."
              description="No classes or periods have been scheduled yet."
              action={{
                label: 'Add First Period',
                onClick: () => setTimetableModalOpen(true),
              }}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Day</th>
                      <th className="py-3 px-4 font-semibold">Timing</th>
                      <th className="py-3 px-4 font-semibold">Subject</th>
                      <th className="py-3 px-4 font-semibold">Faculty</th>
                      <th className="py-3 px-4 font-semibold">Room</th>
                      <th className="py-3 px-4 font-semibold">Target Class</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {timetableSlots.map((slot) => (
                      <tr key={slot.id} className="hover:bg-secondary/20">
                        <td className="py-3 px-4 font-bold text-foreground">{slot.day}</td>
                        <td className="py-3 px-4 font-mono text-primary">{slot.start_time} - {slot.end_time}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{slot.subject_name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{slot.faculty}</td>
                        <td className="py-3 px-4 text-muted-foreground">{slot.room}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">{slot.class_group}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteTimetableSlot(slot.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. ANNOUNCEMENTS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">Announcements & Notices</h3>
            <Button size="sm" onClick={() => setAnnouncementModalOpen(true)} className="h-8 gap-1.5 text-xs bg-primary">
              <Bell className="w-3.5 h-3.5" />
              <span>Broadcast Notice</span>
            </Button>
          </div>

          {announcements.length === 0 ? (
            <EmptyState
              title="No announcements yet."
              description="No broadcast notices have been published yet."
              action={{
                label: 'Broadcast First Notice',
                onClick: () => setAnnouncementModalOpen(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-2xl border border-border bg-card flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary">
                        {ann.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{ann.date ? new Date(ann.date).toLocaleDateString() : 'Today'}</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{ann.title}</h4>
                    <p className="text-xs text-muted-foreground">{ann.description}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. REPORTS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground">Student Problem Reports & Feedback</h3>
          {reports.length === 0 ? (
            <EmptyState
              title="No reports yet."
              description="No student problem reports or feedback tickets have been submitted."
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Subject</th>
                    <th className="py-3 px-4 font-semibold">Reporter</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-secondary/20">
                      <td className="py-3 px-4 font-semibold text-foreground">{rep.subject}</td>
                      <td className="py-3 px-4 text-muted-foreground">{rep.reporter_name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{rep.report_type}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rep.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          {rep.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReportModalReport(rep);
                            setReportStatusSelect(rep.status);
                            setReportAdminNotes(rep.admin_notes || '');
                          }}
                          className="h-7 text-[11px]"
                        >
                          Review Ticket
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10. AUDIT LOGS TAB */}
      {/* ==================================================================== */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground">Immutable Administrative Audit Log</h3>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Admin</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Target Entity</th>
                  <th className="py-3 px-4 font-semibold">Target ID / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20">
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">{log.admin_name}</td>
                    <td className="py-3 px-4 font-bold text-primary">{log.action}</td>
                    <td className="py-3 px-4 text-muted-foreground capitalize">{log.target_type}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-muted-foreground truncate max-w-xs">
                      {log.target_id || JSON.stringify(log.details) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: CASCADING STUDENT ENROLLMENT & EDIT */}
      {/* ==================================================================== */}
      {studentModalOpen && (
        <Dialog open={studentModalOpen} onOpenChange={setStudentModalOpen}>
          <DialogContent className="max-w-lg rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingStudent ? 'Edit Student Academic Profile' : 'Enroll Student (Cascading Academic Identity)'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 py-2 text-xs">
              {/* Roll Number with Live Parser */}
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">
                  Roll Number * (Institutional Format e.g. 25ME1A4602)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={studentForm.roll_number}
                    onChange={(e) => handleRollNumberChange(e.target.value)}
                    placeholder="25ME1A4602"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background uppercase font-mono font-bold tracking-wide"
                  />
                </div>

                {/* Live Parser Feedback */}
                {parsedRollPreview && (
                  <div className="mt-1.5 p-2 rounded-lg bg-secondary/50 border border-border/60 text-[11px] flex items-center justify-between">
                    <div>
                      {parsedRollPreview.isValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Parsed: Year {parsedRollPreview.joiningYear} • Code {parsedRollPreview.branchCode} → {parsedRollPreview.mappedBranchName}
                        </span>
                      ) : (
                        <span className="text-destructive font-medium">{parsedRollPreview.errorMessage}</span>
                      )}
                    </div>
                    {parsedRollPreview.numericRoll && (
                      <span className="font-mono text-muted-foreground font-bold">#{parsedRollPreview.numericRoll}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.full_name}
                    onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                    placeholder="e.g. Sumanth"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Email *</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="student@college.edu"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
              </div>

              {/* Academic Hierarchy Cascading Dropdowns (Single Source of Truth) */}
              <div className="pt-2 border-t border-border/50">
                <AcademicHierarchyCascade
                  values={{
                    department_id: studentForm.department_id,
                    department: studentForm.department,
                    branch_id: studentForm.branch_id,
                    branch: studentForm.branch,
                    academic_year_id: studentForm.academic_year_id,
                    academic_year: studentForm.academic_year,
                    year_of_study: studentForm.year_of_study,
                    semester: studentForm.semester,
                    section_id: studentForm.section_id,
                    section: studentForm.section,
                  }}
                  onChange={(updates) => setStudentForm((prev) => ({ ...prev, ...updates }))}
                  allowAllOption={false}
                  showAcademicYear={true}
                  showSection={true}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setStudentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary">
                  {editingStudent ? 'Save Changes' : 'Confirm Enrollment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: BULK CSV IMPORT WITH LIVE PARSED PREVIEW */}
      {/* ==================================================================== */}
      {bulkImportOpen && (
        <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
          <DialogContent className="max-w-2xl rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <span>Bulk Student Import & Roll Validation</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-secondary/50 rounded-xl space-y-1">
                <span className="font-semibold text-foreground">Expected CSV Format:</span>
                <p className="font-mono text-[11px] text-muted-foreground">
                  roll_number,full_name,email,branch,section,semester
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Example: <code className="bg-background px-1 py-0.5 rounded">25ME1A4602,Sumanth,sumanth@example.com,CSE,A,Semester 1</code>
                </p>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Paste CSV Content:</label>
                <textarea
                  rows={4}
                  value={csvContent}
                  onChange={(e) => handleCsvChange(e.target.value)}
                  placeholder={`25ME1A4602,Sumanth,sumanth@example.com\n25ME1A4603,Rohan,rohan@example.com`}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs"
                />
              </div>

              {/* Live Parsed Preview Table */}
              {liveBulkPreview.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground">Live Roll Number Extraction Preview:</span>
                  <div className="max-h-44 overflow-y-auto border border-border rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-secondary text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3">Roll Number</th>
                          <th className="py-2 px-3">Joining Year</th>
                          <th className="py-2 px-3">College</th>
                          <th className="py-2 px-3">Branch Code</th>
                          <th className="py-2 px-3">Mapped Branch</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {liveBulkPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-secondary/20">
                            <td className="py-2 px-3 font-mono font-bold text-primary">{row.roll_number}</td>
                            <td className="py-2 px-3">{row.joining_year || '—'}</td>
                            <td className="py-2 px-3 font-mono">{row.college_code || '—'}</td>
                            <td className="py-2 px-3 font-mono text-amber-500 font-bold">{row.branch_code || '—'}</td>
                            <td className="py-2 px-3 font-medium text-foreground">{row.mapped_branch || 'CSE'}</td>
                            <td className="py-2 px-3">
                              {row.valid ? (
                                <span className="text-emerald-600 font-semibold">Valid</span>
                              ) : (
                                <span className="text-destructive font-semibold" title={row.error}>Invalid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bulk Results Feedback */}
              {bulkImportResult && (
                <div className="p-3 bg-secondary/50 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">Imported: {bulkImportResult.successCount}</span>
                    <span className="text-amber-500 font-bold">Duplicates: {bulkImportResult.duplicatesCount}</span>
                    <span className="text-destructive font-bold">Failed: {bulkImportResult.failedCount}</span>
                  </div>
                  {bulkImportResult.errors.length > 0 && (
                    <div className="pt-2 text-destructive text-[11px] max-h-24 overflow-y-auto space-y-0.5">
                      {bulkImportResult.errors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setBulkImportOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={handleProcessBulkImport}
                  size="sm"
                  disabled={isImporting || liveBulkPreview.length === 0}
                  className="bg-primary"
                >
                  {isImporting ? 'Importing...' : `Confirm & Import (${liveBulkPreview.length} Students)`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: TARGETED RESOURCE UPLOAD */}
      {/* ==================================================================== */}
      {resourceModalOpen && (
        <Dialog open={resourceModalOpen} onOpenChange={setResourceModalOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Upload Academic Resource</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUploadResource} className="space-y-3.5 py-2 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  placeholder="e.g. Unit 1 Data Structures Complete Notes"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              {/* Academic Hierarchy Targeting */}
              <div className="space-y-1">
                <label className="block text-muted-foreground mb-1 font-medium">Branch Target</label>
                <select
                  value={resourceForm.branch_id}
                  onChange={(e) => setResourceForm({ ...resourceForm, branch_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  <option value="">All Branches</option>
                  {branches.filter((b) => b.is_active !== false).map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Category</label>
                  <select
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value as AcademicResource['category'] })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    <option value="Notes">Notes</option>
                    <option value="PDFs">PDFs</option>
                    <option value="Lab Manuals">Lab Manuals</option>
                    <option value="Question Papers">Question Papers</option>
                    <option value="Study Materials">Study Materials</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Semester</label>
                  <select
                    value={resourceForm.semester}
                    onChange={(e) => setResourceForm({ ...resourceForm, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">PDF / Document File *</label>
                <input
                  type="file"
                  required
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-foreground hover:file:bg-secondary/80"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setResourceModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isUploadingResource} className="bg-primary">
                  {isUploadingResource ? 'Uploading...' : 'Publish Resource'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: TARGETED ASSIGNMENT CREATION */}
      {/* ==================================================================== */}
      {assignmentModalOpen && (
        <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Create Targeted Assignment</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateAssignment} className="space-y-3 py-2 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. Lab Exercise 3: Binary Search Trees"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={assignmentForm.subject_name}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, subject_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Target Section</label>
                  <select
                    value={assignmentForm.section}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    {sections.filter((s) => s.is_active !== false).map((sec) => (
                      <option key={sec.id} value={sec.code}>Section {sec.code}</option>
                    ))}
                    {sections.length === 0 && (
                      <>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    required
                    value={assignmentForm.due_date}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Max Marks</label>
                  <input
                    type="number"
                    value={assignmentForm.max_marks}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, max_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Instructions & Criteria</label>
                <textarea
                  rows={3}
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Submission instructions, code standards, or evaluation rubric..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setAssignmentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary">
                  Create Assignment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: TIMETABLE PERIOD */}
      {/* ==================================================================== */}
      {timetableModalOpen && (
        <Dialog open={timetableModalOpen} onOpenChange={setTimetableModalOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add Timetable Slot</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateTimetableSlot} className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Day</label>
                  <select
                    value={timetableForm.day}
                    onChange={(e) => setTimetableForm({ ...timetableForm, day: e.target.value as TimetableSlot['day'] })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Target Section</label>
                  <select
                    value={timetableForm.section}
                    onChange={(e) => setTimetableForm({ ...timetableForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    {sections.filter((s) => s.is_active !== false).map((sec) => (
                      <option key={sec.id} value={sec.code}>Section {sec.code}</option>
                    ))}
                    {sections.length === 0 && (
                      <>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Start Time</label>
                  <input
                    type="time"
                    required
                    value={timetableForm.start_time}
                    onChange={(e) => setTimetableForm({ ...timetableForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">End Time</label>
                  <input
                    type="time"
                    required
                    value={timetableForm.end_time}
                    onChange={(e) => setTimetableForm({ ...timetableForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={timetableForm.subject_name}
                  onChange={(e) => setTimetableForm({ ...timetableForm, subject_name: e.target.value })}
                  placeholder="e.g. Cyber Security Principles"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Faculty Name</label>
                  <input
                    type="text"
                    required
                    value={timetableForm.faculty}
                    onChange={(e) => setTimetableForm({ ...timetableForm, faculty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Room / Hall</label>
                  <input
                    type="text"
                    required
                    value={timetableForm.room}
                    onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setTimetableModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary">
                  Save Period
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: TARGETED ANNOUNCEMENT */}
      {/* ==================================================================== */}
      {announcementModalOpen && (
        <Dialog open={announcementModalOpen} onOpenChange={setAnnouncementModalOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Broadcast Targeted Notice</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 py-2 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g. Mid-Term Lab Schedule for Cyber Security"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Target Audience</label>
                  <select
                    value={announcementForm.target_type}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, target_type: e.target.value as Announcement['target_type'] })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    <option value="all">All Students</option>
                    <option value="branch">Specific Branch</option>
                    <option value="section">Specific Section</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Category</label>
                  <select
                    value={announcementForm.category}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value as Announcement['category'] })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    <option value="General">General</option>
                    <option value="Class">Class</option>
                    <option value="Department">Department</option>
                    <option value="Exam">Exam</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Brief Summary *</label>
                <textarea
                  rows={2}
                  required
                  value={announcementForm.description}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })}
                  placeholder="1-2 sentences shown on student dashboard..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Circular Body</label>
                <textarea
                  rows={4}
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Full circular details, instructions, room assignments..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setAnnouncementModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary">
                  Broadcast Notice
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================================================================== */}
      {/* MODAL 7: REPORT STATUS MODAL */}
      {/* ==================================================================== */}
      {reportModalReport && (
        <Dialog open={!!reportModalReport} onOpenChange={() => setReportModalReport(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Review Problem Report</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
                <span className="font-semibold text-foreground">{reportModalReport.subject}</span>
                <p className="text-muted-foreground">{reportModalReport.description}</p>
                <span className="text-[10px] text-muted-foreground block pt-1">
                  Reporter: {reportModalReport.reporter_name} ({reportModalReport.reporter_email})
                </span>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Update Ticket Status</label>
                <select
                  value={reportStatusSelect}
                  onChange={(e) => setReportStatusSelect(e.target.value as ReportItem['status'])}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Administrative Notes</label>
                <textarea
                  rows={3}
                  placeholder="Notes regarding resolution or steps taken..."
                  value={reportAdminNotes}
                  onChange={(e) => setReportAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setReportModalReport(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateReportStatus} size="sm" className="bg-primary">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
