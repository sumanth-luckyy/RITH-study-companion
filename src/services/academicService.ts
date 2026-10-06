import { supabase } from '@/integrations/supabase/client';
import { auth, db, firebaseConfig } from '@/integrations/firebase/client';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  Subject,
  TimetableSlot,
  Assignment,
  AcademicResource,
  Announcement,
  Classmate,
  ReportItem,
  RatingFeedback,
  ActivityLog,
  AdminAuditLog,
  Department,
  Branch,
  AcademicYear,
  AcademicClass,
  Section,
  BranchCodeMapping,
  RollNumberFormatConfig,
  ParsedRollNumber,
  deriveClassGroup,
  AdminUserItem,
  UserRole,
  UserStatus,
  DriveCourse,
  StudentDriveCourseItem,
  CourseStatus,
  UserProfile,
} from '@/types/academic';
import {
  parseRollNumber,
  DEFAULT_ROLL_FORMATS,
  DEFAULT_BRANCH_CODE_MAPPINGS,
} from '@/lib/rollNumberParser';
import { parseAndNormalizeDriveUrl } from '@/lib/driveUtils';
import { saveStudentToRegistry } from '@/contexts/AuthContext';

// ============================================================================
// PERSISTENT DATABASE STORAGE MANAGER (SINGLE SOURCE OF TRUTH)
// ============================================================================

const STORAGE_KEYS = {
  DEPARTMENTS: 'study_companion_departments_v3',
  BRANCHES: 'study_companion_branches_v3',
  ACADEMIC_YEARS: 'study_companion_academic_years_v3',
  CLASSES: 'study_companion_classes_v3',
  SECTIONS: 'study_companion_sections_v3',
  BRANCH_CODES: 'study_companion_branch_codes_v3',
  ROLL_FORMATS: 'study_companion_roll_formats_v3',
  SUBJECTS: 'study_companion_subjects_v3',
  ASSIGNMENTS: 'study_companion_assignments_v3',
  TIMETABLE: 'study_companion_timetable_v3',
  ANNOUNCEMENTS: 'study_companion_announcements_v3',
  AUDIT_LOGS: 'study_companion_audit_logs_v3',
  ACTIVITY_LOGS: 'study_companion_activity_logs_v3',
  USER_DIRECTORY: 'study_companion_user_directory_v3',
  RATINGS: 'study_companion_ratings_v3',
  REPORTS_CACHE: 'study_companion_reports_cache_v3',
  DRIVE_COURSES: 'study_companion_drive_courses_v3',
};

