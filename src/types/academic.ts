export type UserRole = 'admin' | 'student';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface AdminUserItem {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  roll_number?: string;
  department?: string;
  branch?: string;
  academic_year?: string;
  year_of_study?: string;
  semester?: string;
  section?: string;
  class_group?: string;
  status: UserStatus;
  is_active?: boolean;
  created_at: string;
  department_id?: string;
  branch_id?: string;
  section_id?: string;
  academic_year_id?: string;
}

// ============================================================================
// ACADEMIC HIERARCHY INTERFACES (SINGLE SOURCE OF TRUTH)
// ============================================================================

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Branch {
  id: string;
  department_id: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2026–27"
  start_year: number;
  end_year: number;
  is_current: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicClass {
  id: string;
  department_id?: string | null;
  branch_id: string;
  academic_year_id?: string | null;
  name: string;
  year_of_study: string; // "1st Year", "2nd Year", "3rd Year", "4th Year"
  semester: string; // "Semester 1", "Semester 2", etc.
  code?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Section {
  id: string;
  class_id: string;
  name: string; // "Section A"
  code: string; // "A"
  capacity?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// CONFIGURABLE ROLL NUMBER PARSING INTERFACES
// ============================================================================

export interface BranchCodeMapping {
  id: string;
  code: string; // e.g. "1A", "05", "42", "CS"
  branch_id?: string | null;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RollNumberFormatConfig {
  id: string;
  name: string;
  pattern: string; // regex e.g. "^(\\d{2})([A-Z]{2})([A-Z0-9]{2})(\\d{4})$"
  year_group_index?: number;
  college_group_index?: number;
  branch_code_group_index?: number;
  roll_group_index?: number;
  century_prefix?: number;
  sample_roll?: string;
  year_digits?: number;
  college_code?: string;
  branch_code_length?: number;
  roll_digits?: number;
  description?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ParsedRollNumber {
  raw: string;
  isValid: boolean;
  joiningYear?: number;
  collegeCode?: string;
  branchCode?: string;
  numericRoll?: string;
  rollSequence?: string;
  mappedBranchId?: string;
  mappedBranchName?: string;
  branchName?: string;
  errorMessage?: string;
  formatName?: string;
}

// ============================================================================
// USER PROFILE (STUDENT & ADMIN)
// ============================================================================

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  roll_number: string;
  full_name: string;
  role: UserRole;

  // Text representation for fast rendering & backwards compatibility
  department: string;
  branch: string;
  academic_year: string;
  year_of_study: string;
  semester: string;
  section: string;
  class_group: string;

  // Relational Foreign Keys
  department_id?: string | null;
  branch_id?: string | null;
  class_id?: string | null;
  section_id?: string | null;
  academic_year_id?: string | null;

  // Parsed Roll Number Components
  joining_year?: number;
  college_code?: string;
  branch_code?: string;
  numeric_roll?: string;

  avatar_url?: string;
  is_active?: boolean;
  status?: UserStatus;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// ACADEMIC DATA ENTITIES WITH TARGETING
// ============================================================================

export interface Subject {
  id: string;
  code: string;
  name: string;
  faculty: string;
  faculty_email?: string;
  department: string;
  branch: string;
  semester: string;
  credits: number;
  syllabus?: string[];
  color?: string;
  notes_count: number;
  assignments_count: number;
  papers_count: number;

  // Relational Targeting
  department_id?: string;
  branch_id?: string;
  class_id?: string;
  section_id?: string;
  academic_year_id?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableSlot {
  id: string;
  day: DayOfWeek;
  subject_id: string;
  subject_name: string;
  faculty: string;
  start_time: string;
  end_time: string;
  room: string;
  period_type: 'Lecture' | 'Lab' | 'Tutorial';
  class_group: string;

  // Targeting
  department_id?: string;
  branch_id?: string;
  class_id?: string;
  section_id?: string;
  section?: string;
  color?: string;
}

export type AssignmentStatus = 'Pending' | 'Due Soon' | 'Submitted' | 'Completed' | 'Overdue' | 'pending';

export interface Assignment {
  id: string;
  subject_id: string;
  subject_name: string;
  title: string;
  description: string;
  due_date: string;
  status: AssignmentStatus;
  attachment_url?: string;
  attachment_name?: string;
  class_group: string;
  max_marks?: number;
  is_completed?: boolean;

  // Targeting
  department_id?: string;
  branch_id?: string;
  class_id?: string;
  section_id?: string;
  academic_year_id?: string;
  section?: string;
}

export type ResourceCategory =
  | 'Notes'
  | 'PDFs'
  | 'Lab Manuals'
  | 'Question Papers'
  | 'Study Materials'
  | 'Important Documents';

export interface AcademicResource {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  subject_id?: string;
  unit_or_topic: string;
  category: ResourceCategory;
  semester: string;
  class_group?: string;
  file_url: string;
  file_size: string;
  file_type: string;
  uploader_name: string;
  created_at: string;
  is_bookmarked?: boolean;
  exam_year?: string;
  exam_type?: string;

  // Targeting
  department_id?: string;
  branch_id?: string;
  class_id?: string;
  section_id?: string;
  academic_year_id?: string;
}

export type AnnouncementCategory = 'General' | 'Class' | 'Department' | 'Exam' | 'Urgent';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  class_group?: string;
  author: string;
  date: string;
  is_read?: boolean;

  // Targeting
  target_type?: 'all' | 'department' | 'branch' | 'class' | 'section';
  department_id?: string;
  branch_id?: string;
  class_id?: string;
  section_id?: string;
  section?: string;
}

export interface Classmate {
  id: string;
  roll_number: string;
  full_name: string;
  branch: string;
  section: string;
  class_group: string;
  academic_year: string;
  email?: string;
  is_active?: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  performed_by: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id?: string | null;
  admin_name: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export type ReportStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export interface ReportItem {
  id: string;
  user_id?: string | null;
  reporter_name: string;
  reporter_email: string;
  report_type: string;
  subject: string;
  description: string;
  status: ReportStatus;
  admin_notes?: string | null;
  created_at: string;
}

export interface RatingFeedback {
  id: string;
  user_id?: string;
  rating: number;
  feedback: string;
  category: string;
  created_at: string;
}

/**
 * Derives class group reliably from roll number and metadata
 * e.g., Roll "25ME1A4602", Branch "CSE", Section "A" -> "25CSE-A"
 */
export function deriveClassGroup(
  rollNumber: string,
  branch: string = 'CSE',
  section: string = 'A'
): string {
  const cleanRoll = rollNumber.trim().toUpperCase();
  // Check if institutional format: 25ME1A4602 -> prefix 25, code 1A
  const instMatch = cleanRoll.match(/^(\d{2})[A-Z]{2}([A-Z0-9]{2})/);
  if (instMatch) {
    const yearPrefix = instMatch[1];
    const branchCode = instMatch[2];
    return `${yearPrefix}${branchCode}-${section.toUpperCase()}`;
  }

  // Fallback prefix match: 25CS042
  const match = cleanRoll.match(/^(\d{2})([A-Z]+)/);
  if (match) {
    const yearPrefix = match[1];
    const branchCode = match[2];
    return `${yearPrefix}${branchCode}-${section.toUpperCase()}`;
  }

  // Fallback using branch prefix
  const branchShort = branch.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CSE';
  return `25${branchShort}-${section.toUpperCase()}`;
}

// ============================================================================
// DRIVE COURSE LINKS INTERFACES (CANONICAL DRIVE ID & URL)
// ============================================================================

export type CourseStatus = 'published' | 'draft' | 'archived';

export interface DriveCourse {
  id: string;
  title: string;
  description: string;
  drive_id?: string;
  drive_url: string;
  thumbnail_url?: string;
  department_id?: string;
  department?: string;
  branch_id?: string;
  branch?: string;
  academic_year_id?: string;
  academic_year?: string;
  year_of_study?: string; // e.g. "1st Year", "2nd Year", "3rd Year", "4th Year", "All"
  semester?: string; // e.g. "Semester 1", "Semester 2", "All"
  section_id?: string;
  section?: string; // e.g. "A", "B", "All"
  subject_id?: string;
  subject_name?: string;
  status: CourseStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StudentDriveCourseItem {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  department?: string;
  branch?: string;
  academic_year?: string;
  year_of_study?: string;
  semester?: string;
  section?: string;
  subject_name?: string;
  created_at: string;
}