function getStored<T>(key: string, defaultVal: T): T {
  try {
    if (typeof window === 'undefined') return defaultVal;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return defaultVal;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error persisting ${key} to storage:`, e);
  }
}

// Initial Institutional Seed Structure (Real College Topology)
const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-eng', name: 'Engineering & Technology', code: 'ENG', description: 'Faculty of Engineering and Technology', is_active: true },
  { id: 'dept-sci', name: 'Basic Sciences & Humanities', code: 'BSH', description: 'Science & Humanities', is_active: true },
  { id: 'dept-mgmt', name: 'Management Studies', code: 'MBA', description: 'Faculty of Management', is_active: true },
];

const INITIAL_BRANCHES: Branch[] = [
  { id: 'br-cse', department_id: 'dept-eng', name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science & Engineering', is_active: true },
  { id: 'br-cs', department_id: 'dept-eng', name: 'Cyber Security', code: 'CS', description: 'Department of Cyber Security', is_active: true },
  { id: 'br-ai', department_id: 'dept-eng', name: 'Artificial Intelligence & Machine Learning', code: 'AIML', description: 'Department of AI & ML', is_active: true },
  { id: 'br-ds', department_id: 'dept-eng', name: 'Data Science', code: 'DS', description: 'Department of Data Science', is_active: true },
  { id: 'br-ece', department_id: 'dept-eng', name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of ECE', is_active: true },
  { id: 'br-mech', department_id: 'dept-eng', name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering', is_active: true },
];

const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 'ay-2025', name: '2025–26', start_year: 2025, end_year: 2026, is_current: false, is_active: true },
  { id: 'ay-2026', name: '2026–27', start_year: 2026, end_year: 2027, is_current: true, is_active: true },
];

const INITIAL_CLASSES: AcademicClass[] = [
  {
    id: 'cls-cyber-1',
    department_id: 'dept-eng',
    branch_id: 'br-cs',
    academic_year_id: 'ay-2026',
    name: 'B.Tech Cyber Security (2026-27)',
    year_of_study: '1st Year',
    semester: 'Semester 1',
    code: '26CS-1',
    is_active: true,
  },
  {
    id: 'cls-cse-1',
    department_id: 'dept-eng',
    branch_id: 'br-cse',
    academic_year_id: 'ay-2026',
    name: 'B.Tech CSE (2026-27)',
    year_of_study: '1st Year',
    semester: 'Semester 1',
    code: '26CSE-1',
    is_active: true,
  },
];

const INITIAL_SECTIONS: Section[] = [
  { id: 'sec-a', class_id: 'cls-cyber-1', name: 'Section A', code: 'A', capacity: 60, is_active: true },
  { id: 'sec-b', class_id: 'cls-cyber-1', name: 'Section B', code: 'B', capacity: 60, is_active: true },
  { id: 'sec-c', class_id: 'cls-cyber-1', name: 'Section C', code: 'C', capacity: 60, is_active: true },
];

const INITIAL_BRANCH_CODES: BranchCodeMapping[] = [
  { id: 'bc-1', code: '1A', name: 'Cyber Security (College Code)', branch_id: 'br-cs', is_active: true },
  { id: 'bc-2', code: '05', name: 'Computer Science & Engineering', branch_id: 'br-cse', is_active: true },
  { id: 'bc-3', code: '46', name: 'Cyber Security', branch_id: 'br-cs', is_active: true },
  { id: 'bc-4', code: '04', name: 'Electronics & Communication', branch_id: 'br-ece', is_active: true },
  { id: 'bc-5', code: '42', name: 'Artificial Intelligence & Machine Learning', branch_id: 'br-ai', is_active: true },
];

const INITIAL_USERS: AdminUserItem[] = [
  {
    id: 'admin-sumanth-primary',
    user_id: 'admin-sumanth-primary',
    email: 'sumanth.akkivarapu@gmail.com',
    full_name: 'Sumanth (Administrator)',
    role: 'admin',
    department: 'Engineering & Technology',
    branch: 'Computer Science & Engineering',
    year_of_study: 'Staff',
    status: 'active',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'student-demo-sumanth',
    user_id: 'student-demo-sumanth',
    email: 'student@example.com',
    full_name: 'Sumanth',
    role: 'student',
    roll_number: '25ME1A4602',
    department: 'Engineering & Technology',
    branch: 'Cyber Security',
    academic_year: '2026–27',
    year_of_study: '1st Year',
    semester: 'Semester 1',
    section: 'A',
    class_group: '25CS-A',
    status: 'active',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Helper to generate consistent unique UUID
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// ============================================================================
// ACADEMIC SERVICE IMPLEMENTATION
// ============================================================================

export const academicService = {
  // ==========================================================================
  // REAL-TIME ACADEMIC HIERARCHY SINGLE SOURCE OF TRUTH & EVENT DISPATCH
  // ==========================================================================
  notifyHierarchyChange(entityType?: string, entityId?: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('academic-hierarchy-updated', {
          detail: { entity: entityType, id: entityId, timestamp: Date.now() },
        })
      );
    }
  },

  async getAcademicHierarchySnapshot(includeInactive: boolean = true): Promise<{
    departments: Department[];
    branches: Branch[];
    academicYears: AcademicYear[];
    classes: AcademicClass[];
    sections: Section[];
    branchCodes: BranchCodeMapping[];
  }> {
    const [departments, branches, academicYears, classes, sections, branchCodes] = await Promise.all([
      this.getDepartments(),
      this.getBranches(),
      this.getAcademicYears(),
      this.getClasses(),
      this.getSections(),
      this.getBranchCodes(),
    ]);

    if (!includeInactive) {
      return {
        departments: departments.filter((d) => d.is_active !== false),
        branches: branches.filter((b) => b.is_active !== false),
        academicYears: academicYears.filter((ay) => ay.is_active !== false),
        classes: classes.filter((c) => c.is_active !== false),
        sections: sections.filter((s) => s.is_active !== false),
        branchCodes: branchCodes.filter((bc) => bc.is_active !== false),
      };
    }

    return { departments, branches, academicYears, classes, sections, branchCodes };
  },

  // ==========================================================================
  // DEPARTMENTS CRUD
  // ==========================================================================
  async getDepartments(onlyActive: boolean = false): Promise<Department[]> {
    const list = getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    return onlyActive ? list.filter((d) => d.is_active !== false) : list;
  },

  async createDepartment(dept: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const list = await this.getDepartments();
    const newDept: Department = {
      id: generateId('dept'),
      name: dept.name.trim(),
      code: dept.code.trim().toUpperCase(),
      description: dept.description?.trim(),
      is_active: dept.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newDept);
    setStored(STORAGE_KEYS.DEPARTMENTS, list);
    await this.logAdminAudit('Admin', 'Create Department', 'departments', newDept.id, { name: newDept.name, code: newDept.code });
    this.notifyHierarchyChange('departments', newDept.id);
    return newDept;
  },

  async updateDepartment(id: string, updates: Partial<Department>): Promise<boolean> {
    const list = await this.getDepartments();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.DEPARTMENTS, list);
    await this.logAdminAudit('Admin', 'Update Department', 'departments', id, updates);
    this.notifyHierarchyChange('departments', id);
    return true;
  },

  async deleteDepartment(id: string): Promise<boolean> {
    const list = await this.getDepartments();
    const filtered = list.filter((d) => d.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.DEPARTMENTS, filtered);
    await this.logAdminAudit('Admin', 'Delete Department', 'departments', id);
    this.notifyHierarchyChange('departments', id);
    return true;
  },

  // ==========================================================================
  // BRANCHES CRUD
  // ==========================================================================
  async getBranches(departmentId?: string, onlyActive: boolean = false): Promise<Branch[]> {
    let list = getStored<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    if (departmentId && departmentId !== 'All') {
      list = list.filter((b) => b.department_id === departmentId);
    }
    return onlyActive ? list.filter((b) => b.is_active !== false) : list;
  },

  async createBranch(branch: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<Branch> {
    const list = getStored<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    const newBranch: Branch = {
      id: generateId('br'),
      department_id: branch.department_id,
      name: branch.name.trim(),
      code: branch.code.trim().toUpperCase(),
      description: branch.description?.trim(),
      is_active: branch.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newBranch);
    setStored(STORAGE_KEYS.BRANCHES, list);
    await this.logAdminAudit('Admin', 'Create Branch', 'branches', newBranch.id, { name: newBranch.name, code: newBranch.code });
    this.notifyHierarchyChange('branches', newBranch.id);
    return newBranch;
  },

  async updateBranch(id: string, updates: Partial<Branch>): Promise<boolean> {
    const list = getStored<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.BRANCHES, list);
    await this.logAdminAudit('Admin', 'Update Branch', 'branches', id, updates);
    this.notifyHierarchyChange('branches', id);
    return true;
  },

  async deleteBranch(id: string): Promise<boolean> {
    const list = getStored<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    const filtered = list.filter((b) => b.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.BRANCHES, filtered);
    await this.logAdminAudit('Admin', 'Delete Branch', 'branches', id);
    this.notifyHierarchyChange('branches', id);
    return true;
  },

  // ==========================================================================
  // ACADEMIC YEARS CRUD
  // ==========================================================================
  async getAcademicYears(): Promise<AcademicYear[]> {
    return getStored<AcademicYear[]>(STORAGE_KEYS.ACADEMIC_YEARS, INITIAL_ACADEMIC_YEARS);
  },

  async createAcademicYear(year: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>): Promise<AcademicYear> {
    const list = await this.getAcademicYears();
    if (year.is_current) {
      list.forEach((y) => (y.is_current = false));
    }
    const newYear: AcademicYear = {
      id: generateId('ay'),
      name: year.name.trim(),
      start_year: Number(year.start_year),
      end_year: Number(year.end_year),
      is_current: year.is_current || false,
      is_active: year.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newYear);
    setStored(STORAGE_KEYS.ACADEMIC_YEARS, list);
    await this.logAdminAudit('Admin', 'Create Academic Year', 'academic_years', newYear.id, { name: newYear.name });
    this.notifyHierarchyChange('academic_years', newYear.id);
    return newYear;
  },

  async updateAcademicYear(id: string, updates: Partial<AcademicYear>): Promise<boolean> {
    const list = await this.getAcademicYears();
    const idx = list.findIndex((y) => y.id === id);
    if (idx === -1) return false;
    if (updates.is_current) {
      list.forEach((y) => (y.is_current = false));
    }
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.ACADEMIC_YEARS, list);
    await this.logAdminAudit('Admin', 'Update Academic Year', 'academic_years', id, updates);
    this.notifyHierarchyChange('academic_years', id);
    return true;
  },

  async deleteAcademicYear(id: string): Promise<boolean> {
    const list = await this.getAcademicYears();
    const filtered = list.filter((y) => y.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.ACADEMIC_YEARS, filtered);
    await this.logAdminAudit('Admin', 'Delete Academic Year', 'academic_years', id);
    this.notifyHierarchyChange('academic_years', id);
    return true;
  },

  // ==========================================================================
  // CLASSES CRUD
  // ==========================================================================
  async getClasses(branchId?: string, academicYearId?: string): Promise<AcademicClass[]> {
    let list = getStored<AcademicClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    if (branchId && branchId !== 'All') {
      list = list.filter((c) => c.branch_id === branchId);
    }
    if (academicYearId && academicYearId !== 'All') {
      list = list.filter((c) => c.academic_year_id === academicYearId);
    }
    return list;
  },

  async createClass(cls: Omit<AcademicClass, 'id' | 'created_at' | 'updated_at'>): Promise<AcademicClass> {
    const list = getStored<AcademicClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const newClass: AcademicClass = {
      id: generateId('cls'),
      name: cls.name.trim(),
      code: cls.code?.trim().toUpperCase() || '',
      department_id: cls.department_id,
      branch_id: cls.branch_id,
      academic_year_id: cls.academic_year_id,
      year_of_study: cls.year_of_study,
      semester: cls.semester,
      is_active: cls.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newClass);
    setStored(STORAGE_KEYS.CLASSES, list);
    await this.logAdminAudit('Admin', 'Create Academic Class', 'classes', newClass.id, { name: newClass.name, code: newClass.code });
    this.notifyHierarchyChange('classes', newClass.id);
    return newClass;
  },

  async updateClass(id: string, updates: Partial<AcademicClass>): Promise<boolean> {
    const list = getStored<AcademicClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.CLASSES, list);
    await this.logAdminAudit('Admin', 'Update Academic Class', 'classes', id, updates);
    this.notifyHierarchyChange('classes', id);
    return true;
  },

  async deleteClass(id: string): Promise<boolean> {
    const list = getStored<AcademicClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.CLASSES, filtered);
    await this.logAdminAudit('Admin', 'Delete Academic Class', 'classes', id);
    this.notifyHierarchyChange('classes', id);
    return true;
  },

  // ==========================================================================
  // SECTIONS CRUD
  // ==========================================================================
  async getSections(classId?: string): Promise<Section[]> {
    const list = getStored<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    if (classId && classId !== 'All') {
      return list.filter((s) => s.class_id === classId);
    }
    return list;
  },

  async createSection(sec: Omit<Section, 'id' | 'created_at' | 'updated_at'>): Promise<Section> {
    const list = getStored<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    const newSec: Section = {
      id: generateId('sec'),
      class_id: sec.class_id,
      name: sec.name.trim(),
      code: sec.code.trim().toUpperCase(),
      capacity: Number(sec.capacity) || 60,
      is_active: sec.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newSec);
    setStored(STORAGE_KEYS.SECTIONS, list);
    await this.logAdminAudit('Admin', 'Create Section', 'sections', newSec.id, { name: newSec.name, code: newSec.code });
    this.notifyHierarchyChange('sections', newSec.id);
    return newSec;
  },

  async updateSection(id: string, updates: Partial<Section>): Promise<boolean> {
    const list = getStored<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.SECTIONS, list);
    await this.logAdminAudit('Admin', 'Update Section', 'sections', id, updates);
    this.notifyHierarchyChange('sections', id);
    return true;
  },

  async deleteSection(id: string): Promise<boolean> {
    const list = getStored<Section[]>(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.SECTIONS, filtered);
    await this.logAdminAudit('Admin', 'Delete Section', 'sections', id);
    this.notifyHierarchyChange('sections', id);
    return true;
  },

  // ==========================================================================
  // BRANCH CODES MAPPING CRUD
  // ==========================================================================
  async getBranchCodes(): Promise<BranchCodeMapping[]> {
    return getStored<BranchCodeMapping[]>(STORAGE_KEYS.BRANCH_CODES, INITIAL_BRANCH_CODES);
  },

  async createBranchCode(bc: Omit<BranchCodeMapping, 'id' | 'created_at' | 'updated_at'>): Promise<BranchCodeMapping> {
    const list = await this.getBranchCodes();
    const newBc: BranchCodeMapping = {
      id: generateId('bc'),
      code: bc.code.trim().toUpperCase(),
      name: bc.name.trim(),
      branch_id: bc.branch_id,
      description: bc.description?.trim(),
      is_active: bc.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newBc);
    setStored(STORAGE_KEYS.BRANCH_CODES, list);
    await this.logAdminAudit('Admin', 'Create Branch Code Mapping', 'branch_codes', newBc.id, { code: newBc.code, name: newBc.name });
    this.notifyHierarchyChange('branch_codes', newBc.id);
    return newBc;
  },

  async updateBranchCode(id: string, updates: Partial<BranchCodeMapping>): Promise<boolean> {
    const list = await this.getBranchCodes();
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.BRANCH_CODES, list);
    await this.logAdminAudit('Admin', 'Update Branch Code Mapping', 'branch_codes', id, updates);
    this.notifyHierarchyChange('branch_codes', id);
    return true;
  },

  async deleteBranchCode(id: string): Promise<boolean> {
    const list = await this.getBranchCodes();
    const filtered = list.filter((b) => b.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.BRANCH_CODES, filtered);
    await this.logAdminAudit('Admin', 'Delete Branch Code Mapping', 'branch_codes', id);
    this.notifyHierarchyChange('branch_codes', id);
    return true;
  },

  // ==========================================================================
  // ROLL FORMATS & ROLL NUMBER PARSER
  // ==========================================================================
  async getRollFormats(): Promise<RollNumberFormatConfig[]> {
    return getStored<RollNumberFormatConfig[]>(STORAGE_KEYS.ROLL_FORMATS, DEFAULT_ROLL_FORMATS);
  },

  async createRollFormat(fmt: Omit<RollNumberFormatConfig, 'id' | 'created_at' | 'updated_at'>): Promise<RollNumberFormatConfig> {
    const list = await this.getRollFormats();
    const newFmt: RollNumberFormatConfig = {
      id: generateId('rf'),
      name: fmt.name.trim(),
      pattern: fmt.pattern.trim(),
      description: fmt.description?.trim(),
      year_digits: fmt.year_digits || 2,
      college_code: fmt.college_code?.trim(),
      branch_code_length: fmt.branch_code_length || 2,
      roll_digits: fmt.roll_digits || 4,
      is_default: fmt.is_default || false,
      is_active: fmt.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newFmt);
    setStored(STORAGE_KEYS.ROLL_FORMATS, list);
    await this.logAdminAudit('Admin', 'Create Roll Number Format', 'roll_number_formats', newFmt.id, { name: newFmt.name });
    return newFmt;
  },

  async updateRollFormat(id: string, updates: Partial<RollNumberFormatConfig>): Promise<boolean> {
    const list = await this.getRollFormats();
    const idx = list.findIndex((f) => f.id === id);
    if (idx === -1) return false;
    if (updates.is_default) {
      list.forEach((f) => (f.is_default = false));
    }
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.ROLL_FORMATS, list);
    await this.logAdminAudit('Admin', 'Update Roll Number Format', 'roll_number_formats', id, updates);
    return true;
  },

  async parseStudentRoll(rollNumber: string): Promise<ParsedRollNumber> {
    const [formats, branchCodes, branches] = await Promise.all([
      this.getRollFormats(),
      this.getBranchCodes(),
      this.getBranches(),
    ]);
    return parseRollNumber(rollNumber, formats, branchCodes, branches);
  },

  // ==========================================================================
  // SUBJECTS CRUD
  // ==========================================================================
  async getSubjects(semester?: string, branch?: string): Promise<Subject[]> {
    let list = getStored<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    if (semester && semester !== 'All') {
      list = list.filter((s) => s.semester === semester);
    }
    if (branch && branch !== 'All') {
      list = list.filter((s) => s.branch === branch);
    }
    return list;
  },

  async getSubjectById(id: string): Promise<Subject | null> {
    const list = await this.getSubjects();
    return list.find((s) => s.id === id) || null;
  },

  async createSubject(subject: Omit<Subject, 'id' | 'notes_count' | 'assignments_count' | 'papers_count'>): Promise<Subject> {
    const list = getStored<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    const newSubject: Subject = {
      id: generateId('sbj'),
      code: subject.code.trim().toUpperCase(),
      name: subject.name.trim(),
      faculty: subject.faculty.trim(),
      faculty_email: subject.faculty_email?.trim(),
      department: subject.department,
      branch: subject.branch,
      semester: subject.semester,
      credits: Number(subject.credits) || 3,
      syllabus: subject.syllabus || [],
      color: subject.color || 'hsl(217, 91%, 60%)',
      notes_count: 0,
      assignments_count: 0,
      papers_count: 0,
      department_id: subject.department_id,
      branch_id: subject.branch_id,
    };
    list.push(newSubject);
    setStored(STORAGE_KEYS.SUBJECTS, list);
    await this.logAdminAudit('Admin', 'Create Subject', 'subjects', newSubject.id, { name: newSubject.name, code: newSubject.code });
    return newSubject;
  },

  async updateSubject(id: string, updates: Partial<Subject>): Promise<boolean> {
    const list = getStored<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    setStored(STORAGE_KEYS.SUBJECTS, list);
    await this.logAdminAudit('Admin', 'Update Subject', 'subjects', id, updates);
    return true;
  },

  async deleteSubject(id: string): Promise<boolean> {
    const list = getStored<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.SUBJECTS, filtered);
    await this.logAdminAudit('Admin', 'Delete Subject', 'subjects', id);
    return true;
  },

  // ==========================================================================
  // TIMETABLE CRUD
  // ==========================================================================
  async getTimetable(
    classGroup?: string,
    filters?: {
      department_id?: string;
      branch_id?: string;
      section_id?: string;
      section?: string;
    }
  ): Promise<TimetableSlot[]> {
    let list = getStored<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []);
    if (classGroup && classGroup !== 'All') {
      list = list.filter((t) => !t.class_group || t.class_group === classGroup || t.class_group === 'All');
    }
    if (filters?.section && filters.section !== 'All') {
      list = list.filter((t) => !t.section || t.section === filters.section);
    }
    return list;
  },

  async createTimetableSlot(slot: Omit<TimetableSlot, 'id'>): Promise<TimetableSlot> {
    const list = getStored<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []);
    const newSlot: TimetableSlot = {
      id: generateId('tt'),
      day: slot.day,
      start_time: slot.start_time,
      end_time: slot.end_time,
      subject_id: slot.subject_id || '',
      subject_name: slot.subject_name,
      faculty: slot.faculty,
      room: slot.room,
      class_group: slot.class_group || 'All',
      color: slot.color || 'hsl(217, 91%, 60%)',
      department_id: slot.department_id,
      branch_id: slot.branch_id,
      section_id: slot.section_id,
      section: slot.section,
    };
    list.push(newSlot);
    setStored(STORAGE_KEYS.TIMETABLE, list);
    await this.logAdminAudit('Admin', 'Create Timetable Period', 'timetable', newSlot.id, { subject: newSlot.subject_name, day: newSlot.day, time: newSlot.start_time });
    return newSlot;
  },

  async updateTimetableSlot(id: string, updates: Partial<TimetableSlot>): Promise<boolean> {
    const list = getStored<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []);
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    setStored(STORAGE_KEYS.TIMETABLE, list);
    await this.logAdminAudit('Admin', 'Update Timetable Period', 'timetable', id, updates);
    return true;
  },

  async deleteTimetableSlot(id: string): Promise<boolean> {
    const list = getStored<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []);
    const filtered = list.filter((t) => t.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.TIMETABLE, filtered);
    await this.logAdminAudit('Admin', 'Delete Timetable Period', 'timetable', id);
    return true;
  },

  // ==========================================================================
  // ASSIGNMENTS CRUD
  // ==========================================================================
  async getAssignments(
    classGroup?: string,
    filters?: {
      department_id?: string;
      branch_id?: string;
      section_id?: string;
      section?: string;
    }
  ): Promise<Assignment[]> {
    let list = getStored<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    if (classGroup && classGroup !== 'All') {
      list = list.filter((a) => !a.class_group || a.class_group === classGroup || a.class_group === 'All');
    }
    if (filters?.section && filters.section !== 'All') {
      list = list.filter((a) => !a.section || a.section === filters.section);
    }
    return list;
  },

  async createAssignment(assignment: Omit<Assignment, 'id' | 'status'> & { status?: AssignmentStatus }): Promise<Assignment> {
    const list = getStored<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const newAsg: Assignment = {
      id: generateId('asg'),
      title: assignment.title.trim(),
      description: assignment.description.trim(),
      subject_id: assignment.subject_id || '',
      subject_name: assignment.subject_name,
      due_date: assignment.due_date,
      max_marks: Number(assignment.max_marks) || 25,
      class_group: assignment.class_group || 'All',
      status: assignment.status || 'Pending',
      is_completed: false,
      branch_id: assignment.branch_id,
      section_id: assignment.section_id,
      section: assignment.section,
    };
    list.push(newAsg);
    setStored(STORAGE_KEYS.ASSIGNMENTS, list);
    await this.logAdminAudit('Admin', 'Create Assignment', 'assignments', newAsg.id, { title: newAsg.title, class_group: newAsg.class_group });
    return newAsg;
  },

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<boolean> {
    const list = getStored<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    setStored(STORAGE_KEYS.ASSIGNMENTS, list);
    await this.logAdminAudit('Admin', 'Update Assignment', 'assignments', id, updates);
    return true;
  },

  async deleteAssignment(id: string): Promise<boolean> {
    const list = getStored<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const filtered = list.filter((a) => a.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.ASSIGNMENTS, filtered);
    await this.logAdminAudit('Admin', 'Delete Assignment', 'assignments', id);
    return true;
  },

  async toggleAssignmentSubmission(assignmentId: string, currentStatus: string, userId?: string): Promise<boolean> {
    const key = `user_assignment_submissions_${userId || 'current'}`;
    const map = getStored<Record<string, { status: string; marks?: number }>>(key, {});
    const newStatus = currentStatus === 'submitted' ? 'pending' : 'submitted';
    map[assignmentId] = { status: newStatus };
    setStored(key, map);
    return true;
  },

  // ==========================================================================
  // ANNOUNCEMENTS CRUD
  // ==========================================================================
  async getAnnouncements(
    classGroup?: string,
    filters?: {
      department_id?: string;
      branch_id?: string;
      section_id?: string;
      section?: string;
    }
  ): Promise<Announcement[]> {
    let list = getStored<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    if (classGroup && classGroup !== 'All') {
      list = list.filter((a) => !a.class_group || a.class_group === classGroup || a.class_group === 'All');
    }
    if (filters?.section && filters.section !== 'All') {
      list = list.filter((a) => !a.section || a.section === filters.section);
    }
    return list;
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'date' | 'is_read'>): Promise<Announcement> {
    const list = getStored<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const newAnn: Announcement = {
      id: generateId('ann'),
      title: announcement.title.trim(),
      description: announcement.description.trim(),
      content: announcement.content?.trim(),
      category: announcement.category || 'General',
      priority: announcement.priority || 'normal',
      class_group: announcement.class_group || 'All',
      author: announcement.author || 'Academic Office',
      date: new Date().toISOString(),
      is_read: false,
      target_type: announcement.target_type || 'all',
      department_id: announcement.department_id,
      branch_id: announcement.branch_id,
      section_id: announcement.section_id,
      section: announcement.section,
    };
    list.push(newAnn);
    setStored(STORAGE_KEYS.ANNOUNCEMENTS, list);
    await this.logAdminAudit('Admin', 'Publish Announcement', 'announcements', newAnn.id, { title: newAnn.title, category: newAnn.category });
    return newAnn;
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    const list = getStored<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const filtered = list.filter((a) => a.id !== id);
    if (filtered.length === list.length) return false;
    setStored(STORAGE_KEYS.ANNOUNCEMENTS, filtered);
    await this.logAdminAudit('Admin', 'Delete Announcement', 'announcements', id);
    return true;
  },

  async markAnnouncementRead(id: string, userId?: string): Promise<void> {
    if (!userId) return;
    const readsKey = `announcement_reads_${userId}`;
    const reads = getStored<string[]>(readsKey, []);
    if (!reads.includes(id)) {
      reads.push(id);
      setStored(readsKey, reads);
    }
  },

  // ==========================================================================
  // RESOURCES & SUPABASE STORAGE INTEGRATION
  // ==========================================================================
  async getResources(category?: string, semester?: string): Promise<AcademicResource[]> {
    let dbResources: AcademicResource[] = [];
    try {
      let query = supabase.from('pdfs').select('*').order('created_at', { ascending: false });
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      if (semester && semester !== 'All') {
        query = query.eq('semester', semester);
      }
      const { data, error } = await query;
      if (!error && data) {
        dbResources = data.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description || null,
          subject: d.subject_name || 'General',
          unit_or_topic: d.unit_or_topic || 'General Topic',
          category: (d.category as AcademicResource['category']) || 'Notes',
          semester: d.semester || 'Semester 1',
          class_group: d.class_group || 'All',
          file_url: d.file_url,
          file_size: d.file_size || '1.2 MB',
          file_type: d.file_type || 'PDF',
          uploader_name: d.uploader_name || 'Faculty',
          created_at: d.created_at,
          is_bookmarked: false,
          exam_year: d.exam_year || undefined,
          exam_type: d.exam_type || undefined,
        }));
      }
    } catch {
      // Fallback
    }

    const localResources = getStored<AcademicResource[]>('study_companion_local_resources_v3', []);
    const combined = [...dbResources];
    for (const lr of localResources) {
      if (!combined.some((r) => r.id === lr.id)) {
        combined.push(lr);
      }
    }

    let final = combined;
    if (category && category !== 'All') {
      final = final.filter((r) => r.category === category);
    }
    if (semester && semester !== 'All') {
      final = final.filter((r) => r.semester === semester);
    }

    return final;
  },

  async uploadResource(
    file: File,
    metadata: {
      title: string;
      description?: string;
      subject: string;
      unit_or_topic?: string;
      category: AcademicResource['category'];
      semester: string;
      class_group?: string;
      exam_year?: string;
      exam_type?: string;
      department_id?: string;
      branch_id?: string;
      section_id?: string;
    },
    uploaderName: string = 'Admin'
  ): Promise<AcademicResource> {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    let publicUrl = '';
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('academic-documents')
        .upload(`uploads/${cleanFileName}`, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('academic-documents')
          .getPublicUrl(uploadData.path);
        publicUrl = urlData?.publicUrl || '';
      }
    } catch (e) {
      console.warn('Storage upload warning:', e);
    }

    if (!publicUrl) {
      publicUrl = URL.createObjectURL(file);
    }

    let recordId = generateId('res');
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('pdfs')
        .insert({
          title: metadata.title.trim(),
          description: metadata.description?.trim() || null,
          subject_name: metadata.subject,
          unit_or_topic: metadata.unit_or_topic || 'General Topic',
          category: metadata.category,
          semester: metadata.semester || 'Semester 1',
          class_group: metadata.class_group || 'All',
          file_url: publicUrl,
          file_size: `${sizeInMB} MB`,
          file_type: ext,
          uploader_name: uploaderName,
          exam_year: metadata.exam_year || null,
          exam_type: metadata.exam_type || null,
          department_id: metadata.department_id || null,
          branch_id: metadata.branch_id || null,
          section_id: metadata.section_id || null,
        })
        .select()
        .single();

      if (!dbError && dbData) {
        recordId = (dbData as { id: string }).id;
      }
    } catch {
      // Supabase insert fallback
    }

    const newResource: AcademicResource = {
      id: recordId,
      title: metadata.title.trim(),
      description: metadata.description?.trim() || null,
      subject: metadata.subject,
      unit_or_topic: metadata.unit_or_topic || 'General Topic',
      category: metadata.category,
      semester: metadata.semester || 'Semester 1',
      class_group: metadata.class_group || 'All',
      file_url: publicUrl,
      file_size: `${sizeInMB} MB`,
      file_type: ext,
      uploader_name: uploaderName,
      created_at: new Date().toISOString(),
      is_bookmarked: false,
      exam_year: metadata.exam_year,
      exam_type: metadata.exam_type,
      department_id: metadata.department_id,
      branch_id: metadata.branch_id,
      section_id: metadata.section_id,
    };

    const local = getStored<AcademicResource[]>('study_companion_local_resources_v3', []);
    local.unshift(newResource);
    setStored('study_companion_local_resources_v3', local);

    await this.logAdminAudit(uploaderName, 'Upload Resource', 'pdfs', newResource.id, {
      title: newResource.title,
      category: newResource.category,
    });

    return newResource;
  },

  async deleteResource(id: string): Promise<boolean> {
    try {
      await supabase.from('pdfs').delete().eq('id', id);
    } catch {
      // ignore
    }
    const local = getStored<AcademicResource[]>('study_companion_local_resources_v3', []);
    setStored('study_companion_local_resources_v3', local.filter((r) => r.id !== id));
    await this.logAdminAudit('Admin', 'Delete Resource', 'pdfs', id);
    return true;
  },

  async toggleBookmark(resourceId: string, userId?: string, currentlyBookmarked?: boolean): Promise<boolean> {
    if (!userId) return false;
    const key = `user_bookmarks_${userId}`;
    const set = new Set(getStored<string[]>(key, []));
    let next = !currentlyBookmarked;
    if (set.has(resourceId)) {
      set.delete(resourceId);
      next = false;
    } else {
      set.add(resourceId);
      next = true;
    }
    setStored(key, Array.from(set));
    return next;
  },

  // ==========================================================================
  // USER MANAGEMENT & SECURE ACCOUNT PROVISIONING
  // ==========================================================================

  async getUsers(params: {
    search?: string;
    role?: string;
    department?: string;
    branch?: string;
    academic_year?: string;
    year?: string;
    semester?: string;
    section?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{
    users: AdminUserItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let list = getStored<AdminUserItem[]>(STORAGE_KEYS.USER_DIRECTORY, INITIAL_USERS);

    if (params.role && params.role !== 'all') {
      list = list.filter((u) => u.role === params.role);
    }
    if (params.status && params.status !== 'all') {
      list = list.filter((u) => (u.status || 'active') === params.status);
    }
    if (params.department && params.department !== 'all') {
      list = list.filter((u) => u.department?.toLowerCase().includes(params.department!.toLowerCase()));
    }
    if (params.branch && params.branch !== 'all') {
      list = list.filter((u) => u.branch?.toLowerCase().includes(params.branch!.toLowerCase()));
    }
    if (params.year && params.year !== 'all') {
      list = list.filter((u) => u.year_of_study?.toLowerCase().includes(params.year!.toLowerCase()));
    }
    if (params.section && params.section !== 'all') {
      list = list.filter((u) => u.section?.toUpperCase() === params.section!.toUpperCase());
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.roll_number && u.roll_number.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const pageSize = params.pageSize || 12;
    const page = params.page || 1;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const paginated = list.slice(offset, offset + pageSize);

    return { users: paginated, total, page, pageSize, totalPages };
  },

  async createUser(userData: {
    email: string;
    full_name: string;
    role: UserRole;
    password?: string;
    roll_number?: string;
    department?: string;
    branch?: string;
    academic_year?: string;
    year_of_study?: string;
    semester?: string;
    section?: string;
    class_group?: string;
    status?: UserStatus;
  }): Promise<{ success: boolean; user?: AdminUserItem; error?: string }> {
    const email = userData.email.trim().toLowerCase();
    const fullName = userData.full_name.trim();
    const role = userData.role || 'student';
    const rollNumber = userData.roll_number ? userData.roll_number.trim().toUpperCase() : (role === 'admin' ? `ADMIN-${Date.now().toString().slice(-4)}` : '');
    const branch = userData.branch || 'Cyber Security';
    const section = userData.section || 'A';
    const classGroup = userData.class_group || deriveClassGroup(rollNumber, branch, section);
    const initialStatus = userData.status || 'active';

    const existing = getStored<AdminUserItem[]>(STORAGE_KEYS.USER_DIRECTORY, INITIAL_USERS);
    if (existing.some((u) => u.email.toLowerCase() === email)) {
      return { success: false, error: `An account with email ${email} already exists.` };
    }
    if (role === 'student' && rollNumber && existing.some((u) => u.roll_number?.toUpperCase() === rollNumber)) {
      return { success: false, error: `Roll number ${rollNumber} is already enrolled.` };
    }

    const password = userData.password || (role === 'student' ? rollNumber : `StudyAdmin@${Date.now().toString().slice(-4)}`);
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    let createdUid = generateId('usr');

    try {
      const secAppName = `sec_auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const secApp = initializeApp(firebaseConfig, secAppName);
      const secAuth = getAuth(secApp);

      const cred = await createUserWithEmailAndPassword(secAuth, email, password);
      createdUid = cred.user.uid;

      await deleteApp(secApp);
    } catch (authErr: unknown) {
      const msg = (authErr as Error)?.message || '';
      if (msg.includes('email-already-in-use')) {
        return { success: false, error: 'An account with this email already exists in Firebase Authentication.' };
      }
      console.warn('Firebase user provisioning warning:', msg);
    }

    try {
      await setDoc(doc(db, 'users', createdUid), {
        email,
        full_name: fullName,
        roll_number: rollNumber,
        department: userData.department || 'Engineering & Technology',
        branch,
        academic_year: userData.academic_year || '2026–27',
        year_of_study: userData.year_of_study || (role === 'admin' ? 'Staff' : '1st Year'),
        section,
        semester: userData.semester || 'Semester 1',
        class_group: classGroup,
        role,
        status: initialStatus,
        is_active: initialStatus === 'active',
        created_at: new Date().toISOString(),
      });
    } catch (fsErr) {
      console.warn('Firestore setDoc warning:', fsErr);
    }

    if (role === 'student' && rollNumber) {
      saveStudentToRegistry(rollNumber, email);
    }

    const newUser: AdminUserItem = {
      id: createdUid,
      user_id: createdUid,
      email,
      full_name: fullName,
      role,
      roll_number: rollNumber,
      department: userData.department || 'Engineering & Technology',
      branch,
      academic_year: userData.academic_year || '2026–27',
      year_of_study: userData.year_of_study || (role === 'admin' ? 'Staff' : '1st Year'),
      semester: userData.semester || 'Semester 1',
      section,
      class_group: classGroup,
      status: initialStatus,
      is_active: initialStatus === 'active',
      created_at: new Date().toISOString(),
    };

    existing.unshift(newUser);
    setStored(STORAGE_KEYS.USER_DIRECTORY, existing);

    await this.logAdminAudit('Admin', `Create ${role === 'admin' ? 'Administrator' : 'Student'} User`, 'users', createdUid, {
      email,
      role,
      roll_number: rollNumber,
    });

    return { success: true, user: newUser };
  },

  async setUserStatus(userId: string, newStatus: UserStatus, currentAdminId?: string): Promise<{ success: boolean; error?: string }> {
    if (currentAdminId && userId === currentAdminId && newStatus !== 'active') {
      return { success: false, error: 'You cannot deactivate or suspend your own administrator account.' };
    }

    const list = getStored<AdminUserItem[]>(STORAGE_KEYS.USER_DIRECTORY, INITIAL_USERS);
    const target = list.find((u) => u.user_id === userId);

    if (target?.role === 'admin' && newStatus !== 'active') {
      const activeAdmins = list.filter((u) => u.role === 'admin' && u.status === 'active' && u.user_id !== userId);
      if (activeAdmins.length < 1) {
        return { success: false, error: 'At least one active administrator must remain.' };
      }
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        is_active: newStatus === 'active',
        updated_at: new Date().toISOString(),
      });
    } catch {
      // ignore
    }

    const idx = list.findIndex((u) => u.user_id === userId);
    if (idx !== -1) {
      list[idx].status = newStatus;
      list[idx].is_active = newStatus === 'active';
      setStored(STORAGE_KEYS.USER_DIRECTORY, list);
    }

    await this.logAdminAudit('Admin', `Set User Status to ${newStatus}`, 'users', userId, { newStatus });
    return { success: true };
  },

  async deleteUser(userId: string, currentAdminId?: string): Promise<{ success: boolean; error?: string }> {
    if (currentAdminId && userId === currentAdminId) {
      return { success: false, error: 'You cannot delete your own account.' };
    }

    const list = getStored<AdminUserItem[]>(STORAGE_KEYS.USER_DIRECTORY, INITIAL_USERS);
    const target = list.find((u) => u.user_id === userId);

    if (target?.role === 'admin') {
      const activeAdmins = list.filter((u) => u.role === 'admin' && u.status === 'active' && u.user_id !== userId);
      if (activeAdmins.length < 1) {
        return { success: false, error: 'At least one active administrator must remain.' };
      }
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch {
      // ignore
    }

    const filtered = list.filter((u) => u.user_id !== userId);
    setStored(STORAGE_KEYS.USER_DIRECTORY, filtered);

    await this.logAdminAudit('Admin', 'Delete User', 'users', userId, { email: target?.email, role: target?.role });
    return { success: true };
  },

  async updateUser(userId: string, updates: Partial<AdminUserItem>, currentAdminId?: string): Promise<{ success: boolean; error?: string }> {
    const list = getStored<AdminUserItem[]>(STORAGE_KEYS.USER_DIRECTORY, INITIAL_USERS);
    const idx = list.findIndex((u) => u.user_id === userId);
    if (idx === -1) return { success: false, error: 'User not found.' };

    if (updates.role && updates.role !== 'admin' && list[idx].role === 'admin') {
      if (currentAdminId && userId === currentAdminId) {
        return { success: false, error: 'You cannot modify your own administrator role.' };
      }
      const activeAdmins = list.filter((u) => u.role === 'admin' && u.status === 'active' && u.user_id !== userId);
      if (activeAdmins.length < 1) {
        return { success: false, error: 'At least one active administrator must remain.' };
      }
    }

    const payload = { ...updates };
    if (updates.status) {
      payload.is_active = updates.status === 'active';
    }

    try {
      await updateDoc(doc(db, 'users', userId), payload as Record<string, unknown>);
    } catch {
      // ignore
    }

    list[idx] = { ...list[idx], ...payload };
    setStored(STORAGE_KEYS.USER_DIRECTORY, list);

    if (list[idx].roll_number && list[idx].email) {
      saveStudentToRegistry(list[idx].roll_number!, list[idx].email);
    }

    await this.logAdminAudit('Admin', 'Update User Profile', 'users', userId, updates);
    return { success: true };
  },

  // ==========================================================================
  // STUDENTS / CLASSMATES MANAGEMENT
  // ==========================================================================
  async getClassmates(classGroup: string, branch?: string, section?: string): Promise<Classmate[]> {
    const list = getStored<AdminUserItem[]>(STORAGE_KEYS.USER_DIRECTORY, INITIAL_USERS);
    return list
      .filter((u) => u.role === 'student' && u.is_active !== false)
      .filter((u) => {
        if (classGroup && u.class_group === classGroup) return true;
        if (branch && section && u.branch === branch && u.section === section) return true;
        return false;
      })
      .map((u) => ({
        id: u.user_id,
        roll_number: u.roll_number || '25CS000',
        full_name: u.full_name,
        branch: u.branch || 'Cyber Security',
        section: u.section || 'A',
        class_group: u.class_group || classGroup,
        academic_year: u.academic_year || '2026–27',
        email: u.email,
        is_active: u.status === 'active',
      }));
  },

  async getAllStudents(searchQuery?: string): Promise<Classmate[]> {
    const list = getStored<AdminUserItem[]>(STORAGE_KEYS.USER_DIRECTORY, INITIAL_USERS);
    let students = list.filter((u) => u.role === 'student');

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      students = students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (s.roll_number && s.roll_number.toLowerCase().includes(q)) ||
          s.email.toLowerCase().includes(q) ||
          (s.branch && s.branch.toLowerCase().includes(q))
      );
    }

    return students.map((u) => ({
      id: u.user_id,
      roll_number: u.roll_number || '25CS000',
      full_name: u.full_name,
      branch: u.branch || 'Cyber Security',
      section: u.section || 'A',
      class_group: u.class_group || '25CS-A',
      academic_year: u.academic_year || '2026–27',
      email: u.email,
      is_active: u.status === 'active',
    }));
  },

  async createStudent(student: {
    full_name: string;
    roll_number: string;
    email: string;
    branch: string;
    section: string;
    semester: string;
    academic_year?: string;
    department?: string;
    adminName?: string;
  }): Promise<Classmate | null> {
    const res = await this.createUser({
      full_name: student.full_name,
      email: student.email,
      role: 'student',
      roll_number: student.roll_number,
      department: student.department || 'Engineering & Technology',
      branch: student.branch,
      section: student.section,
      semester: student.semester,
      academic_year: student.academic_year || '2026–27',
      year_of_study: '1st Year',
      status: 'active',
    });

    if (res.success && res.user) {
      return {
        id: res.user.user_id,
        roll_number: res.user.roll_number || student.roll_number,
        full_name: res.user.full_name,
        branch: res.user.branch || student.branch,
        section: res.user.section || student.section,
        class_group: res.user.class_group || '25CS-A',
        academic_year: res.user.academic_year || '2026–27',
        email: res.user.email,
        is_active: true,
      };
    }
    return null;
  },

  async updateStudent(id: string, updates: Partial<AdminUserItem>, adminName: string = 'Admin'): Promise<boolean> {
    const res = await this.updateUser(id, updates);
    if (res.success) {
      await this.logAdminAudit(adminName, 'Update Student', 'users', id, updates);
      return true;
    }
    return false;
  },

  async toggleStudentStatus(id: string, currentStatus: boolean, adminName: string = 'Admin'): Promise<boolean> {
    const newStatus: UserStatus = currentStatus ? 'inactive' : 'active';
    const res = await this.setUserStatus(id, newStatus);
    if (res.success) {
      await this.logAdminAudit(adminName, 'Toggle Student Status', 'users', id, { newStatus });
      return true;
    }
    return false;
  },

  async bulkImportStudents(
    students: {
      roll_number: string;
      full_name: string;
      email: string;
      branch?: string;
      section?: string;
      semester?: string;
    }[],
    adminName: string = 'Admin'
  ): Promise<{
    successCount: number;
    failedCount: number;
    duplicatesCount: number;
    errors: string[];
    parsedRows: {
      roll_number: string;
      full_name: string;
      joining_year?: number;
      college_code?: string;
      branch_code?: string;
      numeric_roll?: string;
      mapped_branch?: string;
      valid: boolean;
      error?: string;
    }[];
  }> {
    let successCount = 0;
    let failedCount = 0;
    let duplicatesCount = 0;
    const errors: string[] = [];
    const parsedRows: {
      roll_number: string;
      full_name: string;
      joining_year?: number;
      college_code?: string;
      branch_code?: string;
      numeric_roll?: string;
      mapped_branch?: string;
      valid: boolean;
      error?: string;
    }[] = [];

    const existingUsers = getStored<AdminUserItem[]>(STORAGE_KEYS.USER_DIRECTORY, INITIAL_USERS);
    const existingRolls = new Set(existingUsers.map((u) => u.roll_number?.toUpperCase()));

    for (const row of students) {
      const cleanRoll = row.roll_number.trim().toUpperCase();
      const parsed = await this.parseStudentRoll(cleanRoll);

      if (!parsed.isValid) {
        failedCount++;
        errors.push(`Row ${cleanRoll}: ${parsed.errorMessage}`);
        parsedRows.push({
          roll_number: cleanRoll,
          full_name: row.full_name,
          valid: false,
          error: parsed.errorMessage,
        });
        continue;
      }

      if (existingRolls.has(cleanRoll)) {
        duplicatesCount++;
        parsedRows.push({
          roll_number: cleanRoll,
          full_name: row.full_name,
          valid: false,
          error: 'Duplicate roll number',
        });
        continue;
      }

      const res = await this.createUser({
        full_name: row.full_name,
        roll_number: cleanRoll,
        email: row.email,
        role: 'student',
        branch: row.branch || parsed.mappedBranchName || 'Cyber Security',
        section: row.section || 'A',
        semester: row.semester || 'Semester 1',
        academic_year: '2026–27',
        status: 'active',
      });

      if (res.success) {
        successCount++;
        existingRolls.add(cleanRoll);
        parsedRows.push({
          roll_number: cleanRoll,
          full_name: row.full_name,
          joining_year: parsed.joiningYear,
          college_code: parsed.collegeCode,
          branch_code: parsed.branchCode,
          numeric_roll: parsed.numericRoll,
          mapped_branch: parsed.mappedBranchName,
          valid: true,
        });
      } else {
        failedCount++;
        errors.push(`Row ${cleanRoll}: ${res.error}`);
        parsedRows.push({
          roll_number: cleanRoll,
          full_name: row.full_name,
          valid: false,
          error: res.error,
        });
      }
    }

    await this.logAdminAudit(adminName, 'Bulk Student Import', 'users', undefined, { count: successCount });
    return { successCount, failedCount, duplicatesCount, errors, parsedRows };
  },

  // ==========================================================================
  // REPORTS (FIRESTORE REAL COLLECTION)
  // ==========================================================================
  async getReports(): Promise<ReportItem[]> {
    try {
      const q = query(collection(db, 'reports'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const items: ReportItem[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          user_id: d.user_id,
          reporter_name: d.reporter_name || 'Anonymous Student',
          reporter_email: d.reporter_email || '',
          report_type: d.report_type || 'Bug',
          subject: d.subject || '',
          description: d.description || '',
          status: d.status || 'pending',
          admin_notes: d.admin_notes,
          created_at: d.created_at || new Date().toISOString(),
        });
      });
      if (items.length > 0) {
        setStored(STORAGE_KEYS.REPORTS_CACHE, items);
        return items;
      }
    } catch (e) {
      console.warn('Firestore reports get error, falling back to cache:', e);
    }
    return getStored<ReportItem[]>(STORAGE_KEYS.REPORTS_CACHE, []);
  },

  async updateReportStatus(reportId: string, status: ReportItem['status'], adminNotes?: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status,
        ...(adminNotes ? { admin_notes: adminNotes } : {}),
        updated_at: new Date().toISOString(),
      });
    } catch {
      // fallback local cache update
    }

    const list = getStored<ReportItem[]>(STORAGE_KEYS.REPORTS_CACHE, []);
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx !== -1) {
      list[idx].status = status;
      if (adminNotes) list[idx].admin_notes = adminNotes;
      setStored(STORAGE_KEYS.REPORTS_CACHE, list);
    }

    await this.logAdminAudit('Admin', `Update Report Status to ${status}`, 'reports', reportId, { status, adminNotes });
    return true;
  },

  // ==========================================================================
  // AUDIT & ACTIVITY LOGGING
  // ==========================================================================
  async logAdminAudit(
    adminName: string,
    action: string,
    targetType: string,
    targetId?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const log: AdminAuditLog = {
      id: generateId('audit'),
      admin_id: auth.currentUser?.uid || 'system-admin',
      admin_name: adminName,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      created_at: new Date().toISOString(),
    };

    const list = getStored<AdminAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    list.unshift(log);
    if (list.length > 100) list.pop();
    setStored(STORAGE_KEYS.AUDIT_LOGS, list);
  },

  async getAdminAuditLogs(limitCount: number = 50): Promise<AdminAuditLog[]> {
    const list = getStored<AdminAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    return list.slice(0, limitCount);
  },

  async logActivity(action: string, details: string, performedBy: string = 'User'): Promise<void> {
    const log: ActivityLog = {
      id: generateId('act'),
      action,
      details,
      performed_by: performedBy,
      created_at: new Date().toISOString(),
    };
    const list = getStored<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
    list.unshift(log);
    if (list.length > 50) list.pop();
    setStored(STORAGE_KEYS.ACTIVITY_LOGS, list);
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    return getStored<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
  },

  // ==========================================================================
  // DRIVE COURSES (GOOGLE DRIVE ACADEMIC PORTALS - CANONICAL NORMALIZATION)
  // ==========================================================================

  async getDriveCourses(filters?: {
    department?: string;
    branch?: string;
    year?: string;
    semester?: string;
    section?: string;
    status?: string;
    search?: string;
  }): Promise<DriveCourse[]> {
    let list = getStored<DriveCourse[]>(STORAGE_KEYS.DRIVE_COURSES, []);

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        list = list.filter((c) => c.status === filters.status);
      }
      if (filters.department && filters.department !== 'all') {
        list = list.filter((c) => !c.department || c.department === 'All' || c.department.toLowerCase().includes(filters.department!.toLowerCase()));
      }
      if (filters.branch && filters.branch !== 'all') {
        const bQ = filters.branch.toLowerCase();
        list = list.filter((c) => !c.branch || c.branch === 'All' || c.branch.toLowerCase().includes(bQ) || bQ.includes(c.branch.toLowerCase()));
      }
      if (filters.year && filters.year !== 'all') {
        list = list.filter((c) => !c.year_of_study || c.year_of_study === 'All' || c.year_of_study.toLowerCase().includes(filters.year!.toLowerCase()));
      }
      if (filters.semester && filters.semester !== 'all') {
        list = list.filter((c) => !c.semester || c.semester === 'All' || c.semester.toLowerCase().includes(filters.semester!.toLowerCase()));
      }
      if (filters.section && filters.section !== 'all') {
        list = list.filter((c) => !c.section || c.section === 'All' || c.section.trim().toUpperCase() === filters.section!.trim().toUpperCase());
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            (c.subject_name && c.subject_name.toLowerCase().includes(q))
        );
      }
    }

    return list;
  },

  async getDriveCourseById(id: string): Promise<DriveCourse | null> {
    const list = getStored<DriveCourse[]>(STORAGE_KEYS.DRIVE_COURSES, []);
    return list.find((c) => c.id === id) || null;
  },

  async createDriveCourse(courseData: Omit<DriveCourse, 'id' | 'created_at' | 'updated_at'>): Promise<DriveCourse> {
    const list = getStored<DriveCourse[]>(STORAGE_KEYS.DRIVE_COURSES, []);

    // Canonical Google Drive URL & ID normalization
    const normalizedDrive = parseAndNormalizeDriveUrl(courseData.drive_url);
    const canonicalUrl = normalizedDrive.valid ? normalizedDrive.driveUrl : courseData.drive_url.trim();
    const driveId = normalizedDrive.driveId || courseData.drive_id;

    const newCourse: DriveCourse = {
      id: generateId('course'),
      title: courseData.title.trim(),
      description: courseData.description.trim(),
      drive_id: driveId,
      drive_url: canonicalUrl,
      thumbnail_url: courseData.thumbnail_url?.trim(),
      department_id: courseData.department_id,
      department: courseData.department,
      branch_id: courseData.branch_id,
      branch: courseData.branch,
      academic_year_id: courseData.academic_year_id,
      academic_year: courseData.academic_year,
      year_of_study: courseData.year_of_study || 'All',
      semester: courseData.semester || 'All',
      section_id: courseData.section_id,
      section: courseData.section || 'All',
      subject_id: courseData.subject_id,
      subject_name: courseData.subject_name,
      status: courseData.status || 'published',
      created_by: courseData.created_by || 'Admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    list.unshift(newCourse);
    setStored(STORAGE_KEYS.DRIVE_COURSES, list);
    await this.logAdminAudit(courseData.created_by || 'Admin', 'Create Drive Course', 'drive_courses', newCourse.id, {
      title: newCourse.title,
      target_year: newCourse.year_of_study,
      status: newCourse.status,
    });

    return newCourse;
  },

  async updateDriveCourse(id: string, updates: Partial<DriveCourse>): Promise<boolean> {
    const list = getStored<DriveCourse[]>(STORAGE_KEYS.DRIVE_COURSES, []);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    const updatedData = { ...updates };
    if (updates.drive_url) {
      const normalizedDrive = parseAndNormalizeDriveUrl(updates.drive_url);
      if (normalizedDrive.valid) {
        updatedData.drive_url = normalizedDrive.driveUrl;
        updatedData.drive_id = normalizedDrive.driveId;
      }
    }

    list[idx] = {
      ...list[idx],
      ...updatedData,
      updated_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.DRIVE_COURSES, list);
    await this.logAdminAudit('Admin', 'Update Drive Course', 'drive_courses', id, updates);
    return true;
  },

  async toggleCoursePublish(id: string): Promise<{ success: boolean; newStatus?: CourseStatus }> {
    const list = getStored<DriveCourse[]>(STORAGE_KEYS.DRIVE_COURSES, []);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return { success: false };

    const newStatus: CourseStatus = list[idx].status === 'published' ? 'draft' : 'published';
    list[idx].status = newStatus;
    list[idx].updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.DRIVE_COURSES, list);

    await this.logAdminAudit('Admin', `${newStatus === 'published' ? 'Publish' : 'Unpublish'} Drive Course`, 'drive_courses', id, { newStatus });
    return { success: true, newStatus };
  },

  async deleteDriveCourse(id: string): Promise<boolean> {
    const list = getStored<DriveCourse[]>(STORAGE_KEYS.DRIVE_COURSES, []);
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) return false;

    setStored(STORAGE_KEYS.DRIVE_COURSES, filtered);
    await this.logAdminAudit('Admin', 'Delete Drive Course', 'drive_courses', id);
    return true;
  },

  /**
   * Returns published courses targeted specifically to the student's academic profile.
   * SECURITY RULE: Raw drive_url or drive_id is NEVER included in this listing payload.
   */
  async getStudentDriveCourses(profile: UserProfile | null): Promise<StudentDriveCourseItem[]> {
    if (!profile) return [];
    if (profile.status !== 'active' || profile.is_active === false) return [];

    const list = getStored<DriveCourse[]>(STORAGE_KEYS.DRIVE_COURSES, []);

    // 1. Must be published
    const published = list.filter((c) => c.status === 'published');

    // 2. Strict targeting match against student profile
    const matched = published.filter((c) => {
      // Department
      if (c.department && c.department !== 'All' && profile.department) {
        if (!c.department.toLowerCase().includes(profile.department.toLowerCase()) &&
            !profile.department.toLowerCase().includes(c.department.toLowerCase())) {
          return false;
        }
      }
      // Branch
      if (c.branch && c.branch !== 'All' && profile.branch) {
        if (!c.branch.toLowerCase().includes(profile.branch.toLowerCase()) &&
            !profile.branch.toLowerCase().includes(c.branch.toLowerCase())) {
          return false;
        }
      }
      // Year of Study (e.g., 2nd Year student sees 2nd Year; 1st Year student does NOT see 2nd Year)
      if (c.year_of_study && c.year_of_study !== 'All' && profile.year_of_study) {
        const cYear = c.year_of_study.replace(/[^0-9]/g, '');
        const pYear = profile.year_of_study.replace(/[^0-9]/g, '');
        if (cYear && pYear && cYear !== pYear) {
          return false;
        }
      }
      // Semester
      if (c.semester && c.semester !== 'All' && profile.semester) {
        const cSem = c.semester.replace(/[^0-9]/g, '');
        const pSem = profile.semester.replace(/[^0-9]/g, '');
        if (cSem && pSem && cSem !== pSem) {
          return false;
        }
      }
      // Section
      if (c.section && c.section !== 'All' && profile.section) {
        if (c.section.trim().toUpperCase() !== profile.section.trim().toUpperCase()) {
          return false;
        }
      }
      return true;
    });

    // 3. Return sanitized item without raw drive_url
    return matched.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnail_url: c.thumbnail_url,
      department: c.department,
      branch: c.branch,
      academic_year: c.academic_year,
      year_of_study: c.year_of_study,
      semester: c.semester,
      section: c.section,
      subject_name: c.subject_name,
      created_at: c.created_at,
    }));
  },

  /**
   * Secure resolver for student course access.
   * Performs authorization verification before returning the URL.
   */
  async resolveDriveCourseAccess(
    courseId: string,
    profile: UserProfile | null
  ): Promise<{ url?: string; error?: string }> {
    // 1. Verify authenticated student
    if (!profile) {
      return { error: 'Please sign in to access course materials.' };
    }

    // 2. Verify account is active
    if (profile.status !== 'active' || profile.is_active === false) {
      return { error: 'Your account is currently inactive. Please contact your college administrator.' };
    }

    // 3. Fetch course
    const course = await this.getDriveCourseById(courseId);
    if (!course) {
      return { error: 'Course not found or has been removed.' };
    }

    // 4. Verify course is published
    if (course.status !== 'published') {
      return { error: 'This course is currently unavailable.' };
    }

    // 5. Verify academic targeting
    if (course.department && course.department !== 'All' && profile.department) {
      if (!course.department.toLowerCase().includes(profile.department.toLowerCase()) &&
          !profile.department.toLowerCase().includes(course.department.toLowerCase())) {
        return { error: "You don't have access to this course." };
      }
    }
    if (course.branch && course.branch !== 'All' && profile.branch) {
      if (!course.branch.toLowerCase().includes(profile.branch.toLowerCase()) &&
          !profile.branch.toLowerCase().includes(course.branch.toLowerCase())) {
        return { error: "You don't have access to this course." };
      }
    }
    if (course.year_of_study && course.year_of_study !== 'All' && profile.year_of_study) {
      const cYear = course.year_of_study.replace(/[^0-9]/g, '');
      const pYear = profile.year_of_study.replace(/[^0-9]/g, '');
      if (cYear && pYear && cYear !== pYear) {
        return { error: "You don't have access to this course." };
      }
    }
    if (course.semester && course.semester !== 'All' && profile.semester) {
      const cSem = course.semester.replace(/[^0-9]/g, '');
      const pSem = profile.semester.replace(/[^0-9]/g, '');
      if (cSem && pSem && cSem !== pSem) {
        return { error: "You don't have access to this course." };
      }
    }
    if (course.section && course.section !== 'All' && profile.section) {
      if (course.section.trim().toUpperCase() !== profile.section.trim().toUpperCase()) {
        return { error: "You don't have access to this course." };
      }
    }

    // 6. Access granted
    await this.logActivity('Open Drive Course', `Student ${profile.roll_number || profile.full_name} launched course ${course.title}`, profile.roll_number || profile.full_name);
    return { url: course.drive_url };
  },

  // ==========================================================================
  // REAL ADMIN OVERVIEW STATS (100% REAL DATABASE COUNTS, NO FAKE NUMBERS)
  // ==========================================================================
  async getAdminStats(): Promise<{
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    totalAdmins: number;
    totalDepartments: number;
    totalBranches: number;
    totalClasses: number;
    totalSections: number;
    totalSubjects: number;
    totalResources: number;
    totalAssignments: number;
    upcomingAssignments: number;
    totalAnnouncements: number;
    totalCourses: number;
    openReports: number;
  }> {
    const users = getStored<AdminUserItem[]>(STORAGE_KEYS.USER_DIRECTORY, INITIAL_USERS);
    const students = users.filter((u) => u.role === 'student');
    const admins = users.filter((u) => u.role === 'admin');
    const activeStudents = students.filter((u) => (u.status || 'active') === 'active');
    const inactiveStudents = students.filter((u) => (u.status || 'active') !== 'active');

    const departments = await this.getDepartments();
    const branches = await this.getBranches();
    const classes = await this.getClasses();
    const sections = await this.getSections();
    const subjects = await this.getSubjects();
    const resources = await this.getResources();
    const assignments = await this.getAssignments();
    const announcements = await this.getAnnouncements();
    const reports = await this.getReports();
    const courses = await this.getDriveCourses();

    const now = new Date().getTime();
    const upcomingAssignments = assignments.filter((a) => {
      try {
        return new Date(a.due_date).getTime() >= now;
      } catch {
        return false;
      }
    }).length;

    const openReports = reports.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;

    return {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      inactiveStudents: inactiveStudents.length,
      totalAdmins: admins.length,
      totalDepartments: departments.length,
      totalBranches: branches.length,
      totalClasses: classes.length,
      totalSections: sections.length,
      totalSubjects: subjects.length,
      totalResources: resources.length,
      totalAssignments: assignments.length,
      upcomingAssignments,
      totalAnnouncements: announcements.length,
      totalCourses: courses.length,
      openReports,
    };
  },
};
