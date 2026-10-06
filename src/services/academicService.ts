import { supabase, createTransientClient } from '@/integrations/supabase/client';
import {
  Subject,
  TimetableSlot,
  Assignment,
  AcademicResource,
  Announcement,
  Classmate,
  ReportItem,
  RatingFeedback,
  DayOfWeek,
  AssignmentStatus,
  ActivityLog,
  AdminAuditLog,
  Department,
  Branch,
  SubBranch,
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
} from '@/types/academic';
import {
  parseRollNumber,
  DEFAULT_ROLL_FORMATS,
  DEFAULT_BRANCH_CODE_MAPPINGS,
} from '@/lib/rollNumberParser';

// Fallback seed structures in case tables are yet to be populated in database
const FALLBACK_DEPARTMENTS: Department[] = [
  { id: 'dept-eng', name: 'Engineering & Technology', code: 'ENG', description: 'Faculty of Engineering and Technology', is_active: true },
  { id: 'dept-sci', name: 'Basic Sciences & Humanities', code: 'BSH', description: 'Science & Humanities', is_active: true },
  { id: 'dept-mgmt', name: 'Management Studies', code: 'MBA', description: 'Faculty of Management', is_active: true },
];

const FALLBACK_BRANCHES: Branch[] = [
  { id: 'br-cse', department_id: 'dept-eng', name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of CSE', is_active: true },
  { id: 'br-ece', department_id: 'dept-eng', name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of ECE', is_active: true },
  { id: 'br-eee', department_id: 'dept-eng', name: 'Electrical & Electronics Engineering', code: 'EEE', description: 'Department of EEE', is_active: true },
  { id: 'br-mech', department_id: 'dept-eng', name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical', is_active: true },
];

const FALLBACK_SUB_BRANCHES: SubBranch[] = [
  { id: 'sb-cse-core', branch_id: 'br-cse', name: 'Core Computer Science', code: 'CORE', description: 'Traditional CSE', is_active: true },
  { id: 'sb-cse-cs', branch_id: 'br-cse', name: 'Cyber Security', code: 'CS', description: 'Cyber Security & Digital Forensics', is_active: true },
  { id: 'sb-cse-ds', branch_id: 'br-cse', name: 'Data Science', code: 'DS', description: 'Big Data & Analytics', is_active: true },
  { id: 'sb-cse-aiml', branch_id: 'br-cse', name: 'Artificial Intelligence & Machine Learning', code: 'AIML', description: 'AI & Deep Learning', is_active: true },
  { id: 'sb-ece-core', branch_id: 'br-ece', name: 'Core Electronics', code: 'CORE', description: 'Core Electronics', is_active: true },
  { id: 'sb-ece-vlsi', branch_id: 'br-ece', name: 'VLSI Design', code: 'VLSI', description: 'VLSI & Microelectronics', is_active: true },
];

const FALLBACK_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 'ay-2026', name: '2026–27', start_year: 2026, end_year: 2027, is_current: true, is_active: true },
  { id: 'ay-2025', name: '2025–26', start_year: 2025, end_year: 2026, is_current: false, is_active: true },
  { id: 'ay-2024', name: '2024–25', start_year: 2024, end_year: 2025, is_current: false, is_active: true },
];

const FALLBACK_CLASSES: AcademicClass[] = [
  {
    id: 'cls-cyber-1',
    department_id: 'dept-eng',
    branch_id: 'br-cse',
    sub_branch_id: 'sb-cse-cs',
    academic_year_id: 'ay-2026',
    name: 'B.Tech CSE - Cyber Security (2026-27)',
    year_of_study: '1st Year',
    semester: 'Semester 1',
    code: '26CSE-CS-1',
    is_active: true,
  },
  {
    id: 'cls-cse-core-1',
    department_id: 'dept-eng',
    branch_id: 'br-cse',
    sub_branch_id: 'sb-cse-core',
    academic_year_id: 'ay-2026',
    name: 'B.Tech CSE - Core (2026-27)',
    year_of_study: '1st Year',
    semester: 'Semester 1',
    code: '26CSE-CORE-1',
    is_active: true,
  },
];

const FALLBACK_SECTIONS: Section[] = [
  { id: 'sec-a', class_id: 'cls-cyber-1', name: 'Section A', code: 'A', capacity: 60, is_active: true },
  { id: 'sec-b', class_id: 'cls-cyber-1', name: 'Section B', code: 'B', capacity: 60, is_active: true },
  { id: 'sec-c', class_id: 'cls-cyber-1', name: 'Section C', code: 'C', capacity: 60, is_active: true },
];

export const academicService = {
  // ==========================================================================
  // ACADEMIC HIERARCHY MANAGEMENT
  // ==========================================================================

  // --- Departments ---
  async getDepartments(): Promise<Department[]> {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Department[];
      }
    } catch {
      // Fallback
    }
    return FALLBACK_DEPARTMENTS;
  },

  async createDepartment(dept: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department | null> {
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert({
          name: dept.name.trim(),
          code: dept.code.trim().toUpperCase(),
          description: dept.description,
          is_active: dept.is_active !== false,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logAdminAudit('Admin', 'Create Department', 'departments', data.id, { name: dept.name, code: dept.code });
        return data as Department;
      }
    } catch (err) {
      console.error('Error creating department:', err);
    }
    return null;
  },

  async updateDepartment(id: string, updates: Partial<Department>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        await this.logAdminAudit('Admin', 'Update Department', 'departments', id, updates);
        return true;
      }
    } catch (err) {
      console.error('Error updating department:', err);
    }
    return false;
  },

  async deleteDepartment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (!error) {
        await this.logAdminAudit('Admin', 'Delete Department', 'departments', id);
        return true;
      }
    } catch (err) {
      console.error('Error deleting department:', err);
    }
    return false;
  },

  // --- Branches ---
  async getBranches(departmentId?: string): Promise<Branch[]> {
    try {
      let query = supabase.from('branches').select('*').order('name', { ascending: true });
      if (departmentId && departmentId !== 'All') {
        query = query.eq('department_id', departmentId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Branch[];
      }
    } catch {
      // Fallback
    }
    return departmentId && departmentId !== 'All'
      ? FALLBACK_BRANCHES.filter((b) => b.department_id === departmentId)
      : FALLBACK_BRANCHES;
  },

  async createBranch(branch: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<Branch | null> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .insert({
          department_id: branch.department_id,
          name: branch.name.trim(),
          code: branch.code.trim().toUpperCase(),
          description: branch.description,
          is_active: branch.is_active !== false,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logAdminAudit('Admin', 'Create Branch', 'branches', data.id, { name: branch.name, code: branch.code });
        return data as Branch;
      }
    } catch (err) {
      console.error('Error creating branch:', err);
    }
    return null;
  },

  async updateBranch(id: string, updates: Partial<Branch>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('branches')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        await this.logAdminAudit('Admin', 'Update Branch', 'branches', id, updates);
        return true;
      }
    } catch (err) {
      console.error('Error updating branch:', err);
    }
    return false;
  },

  async deleteBranch(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (!error) {
        await this.logAdminAudit('Admin', 'Delete Branch', 'branches', id);
        return true;
      }
    } catch (err) {
      console.error('Error deleting branch:', err);
    }
    return false;
  },

  // --- Sub-Branches (Specializations) ---
  async getSubBranches(branchId?: string): Promise<SubBranch[]> {
    try {
      let query = supabase.from('sub_branches').select('*').order('name', { ascending: true });
      if (branchId && branchId !== 'All') {
        query = query.eq('branch_id', branchId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as SubBranch[];
      }
    } catch {
      // Fallback
    }
    return branchId && branchId !== 'All'
      ? FALLBACK_SUB_BRANCHES.filter((sb) => sb.branch_id === branchId)
      : FALLBACK_SUB_BRANCHES;
  },

  async createSubBranch(subBranch: Omit<SubBranch, 'id' | 'created_at' | 'updated_at'>): Promise<SubBranch | null> {
    try {
      const { data, error } = await supabase
        .from('sub_branches')
        .insert({
          branch_id: subBranch.branch_id,
          name: subBranch.name.trim(),
          code: subBranch.code.trim().toUpperCase(),
          description: subBranch.description,
          is_active: subBranch.is_active !== false,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logAdminAudit('Admin', 'Create Sub-Branch', 'sub_branches', data.id, { name: subBranch.name, code: subBranch.code });
        return data as SubBranch;
      }
    } catch (err) {
      console.error('Error creating sub branch:', err);
    }
    return null;
  },

  async updateSubBranch(id: string, updates: Partial<SubBranch>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sub_branches')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        await this.logAdminAudit('Admin', 'Update Sub-Branch', 'sub_branches', id, updates);
        return true;
      }
    } catch (err) {
      console.error('Error updating sub branch:', err);
    }
    return false;
  },

  async deleteSubBranch(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('sub_branches').delete().eq('id', id);
      if (!error) {
        await this.logAdminAudit('Admin', 'Delete Sub-Branch', 'sub_branches', id);
        return true;
      }
    } catch (err) {
      console.error('Error deleting sub branch:', err);
    }
    return false;
  },

  // --- Academic Years ---
  async getAcademicYears(): Promise<AcademicYear[]> {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_year', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as AcademicYear[];
      }
    } catch {
      // Fallback
    }
    return FALLBACK_ACADEMIC_YEARS;
  },

  async createAcademicYear(ay: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>): Promise<AcademicYear | null> {
    try {
      if (ay.is_current) {
        // Reset previous current years
        await supabase.from('academic_years').update({ is_current: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { data, error } = await supabase
        .from('academic_years')
        .insert({
          name: ay.name.trim(),
          start_year: ay.start_year,
          end_year: ay.end_year,
          is_current: ay.is_current,
          is_active: ay.is_active !== false,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logAdminAudit('Admin', 'Create Academic Year', 'academic_years', data.id, { name: ay.name });
        return data as AcademicYear;
      }
    } catch (err) {
      console.error('Error creating academic year:', err);
    }
    return null;
  },

  async updateAcademicYear(id: string, updates: Partial<AcademicYear>): Promise<boolean> {
    try {
      if (updates.is_current) {
        await supabase.from('academic_years').update({ is_current: false }).neq('id', id);
      }
      const { error } = await supabase
        .from('academic_years')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        await this.logAdminAudit('Admin', 'Update Academic Year', 'academic_years', id, updates);
        return true;
      }
    } catch (err) {
      console.error('Error updating academic year:', err);
    }
    return false;
  },

  // --- Classes ---
  async getClasses(branchId?: string, subBranchId?: string, academicYearId?: string): Promise<AcademicClass[]> {
    try {
      let query = supabase.from('classes').select('*').order('name', { ascending: true });
      if (branchId && branchId !== 'All') query = query.eq('branch_id', branchId);
      if (subBranchId && subBranchId !== 'All') query = query.eq('sub_branch_id', subBranchId);
      if (academicYearId && academicYearId !== 'All') query = query.eq('academic_year_id', academicYearId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as AcademicClass[];
      }
    } catch {
      // Fallback
    }
    return FALLBACK_CLASSES;
  },

  async createClass(c: Omit<AcademicClass, 'id' | 'created_at' | 'updated_at'>): Promise<AcademicClass | null> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          department_id: c.department_id || null,
          branch_id: c.branch_id,
          sub_branch_id: c.sub_branch_id || null,
          academic_year_id: c.academic_year_id || null,
          name: c.name.trim(),
          year_of_study: c.year_of_study || '1st Year',
          semester: c.semester || 'Semester 1',
          code: c.code || null,
          is_active: c.is_active !== false,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logAdminAudit('Admin', 'Create Class', 'classes', data.id, { name: c.name });
        return data as AcademicClass;
      }
    } catch (err) {
      console.error('Error creating class:', err);
    }
    return null;
  },

  async updateClass(id: string, updates: Partial<AcademicClass>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        await this.logAdminAudit('Admin', 'Update Class', 'classes', id, updates);
        return true;
      }
    } catch (err) {
      console.error('Error updating class:', err);
    }
    return false;
  },

  async deleteClass(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (!error) {
        await this.logAdminAudit('Admin', 'Delete Class', 'classes', id);
        return true;
      }
    } catch (err) {
      console.error('Error deleting class:', err);
    }
    return false;
  },

  // --- Sections ---
  async getSections(classId?: string): Promise<Section[]> {
    try {
      let query = supabase.from('sections').select('*').order('name', { ascending: true });
      if (classId && classId !== 'All') {
        query = query.eq('class_id', classId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Section[];
      }
    } catch {
      // Fallback
    }
    return classId && classId !== 'All'
      ? FALLBACK_SECTIONS.filter((s) => s.class_id === classId)
      : FALLBACK_SECTIONS;
  },

  async createSection(sec: Omit<Section, 'id' | 'created_at' | 'updated_at'>): Promise<Section | null> {
    try {
      const { data, error } = await supabase
        .from('sections')
        .insert({
          class_id: sec.class_id,
          name: sec.name.trim(),
          code: sec.code.trim().toUpperCase(),
          capacity: sec.capacity || 60,
          is_active: sec.is_active !== false,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logAdminAudit('Admin', 'Create Section', 'sections', data.id, { name: sec.name, code: sec.code });
        return data as Section;
      }
    } catch (err) {
      console.error('Error creating section:', err);
    }
    return null;
  },

  async updateSection(id: string, updates: Partial<Section>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        await this.logAdminAudit('Admin', 'Update Section', 'sections', id, updates);
        return true;
      }
    } catch (err) {
      console.error('Error updating section:', err);
    }
    return false;
  },

  async deleteSection(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (!error) {
        await this.logAdminAudit('Admin', 'Delete Section', 'sections', id);
        return true;
      }
    } catch (err) {
      console.error('Error deleting section:', err);
    }
    return false;
  },

  // ==========================================================================
  // CONFIGURABLE ROLL NUMBER PARSING & BRANCH CODES
  // ==========================================================================

  async getBranchCodes(): Promise<BranchCodeMapping[]> {
    try {
      const { data, error } = await supabase
        .from('branch_codes')
        .select('*')
        .order('code', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as BranchCodeMapping[];
      }
    } catch {
      // Fallback
    }
    return DEFAULT_BRANCH_CODE_MAPPINGS;
  },

  async createBranchCode(mapping: Omit<BranchCodeMapping, 'id' | 'created_at' | 'updated_at'>): Promise<BranchCodeMapping | null> {
    try {
      const { data, error } = await supabase
        .from('branch_codes')
        .insert({
          code: mapping.code.trim().toUpperCase(),
          branch_id: mapping.branch_id || null,
          sub_branch_id: mapping.sub_branch_id || null,
          name: mapping.name.trim(),
          description: mapping.description || null,
          is_active: mapping.is_active !== false,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logAdminAudit('Admin', 'Create Branch Code Mapping', 'branch_codes', data.id, { code: mapping.code, name: mapping.name });
        return data as BranchCodeMapping;
      }
    } catch (err) {
      console.error('Error creating branch code mapping:', err);
    }
    return null;
  },

  async updateBranchCode(id: string, updates: Partial<BranchCodeMapping>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('branch_codes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        await this.logAdminAudit('Admin', 'Update Branch Code', 'branch_codes', id, updates);
        return true;
      }
    } catch (err) {
      console.error('Error updating branch code:', err);
    }
    return false;
  },

  async deleteBranchCode(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('branch_codes').delete().eq('id', id);
      if (!error) {
        await this.logAdminAudit('Admin', 'Delete Branch Code', 'branch_codes', id);
        return true;
      }
    } catch (err) {
      console.error('Error deleting branch code:', err);
    }
    return false;
  },

  async getRollFormats(): Promise<RollNumberFormatConfig[]> {
    try {
      const { data, error } = await supabase
        .from('roll_number_formats')
        .select('*')
        .order('is_default', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as RollNumberFormatConfig[];
      }
    } catch {
      // Fallback
    }
    return DEFAULT_ROLL_FORMATS;
  },

  async createRollFormat(fmt: Omit<RollNumberFormatConfig, 'id' | 'created_at' | 'updated_at'>): Promise<RollNumberFormatConfig | null> {
    try {
      if (fmt.is_default) {
        await supabase.from('roll_number_formats').update({ is_default: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { data, error } = await supabase
        .from('roll_number_formats')
        .insert({
          name: fmt.name.trim(),
          pattern: fmt.pattern.trim(),
          year_group_index: fmt.year_group_index,
          college_group_index: fmt.college_group_index,
          branch_code_group_index: fmt.branch_code_group_index,
          roll_group_index: fmt.roll_group_index,
          century_prefix: fmt.century_prefix || 2000,
          sample_roll: fmt.sample_roll.trim(),
          description: fmt.description,
          is_default: fmt.is_default,
          is_active: fmt.is_active !== false,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logAdminAudit('Admin', 'Create Roll Number Format', 'roll_number_formats', data.id, { name: fmt.name });
        return data as RollNumberFormatConfig;
      }
    } catch (err) {
      console.error('Error creating roll number format:', err);
    }
    return null;
  },

  async updateRollFormat(id: string, updates: Partial<RollNumberFormatConfig>): Promise<boolean> {
    try {
      if (updates.is_default) {
        await supabase.from('roll_number_formats').update({ is_default: false }).neq('id', id);
      }
      const { error } = await supabase
        .from('roll_number_formats')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        await this.logAdminAudit('Admin', 'Update Roll Number Format', 'roll_number_formats', id, updates);
        return true;
      }
    } catch (err) {
      console.error('Error updating roll format:', err);
    }
    return false;
  },

  /**
   * Evaluates student roll number against active formats and branch codes from DB (or defaults)
   */
  async parseStudentRoll(rollNumber: string): Promise<ParsedRollNumber> {
    const [formats, branchCodes, branches, subBranches] = await Promise.all([
      this.getRollFormats(),
      this.getBranchCodes(),
      this.getBranches(),
      this.getSubBranches(),
    ]);

    return parseRollNumber(rollNumber, formats, branchCodes, branches, subBranches);
  },

  // ==========================================================================
  // ADMIN AUDIT LOGS
  // ==========================================================================

  async logAdminAudit(
    adminName: string,
    action: string,
    targetType: string,
    targetId?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from('admin_audit_logs').insert({
        admin_name: adminName || 'Admin',
        action,
        target_type: targetType,
        target_id: targetId || null,
        details: details || {},
      });
    } catch {
      // Non-blocking
    }
    // Also record in general activity logs
    await this.logActivity(action, `${targetType}: ${targetId || 'N/A'}`);
  },

  async getAdminAuditLogs(limit: number = 30): Promise<AdminAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as AdminAuditLog[];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  // ==========================================================================
  // SUBJECTS
  // ==========================================================================
  async getSubjects(semester?: string, branch?: string, subBranch?: string): Promise<Subject[]> {
    try {
      let query = supabase.from('subjects').select('*');
      if (semester && semester !== 'All') {
        query = query.eq('semester', semester);
      }
      if (branch && branch !== 'All') {
        query = query.eq('branch', branch);
      }
      const { data, error } = await query.order('code', { ascending: true });

      if (error) {
        console.warn('Error fetching subjects from database:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        const subjectsList = data as unknown as Record<string, unknown>[];
        let list: Subject[] = subjectsList.map((s) => ({
          id: s.id as string,
          code: (s.code as string) || 'GEN101',
          name: (s.name as string) || 'Subject',
          faculty: (s.faculty as string) || 'Faculty',
          faculty_email: s.faculty_email as string | undefined,
          department: (s.department as string) || 'Computer Science & Engineering',
          branch: (s.branch as string) || 'CSE',
          sub_branch: (s.sub_branch as string) || undefined,
          semester: (s.semester as string) || 'Semester 1',
          credits: Number(s.credits) || 3,
          syllabus: Array.isArray(s.syllabus) ? (s.syllabus as string[]) : [],
          color: (s.color as string) || 'hsl(217, 91%, 60%)',
          notes_count: 0,
          assignments_count: 0,
          papers_count: 0,
          department_id: s.department_id as string | undefined,
          branch_id: s.branch_id as string | undefined,
          sub_branch_id: s.sub_branch_id as string | undefined,
          class_id: s.class_id as string | undefined,
          section_id: s.section_id as string | undefined,
        }));

        if (subBranch && subBranch !== 'All') {
          list = list.filter((s) => !s.sub_branch || s.sub_branch.toLowerCase() === subBranch.toLowerCase());
        }

        return list;
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
    return [];
  },

  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const s = data as unknown as Record<string, unknown>;
        return {
          id: s.id as string,
          code: (s.code as string) || 'GEN101',
          name: (s.name as string) || 'Subject',
          faculty: (s.faculty as string) || 'Faculty',
          faculty_email: s.faculty_email as string | undefined,
          department: (s.department as string) || 'Computer Science & Engineering',
          branch: (s.branch as string) || 'CSE',
          sub_branch: (s.sub_branch as string) || undefined,
          semester: (s.semester as string) || 'Semester 1',
          credits: Number(s.credits) || 3,
          syllabus: Array.isArray(s.syllabus) ? (s.syllabus as string[]) : [],
          color: (s.color as string) || 'hsl(217, 91%, 60%)',
          notes_count: 0,
          assignments_count: 0,
          papers_count: 0,
          department_id: s.department_id as string | undefined,
          branch_id: s.branch_id as string | undefined,
          sub_branch_id: s.sub_branch_id as string | undefined,
        };
      }
    } catch (err) {
      console.error('Failed to fetch subject by id:', err);
    }
    return null;
  },

  async createSubject(subject: Omit<Subject, 'id' | 'notes_count' | 'assignments_count' | 'papers_count'>): Promise<Subject | null> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          code: subject.code,
          name: subject.name,
          faculty: subject.faculty,
          faculty_email: subject.faculty_email,
          department: subject.department,
          branch: subject.branch,
          sub_branch: subject.sub_branch || null,
          semester: subject.semester,
          credits: subject.credits,
          syllabus: subject.syllabus || [],
          color: subject.color || 'hsl(217, 91%, 60%)',
          department_id: subject.department_id || null,
          branch_id: subject.branch_id || null,
          sub_branch_id: subject.sub_branch_id || null,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logActivity('Create Subject', `${subject.code} - ${subject.name}`);
        const s = data as unknown as Record<string, unknown>;
        return {
          id: s.id as string,
          code: s.code as string,
          name: s.name as string,
          faculty: s.faculty as string,
          faculty_email: s.faculty_email as string | undefined,
          department: s.department as string,
          branch: s.branch as string,
          sub_branch: s.sub_branch as string | undefined,
          semester: s.semester as string,
          credits: Number(s.credits) || 3,
          syllabus: Array.isArray(s.syllabus) ? (s.syllabus as string[]) : [],
          color: s.color as string,
          notes_count: 0,
          assignments_count: 0,
          papers_count: 0,
        };
      }
    } catch (err) {
      console.error('Error creating subject in database:', err);
    }
    return null;
  },

  async updateSubject(id: string, updates: Partial<Subject>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({
          code: updates.code,
          name: updates.name,
          faculty: updates.faculty,
          faculty_email: updates.faculty_email,
          department: updates.department,
          branch: updates.branch,
          sub_branch: updates.sub_branch,
          semester: updates.semester,
          credits: updates.credits,
          syllabus: updates.syllabus,
          color: updates.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (!error) {
        await this.logActivity('Update Subject', `Subject ${updates.code || id} updated`);
        return true;
      }
    } catch (err) {
      console.error('Error updating subject:', err);
    }
    return false;
  },

  async deleteSubject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (!error) {
        await this.logActivity('Delete Subject', `Subject ${id} removed`);
        return true;
      }
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
    return false;
  },

  // ==========================================================================
  // TIMETABLE
  // ==========================================================================
  async getTimetable(
    classGroup?: string,
    filters?: {
      department_id?: string;
      branch_id?: string;
      sub_branch_id?: string;
      section_id?: string;
      section?: string;
    }
  ): Promise<TimetableSlot[]> {
    try {
      let query = supabase.from('timetable').select('*');
      if (classGroup && classGroup !== 'All') {
        query = query.eq('class_group', classGroup);
      }
      if (filters?.section) {
        query = query.eq('section', filters.section);
      }
      if (filters?.section_id) {
        query = query.eq('section_id', filters.section_id);
      }

      const { data, error } = await query.order('start_time', { ascending: true });

      if (error) {
        console.warn('Error fetching timetable from database:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        return (data as unknown[]).map((t) => t as TimetableSlot);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    }
    return [];
  },

  async createTimetableSlot(slot: Omit<TimetableSlot, 'id'>): Promise<TimetableSlot | null> {
    try {
      const { data, error } = await supabase
        .from('timetable')
        .insert(slot)
        .select()
        .single();

      if (!error && data) {
        await this.logActivity('Create Timetable Slot', `${slot.subject_name} (${slot.day} ${slot.start_time}-${slot.end_time})`);
        return data as unknown as TimetableSlot;
      }
    } catch (err) {
      console.error('Error creating timetable slot:', err);
    }
    return null;
  },

  async deleteTimetableSlot(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('timetable').delete().eq('id', id);
      if (!error) {
        await this.logActivity('Delete Timetable Slot', `Timetable slot ${id} deleted`);
        return true;
      }
    } catch (err) {
      console.error('Error deleting timetable slot:', err);
    }
    return false;
  },

  async getTodayTimetable(
    classGroup: string,
    filters?: {
      department_id?: string;
      branch_id?: string;
      sub_branch_id?: string;
      section_id?: string;
      section?: string;
    }
  ): Promise<{
    today: DayOfWeek;
    schedule: TimetableSlot[];
    currentClass: TimetableSlot | null;
    nextClass: TimetableSlot | null;
  }> {
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as unknown as DayOfWeek[];
    const dayIndex = new Date().getDay();
    const todayName: DayOfWeek = (dayIndex === 0 || dayIndex === 6) ? 'Monday' : days[dayIndex];

    const allSlots = await this.getTimetable(classGroup, filters);
    const daySchedule = allSlots
      .filter((s) => s.day === todayName)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    let currentClass: TimetableSlot | null = null;
    let nextClass: TimetableSlot | null = null;

    for (let i = 0; i < daySchedule.length; i++) {
      const slot = daySchedule[i];
      if (currentTimeStr >= slot.start_time && currentTimeStr < slot.end_time) {
        currentClass = slot;
        nextClass = daySchedule[i + 1] || null;
        break;
      } else if (currentTimeStr < slot.start_time) {
        nextClass = slot;
        break;
      }
    }

    if (!currentClass && !nextClass && daySchedule.length > 0) {
      nextClass = daySchedule[0];
    }

    return {
      today: todayName,
      schedule: daySchedule,
      currentClass,
      nextClass,
    };
  },

  // ==========================================================================
  // ASSIGNMENTS
  // ==========================================================================
  async getAssignments(
    classGroup?: string,
    userId?: string,
    filters?: {
      department_id?: string;
      branch_id?: string;
      sub_branch_id?: string;
      section_id?: string;
      section?: string;
    }
  ): Promise<Assignment[]> {
    try {
      let query = supabase.from('assignments').select('*');
      if (classGroup && classGroup !== 'All') {
        query = query.eq('class_group', classGroup);
      }
      if (filters?.section_id) {
        query = query.eq('section_id', filters.section_id);
      }
      if (filters?.section) {
        query = query.eq('section', filters.section);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) {
        console.warn('Error fetching assignments from database:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        const completedSet = new Set<string>();
        if (userId) {
          try {
            const { data: progressData } = await supabase
              .from('student_assignments')
              .select('assignment_id, status')
              .eq('user_id', userId);

            if (progressData) {
              progressData.forEach((p: { assignment_id: string; status: string }) => {
                if (p.status === 'Completed' || p.status === 'Submitted') {
                  completedSet.add(p.assignment_id);
                }
              });
            }
          } catch {
            // Ignore
          }
        }

        return (data as unknown as Record<string, unknown>[]).map((asg) => {
          const id = asg.id as string;
          const isCompleted = completedSet.has(id);
          let status: AssignmentStatus = (asg.status as AssignmentStatus) || 'Pending';

          if (isCompleted) {
            status = 'Completed';
          } else {
            const dueDate = new Date((asg.due_date as string) || Date.now());
            const now = new Date();
            const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (diffHours < 0) status = 'Overdue';
            else if (diffHours <= 48) status = 'Due Soon';
            else status = 'Pending';
          }

          return {
            id,
            subject_id: (asg.subject_id as string) || '',
            subject_name: (asg.subject_name as string) || 'Academic Subject',
            title: (asg.title as string) || 'Assignment',
            description: (asg.description as string) || '',
            due_date: (asg.due_date as string) || new Date().toISOString(),
            status,
            attachment_url: asg.attachment_url as string | undefined,
            attachment_name: asg.attachment_name as string | undefined,
            class_group: (asg.class_group as string) || 'All',
            max_marks: Number(asg.max_marks) || 100,
            is_completed: isCompleted,
            department_id: asg.department_id as string | undefined,
            branch_id: asg.branch_id as string | undefined,
            sub_branch_id: asg.sub_branch_id as string | undefined,
            section_id: asg.section_id as string | undefined,
            section: asg.section as string | undefined,
          };
        });
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
    return [];
  },

  async createAssignment(
    assignment: Omit<Assignment, 'id' | 'status' | 'is_completed'>
  ): Promise<Assignment | null> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          subject_id: assignment.subject_id,
          subject_name: assignment.subject_name,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          class_group: assignment.class_group,
          max_marks: assignment.max_marks || 100,
          attachment_url: assignment.attachment_url || null,
          attachment_name: assignment.attachment_name || null,
          department_id: assignment.department_id || null,
          branch_id: assignment.branch_id || null,
          sub_branch_id: assignment.sub_branch_id || null,
          section_id: assignment.section_id || null,
          section: assignment.section || null,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logActivity('Create Assignment', `Assignment "${assignment.title}" for ${assignment.class_group}`);
        const asg = data as unknown as Record<string, unknown>;
        return {
          id: asg.id as string,
          subject_id: asg.subject_id as string,
          subject_name: asg.subject_name as string,
          title: asg.title as string,
          description: asg.description as string,
          due_date: asg.due_date as string,
          status: 'Pending',
          class_group: asg.class_group as string,
          max_marks: Number(asg.max_marks) || 100,
          attachment_url: asg.attachment_url as string | undefined,
          attachment_name: asg.attachment_name as string | undefined,
          is_completed: false,
          department_id: asg.department_id as string | undefined,
          branch_id: asg.branch_id as string | undefined,
          sub_branch_id: asg.sub_branch_id as string | undefined,
          section_id: asg.section_id as string | undefined,
          section: asg.section as string | undefined,
        };
      }
    } catch (err) {
      console.error('Error creating assignment in database:', err);
    }
    return null;
  },

  async deleteAssignment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (!error) {
        await this.logActivity('Delete Assignment', `Assignment ${id} deleted`);
        return true;
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
    return false;
  },

  async toggleAssignmentCompletion(assignmentId: string, userId?: string, currentlyCompleted?: boolean): Promise<boolean> {
    if (!userId) return false;
    try {
      let isCompleted = currentlyCompleted;
      if (isCompleted === undefined) {
        const { data } = await supabase
          .from('student_assignments')
          .select('assignment_id')
          .eq('assignment_id', assignmentId)
          .eq('user_id', userId)
          .maybeSingle();
        isCompleted = !!data;
      }

      if (isCompleted) {
        await supabase
          .from('student_assignments')
          .delete()
          .eq('assignment_id', assignmentId)
          .eq('user_id', userId);
        return false;
      } else {
        await supabase
          .from('student_assignments')
          .upsert({
            assignment_id: assignmentId,
            user_id: userId,
            status: 'Completed',
            completed_at: new Date().toISOString(),
          });
        return true;
      }
    } catch (err) {
      console.error('Error toggling assignment completion:', err);
      return false;
    }
  },

  // ==========================================================================
  // ANNOUNCEMENTS
  // ==========================================================================
  async getAnnouncements(
    classGroup?: string,
    userId?: string,
    filters?: {
      department_id?: string;
      branch_id?: string;
      sub_branch_id?: string;
      section_id?: string;
      section?: string;
    }
  ): Promise<Announcement[]> {
    try {
      let query = supabase.from('announcements').select('*');
      if (classGroup && classGroup !== 'All') {
        query = query.or(`class_group.eq.${classGroup},class_group.eq.All,class_group.is.null,target_type.eq.all`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching announcements from database:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        const readSet = new Set<string>();
        if (userId) {
          try {
            const { data: readData } = await supabase
              .from('announcement_reads')
              .select('announcement_id')
              .eq('user_id', userId);

            if (readData) {
              readData.forEach((r: { announcement_id: string }) => readSet.add(r.announcement_id));
            }
          } catch {
            // Ignore
          }
        }

        let list: Announcement[] = (data as unknown as Record<string, unknown>[]).map((item) => ({
          id: item.id as string,
          title: item.title as string,
          description: (item.description as string) || '',
          content: item.content as string | undefined,
          category: item.category as Announcement['category'],
          priority: item.priority as Announcement['priority'],
          class_group: item.class_group as string | undefined,
          author: (item.author as string) || 'Academic Office',
          date: (item.created_at as string) || new Date().toISOString(),
          is_read: readSet.has(item.id as string),
          target_type: (item.target_type as Announcement['target_type']) || 'all',
          department_id: item.department_id as string | undefined,
          branch_id: item.branch_id as string | undefined,
          sub_branch_id: item.sub_branch_id as string | undefined,
          section_id: item.section_id as string | undefined,
          section: item.section as string | undefined,
        }));

        // Academic targeting filter
        if (filters) {
          list = list.filter((a) => {
            if (a.target_type === 'all' || !a.target_type) return true;
            if (a.target_type === 'branch' && filters.branch_id && a.branch_id !== filters.branch_id) return false;
            if (a.target_type === 'sub_branch' && filters.sub_branch_id && a.sub_branch_id !== filters.sub_branch_id) return false;
            if (a.target_type === 'section' && filters.section && a.section !== filters.section) return false;
            return true;
          });
        }

        return list;
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
    return [];
  },

  async createAnnouncement(
    announcement: Omit<Announcement, 'id' | 'date' | 'is_read'>
  ): Promise<Announcement | null> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcement.title,
          description: announcement.description,
          content: announcement.content || null,
          category: announcement.category || 'General',
          priority: announcement.priority || 'normal',
          class_group: announcement.class_group || 'All',
          author: announcement.author || 'Academic Office',
          target_type: announcement.target_type || 'all',
          department_id: announcement.department_id || null,
          branch_id: announcement.branch_id || null,
          sub_branch_id: announcement.sub_branch_id || null,
          section_id: announcement.section_id || null,
          section: announcement.section || null,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logActivity('Publish Announcement', `Announcement "${announcement.title}" (${announcement.category})`);
        const item = data as unknown as Record<string, unknown>;
        return {
          id: item.id as string,
          title: item.title as string,
          description: (item.description as string) || '',
          content: item.content as string | undefined,
          category: item.category as Announcement['category'],
          priority: item.priority as Announcement['priority'],
          class_group: item.class_group as string | undefined,
          author: item.author as string,
          date: (item.created_at as string) || new Date().toISOString(),
          is_read: false,
        };
      }
    } catch (err) {
      console.error('Error creating announcement:', err);
    }
    return null;
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (!error) {
        await this.logActivity('Delete Announcement', `Announcement ${id} deleted`);
        return true;
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
    return false;
  },

  async markAnnouncementRead(id: string, userId?: string): Promise<void> {
    if (!userId) return;
    try {
      await supabase.from('announcement_reads').upsert({
        announcement_id: id,
        user_id: userId,
      });
    } catch {
      // Ignore
    }
  },

  async markAllAnnouncementsRead(userId?: string): Promise<void> {
    if (!userId) return;
    try {
      const list = await this.getAnnouncements();
      const entries = list.map((a) => ({ announcement_id: a.id, user_id: userId }));
      if (entries.length > 0) {
        await supabase.from('announcement_reads').upsert(entries);
      }
    } catch {
      // Ignore
    }
  },

  // ==========================================================================
  // ACADEMIC RESOURCES (PDFS)
  // ==========================================================================
  async getResources(
    filters?: {
      category?: string;
      subject?: string;
      semester?: string;
      search?: string;
      department_id?: string;
      branch_id?: string;
      sub_branch_id?: string;
      sub_branch?: string;
      section_id?: string;
      class_group?: string;
    },
    userId?: string
  ): Promise<AcademicResource[]> {
    try {
      let query = supabase.from('pdfs').select('*').order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Error fetching pdfs from database:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        const bookmarkSet = new Set<string>();
        if (userId) {
          try {
            const { data: bData } = await supabase
              .from('resource_bookmarks')
              .select('resource_id')
              .eq('user_id', userId);
            if (bData) {
              bData.forEach((b: { resource_id: string }) => bookmarkSet.add(b.resource_id));
            }
          } catch {
            // Ignore
          }
        }

        let list: AcademicResource[] = (data as unknown as Record<string, unknown>[]).map((item) => ({
          id: item.id as string,
          title: (item.title as string) || 'Document',
          description: item.description as string | null,
          subject: (item.subject_name as string) || (item.category as string) || 'General',
          subject_id: item.subject_id as string | undefined,
          unit_or_topic: (item.unit_or_topic as string) || 'General Topic',
          category: (item.category as AcademicResource['category']) || 'Notes',
          semester: (item.semester as string) || 'Semester 1',
          class_group: item.class_group as string | undefined,
          file_url: (item.file_url as string) || '',
          file_size: (item.file_size as string) || '1.0 MB',
          file_type: (item.file_type as string) || 'PDF',
          uploader_name: (item.uploader_name as string) || 'Academic Staff',
          created_at: (item.created_at as string) || new Date().toISOString(),
          is_bookmarked: bookmarkSet.has(item.id as string),
          exam_year: item.exam_year as string | undefined,
          exam_type: item.exam_type as string | undefined,
          department_id: item.department_id as string | undefined,
          branch_id: item.branch_id as string | undefined,
          sub_branch_id: item.sub_branch_id as string | undefined,
          section_id: item.section_id as string | undefined,
        }));

        if (filters) {
          if (filters.subject && filters.subject !== 'All') {
            list = list.filter((r) => r.subject.toLowerCase() === filters.subject?.toLowerCase());
          }
          if (filters.semester && filters.semester !== 'All') {
            list = list.filter((r) => r.semester === filters.semester);
          }
          if (filters.branch_id && filters.branch_id !== 'All') {
            list = list.filter((r) => !r.branch_id || r.branch_id === filters.branch_id);
          }
          if (filters.sub_branch_id && filters.sub_branch_id !== 'All') {
            list = list.filter((r) => !r.sub_branch_id || r.sub_branch_id === filters.sub_branch_id);
          }
          if (filters.search && filters.search.trim()) {
            const q = filters.search.toLowerCase().trim();
            list = list.filter(
              (r) =>
                r.title.toLowerCase().includes(q) ||
                (r.description && r.description.toLowerCase().includes(q)) ||
                r.subject.toLowerCase().includes(q) ||
                r.unit_or_topic.toLowerCase().includes(q)
            );
          }
        }

        return list;
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
    return [];
  },

  async uploadAndCreateResource(
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
      sub_branch_id?: string;
      section_id?: string;
    },
    uploaderName: string = 'Staff'
  ): Promise<AcademicResource | null> {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';

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
          sub_branch_id: metadata.sub_branch_id || null,
          section_id: metadata.section_id || null,
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database record failed: ${dbError.message}`);
      }

      await this.logActivity('Upload Academic Resource', `${metadata.title} (${metadata.category})`);

      const r = dbData as unknown as Record<string, unknown>;
      return {
        id: r.id as string,
        title: r.title as string,
        description: r.description as string | null,
        subject: (r.subject_name as string) || metadata.subject,
        unit_or_topic: (r.unit_or_topic as string) || 'General',
        category: r.category as AcademicResource['category'],
        semester: (r.semester as string) || 'Semester 1',
        class_group: r.class_group as string | undefined,
        file_url: r.file_url as string,
        file_size: r.file_size as string,
        file_type: r.file_type as string,
        uploader_name: r.uploader_name as string,
        created_at: r.created_at as string,
        is_bookmarked: false,
        exam_year: r.exam_year as string | undefined,
        exam_type: r.exam_type as string | undefined,
      };
    } catch (err) {
      console.error('Failed to upload and create resource:', err);
      throw err;
    }
  },

  async deleteResource(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('pdfs').delete().eq('id', id);
      if (!error) {
        await this.logActivity('Delete Resource', `Resource ${id} removed`);
        return true;
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
    }
    return false;
  },

  async toggleBookmark(resourceId: string, userId?: string, currentlyBookmarked?: boolean): Promise<boolean> {
    if (!userId) return false;
    try {
      let isBookmarked = currentlyBookmarked;
      if (isBookmarked === undefined) {
        const { data } = await supabase
          .from('resource_bookmarks')
          .select('resource_id')
          .eq('resource_id', resourceId)
          .eq('user_id', userId)
          .maybeSingle();
        isBookmarked = !!data;
      }

      if (isBookmarked) {
        await supabase
          .from('resource_bookmarks')
          .delete()
          .eq('resource_id', resourceId)
          .eq('user_id', userId);
        return false;
      } else {
        await supabase
          .from('resource_bookmarks')
          .upsert({
            resource_id: resourceId,
            user_id: userId,
          });
        return true;
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      return false;
    }
  },

  // ==========================================================================
  // STUDENTS / CLASSMATES & CONFIGURABLE ROLL ENROLLMENT
  // ==========================================================================
  async getClassmates(classGroup: string, branch?: string, section?: string): Promise<Classmate[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      if (classGroup) {
        query = query.eq('class_group', classGroup);
      } else if (branch && section) {
        query = query.eq('branch', branch).eq('section', section);
      }

      const { data, error } = await query.order('roll_number', { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as unknown as Record<string, unknown>[]).map((p) => ({
          id: p.id as string,
          roll_number: (p.roll_number as string) || '25CS000',
          full_name: (p.full_name as string) || 'Student',
          branch: (p.branch as string) || 'CSE',
          sub_branch: (p.sub_branch as string) || undefined,
          section: (p.section as string) || 'A',
          class_group: (p.class_group as string) || classGroup,
          academic_year: (p.academic_year as string) || '2026-27',
          email: p.email as string | undefined,
          is_active: p.is_active !== false,
        }));
      }
    } catch (err) {
      console.error('Failed to load classmates:', err);
    }
    return [];
  },

  async getAllStudents(searchQuery?: string): Promise<Classmate[]> {
    try {
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('roll_number', { ascending: true });

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let list: Classmate[] = (data as unknown as Record<string, unknown>[]).map((p) => ({
          id: p.id as string,
          roll_number: (p.roll_number as string) || '25CS000',
          full_name: (p.full_name as string) || 'Student',
          branch: (p.branch as string) || 'CSE',
          sub_branch: (p.sub_branch as string) || undefined,
          section: (p.section as string) || 'A',
          class_group: (p.class_group as string) || '25CS-A',
          academic_year: (p.academic_year as string) || '2026-27',
          email: p.email as string | undefined,
          is_active: p.is_active !== false,
        }));

        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          list = list.filter(
            (s) =>
              s.full_name.toLowerCase().includes(q) ||
              s.roll_number.toLowerCase().includes(q) ||
              (s.email && s.email.toLowerCase().includes(q)) ||
              (s.sub_branch && s.sub_branch.toLowerCase().includes(q))
          );
        }

        return list;
      }
    } catch (err) {
      console.error('Failed to load all students:', err);
    }
    return [];
  },

  /**
   * Enrolls student with configurable roll number parsing and relational academic hierarchy IDs
   */
  async createStudent(student: {
    full_name: string;
    roll_number: string;
    email: string;
    branch: string;
    sub_branch?: string;
    section: string;
    semester: string;
    academic_year?: string;
    department?: string;
    department_id?: string;
    branch_id?: string;
    sub_branch_id?: string;
    class_id?: string;
    section_id?: string;
    academic_year_id?: string;
    adminName?: string;
  }): Promise<Classmate | null> {
    const rollNumber = student.roll_number.trim().toUpperCase();

    // 1. Run Configurable Roll Parser
    const parsed = await this.parseStudentRoll(rollNumber);

    const branch = student.branch || parsed.mappedBranchName || 'CSE';
    const subBranch = student.sub_branch || parsed.mappedSubBranchName || 'Core';
    const section = student.section || 'A';
    const classGroup = deriveClassGroup(rollNumber, branch, section);
    const department = student.department || 'Engineering & Technology';
    const academicYear = student.academic_year || '2026–27';

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          email: student.email.trim().toLowerCase(),
          full_name: student.full_name.trim(),
          roll_number: rollNumber,
          branch,
          sub_branch: subBranch,
          section,
          semester: student.semester || 'Semester 1',
          academic_year: academicYear,
          year_of_study: '1st Year',
          department,
          class_group: classGroup,
          role: 'student',
          is_active: true,
          // Relational foreign keys
          department_id: student.department_id || null,
          branch_id: student.branch_id || parsed.mappedBranchId || null,
          sub_branch_id: student.sub_branch_id || parsed.mappedSubBranchId || null,
          class_id: student.class_id || null,
          section_id: student.section_id || null,
          academic_year_id: student.academic_year_id || null,
          // Parsed components
          joining_year: parsed.joiningYear || null,
          college_code: parsed.collegeCode || null,
          branch_code: parsed.branchCode || null,
          numeric_roll: parsed.numericRoll || null,
        })
        .select()
        .single();

      if (!error && data) {
        await this.logAdminAudit(
          student.adminName || 'Admin',
          'Create Student',
          'profiles',
          data.id,
          { roll: rollNumber, name: student.full_name, branch, subBranch, section, classGroup }
        );

        const p = data as unknown as Record<string, unknown>;
        return {
          id: p.id as string,
          roll_number: p.roll_number as string,
          full_name: p.full_name as string,
          branch: p.branch as string,
          sub_branch: p.sub_branch as string | undefined,
          section: p.section as string,
          class_group: p.class_group as string,
          academic_year: p.academic_year as string,
          email: p.email as string,
          is_active: true,
        };
      } else if (error) {
        console.error('Error inserting student:', error);
      }
    } catch (err) {
      console.error('Error creating student:', err);
    }
    return null;
  },

  async updateStudent(
    id: string,
    updates: Partial<{
      full_name: string;
      roll_number: string;
      branch: string;
      sub_branch: string;
      section: string;
      semester: string;
      email: string;
      is_active: boolean;
      department_id: string;
      branch_id: string;
      sub_branch_id: string;
      class_id: string;
      section_id: string;
      academic_year_id: string;
    }>,
    adminName: string = 'Admin'
  ): Promise<boolean> {
    try {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.roll_number || updates.branch || updates.section) {
        payload.class_group = deriveClassGroup(
          updates.roll_number || '',
          updates.branch || 'CSE',
          updates.section || 'A'
        );
      }

      const { error } = await supabase.from('profiles').update(payload).eq('id', id);
      if (!error) {
        await this.logAdminAudit(adminName, 'Update Student', 'profiles', id, updates);
        return true;
      }
    } catch (err) {
      console.error('Error updating student:', err);
    }
    return false;
  },

  async toggleStudentStatus(id: string, currentStatus: boolean, adminName: string = 'Admin'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (!error) {
        await this.logAdminAudit(adminName, 'Toggle Student Status', 'profiles', id, { newStatus: !currentStatus });
        return true;
      }
    } catch (err) {
      console.error('Error toggling student status:', err);
    }
    return false;
  },

  async bulkImportStudents(
    students: {
      roll_number: string;
      full_name: string;
      email: string;
      branch?: string;
      sub_branch?: string;
      section?: string;
      semester?: string;
      department_id?: string;
      branch_id?: string;
      sub_branch_id?: string;
      class_id?: string;
      section_id?: string;
      academic_year_id?: string;
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
      mapped_sub_branch?: string;
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
      mapped_sub_branch?: string;
      valid: boolean;
      error?: string;
    }[] = [];

    const existingRolls = new Set<string>();
    try {
      const { data } = await supabase.from('profiles').select('roll_number');
      if (data) {
        data.forEach((p: { roll_number: string }) => {
          if (p.roll_number) existingRolls.add(p.roll_number.toUpperCase());
        });
      }
    } catch {
      // Ignore
    }

    const [formats, branchCodes, branches, subBranches] = await Promise.all([
      this.getRollFormats(),
      this.getBranchCodes(),
      this.getBranches(),
      this.getSubBranches(),
    ]);

    const rowsToInsert = [];

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const lineNum = i + 1;

      if (!row.roll_number || !row.full_name || !row.email) {
        failedCount++;
        const err = `Row ${lineNum}: Missing required fields (Roll Number, Full Name, or Email)`;
        errors.push(err);
        parsedRows.push({
          roll_number: row.roll_number || 'N/A',
          full_name: row.full_name || 'N/A',
          valid: false,
          error: err,
        });
        continue;
      }

      const roll = row.roll_number.trim().toUpperCase();

      // Parse roll number
      const parsed = parseRollNumber(roll, formats, branchCodes, branches, subBranches);

      if (!parsed.isValid) {
        failedCount++;
        const err = `Row ${lineNum} (${roll}): ${parsed.errorMessage || 'Invalid roll number format'}`;
        errors.push(err);
        parsedRows.push({
          roll_number: roll,
          full_name: row.full_name,
          valid: false,
          error: err,
        });
        continue;
      }

      if (existingRolls.has(roll)) {
        duplicatesCount++;
        const err = `Row ${lineNum} (${roll}): Duplicate roll number already exists`;
        errors.push(err);
        parsedRows.push({
          roll_number: roll,
          full_name: row.full_name,
          joining_year: parsed.joiningYear,
          college_code: parsed.collegeCode,
          branch_code: parsed.branchCode,
          numeric_roll: parsed.numericRoll,
          mapped_branch: parsed.mappedBranchName,
          mapped_sub_branch: parsed.mappedSubBranchName,
          valid: false,
          error: err,
        });
        continue;
      }

      existingRolls.add(roll);

      const branch = (row.branch || parsed.mappedBranchName || 'CSE').trim();
      const subBranch = (row.sub_branch || parsed.mappedSubBranchName || 'Core').trim();
      const section = (row.section || 'A').trim().toUpperCase();
      const semester = row.semester || 'Semester 1';
      const classGroup = deriveClassGroup(roll, branch, section);

      parsedRows.push({
        roll_number: roll,
        full_name: row.full_name,
        joining_year: parsed.joiningYear,
        college_code: parsed.collegeCode,
        branch_code: parsed.branchCode,
        numeric_roll: parsed.numericRoll,
        mapped_branch: branch,
        mapped_sub_branch: subBranch,
        valid: true,
      });

      rowsToInsert.push({
        user_id: `usr-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        email: row.email.trim().toLowerCase(),
        full_name: row.full_name.trim(),
        roll_number: roll,
        branch,
        sub_branch: subBranch,
        section,
        semester,
        academic_year: '2026–27',
        year_of_study: '1st Year',
        department: `${branch} Department`,
        class_group: classGroup,
        role: 'student',
        is_active: true,
        // Relational fields
        department_id: row.department_id || null,
        branch_id: row.branch_id || parsed.mappedBranchId || null,
        sub_branch_id: row.sub_branch_id || parsed.mappedSubBranchId || null,
        class_id: row.class_id || null,
        section_id: row.section_id || null,
        academic_year_id: row.academic_year_id || null,
        // Parsed details
        joining_year: parsed.joiningYear || null,
        college_code: parsed.collegeCode || null,
        branch_code: parsed.branchCode || null,
        numeric_roll: parsed.numericRoll || null,
      });
    }

    if (rowsToInsert.length > 0) {
      try {
        const { error } = await supabase.from('profiles').insert(rowsToInsert);
        if (error) {
          failedCount += rowsToInsert.length;
          errors.push(`Database bulk insertion error: ${error.message}`);
        } else {
          successCount = rowsToInsert.length;
          await this.logAdminAudit(adminName, 'Bulk Student Import', 'profiles', undefined, {
            count: successCount,
          });
        }
      } catch (err: unknown) {
        failedCount += rowsToInsert.length;
        errors.push(`Bulk import failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      successCount,
      failedCount,
      duplicatesCount,
      errors,
      parsedRows,
    };
  },

  // ==========================================================================
  // REPORTS
  // ==========================================================================
  async getReports(): Promise<ReportItem[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return (data as unknown[]).map((r) => r as ReportItem);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
    return [];
  },

  async submitReport(
    report: Omit<ReportItem, 'id' | 'status' | 'created_at'>
  ): Promise<ReportItem | null> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_name: report.reporter_name,
          reporter_email: report.reporter_email,
          report_type: report.report_type,
          subject: report.subject,
          description: report.description,
          user_id: report.user_id || null,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && data) {
        return data as unknown as ReportItem;
      }
    } catch (err) {
      console.error('Failed to submit report:', err);
    }
    return null;
  },

  async updateReportStatus(
    id: string,
    status: ReportItem['status'],
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const payload: Record<string, unknown> = { status };
      if (adminNotes !== undefined) payload.admin_notes = adminNotes;

      const { error } = await supabase.from('reports').update(payload).eq('id', id);
      if (!error) {
        await this.logActivity('Update Report Ticket', `Ticket ${id} status set to ${status}`);
        return true;
      }
    } catch (err) {
      console.error('Error updating report status:', err);
    }
    return false;
  },

  // ==========================================================================
  // RATINGS
  // ==========================================================================
  async submitRating(rating: number, feedback: string, category: string = 'General'): Promise<void> {
    try {
      await supabase.from('ratings').insert({
        rating,
        feedback,
        category,
      });
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  },

  async getRatings(): Promise<RatingFeedback[]> {
    try {
      const { data, error } = await supabase.from('ratings').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data as unknown as RatingFeedback[];
      }
    } catch {
      // Ignore
    }
    return [];
  },

  // ==========================================================================
  // GENERAL ACTIVITY LOGS
  // ==========================================================================
  async getActivityLogs(): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        return data as unknown as ActivityLog[];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async logActivity(action: string, details: string, performedBy: string = 'Admin'): Promise<void> {
    try {
      await supabase.from('activity_logs').insert({
        action,
        details,
        performed_by: performedBy,
      });
    } catch {
      // Non-blocking
    }
  },

  // ==========================================================================
  // REAL ADMIN OVERVIEW STATS
  // ==========================================================================
  async getAdminStats(): Promise<{
    totalStudents: number;
    totalClasses: number;
    totalDepartments: number;
    totalBranches: number;
    totalSubBranches: number;
    totalSections: number;
    totalSubjects: number;
    totalResources: number;
    totalAssignments: number;
    totalAnnouncements: number;
    openReports: number;
  }> {
    try {
      const [
        studentsRes,
        classesRes,
        deptsRes,
        branchesRes,
        subBranchesRes,
        sectionsRes,
        subjectsRes,
        resourcesRes,
        assignmentsRes,
        announcementsRes,
        reportsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
        supabase.from('branches').select('id', { count: 'exact', head: true }),
        supabase.from('sub_branches').select('id', { count: 'exact', head: true }),
        supabase.from('sections').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('pdfs').select('id', { count: 'exact', head: true }),
        supabase.from('assignments').select('id', { count: 'exact', head: true }),
        supabase.from('announcements').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
      ]);

      return {
        totalStudents: studentsRes.count || 0,
        totalClasses: classesRes.count || 2,
        totalDepartments: deptsRes.count || 3,
        totalBranches: branchesRes.count || 4,
        totalSubBranches: subBranchesRes.count || 6,
        totalSections: sectionsRes.count || 3,
        totalSubjects: subjectsRes.count || 0,
        totalResources: resourcesRes.count || 0,
        totalAssignments: assignmentsRes.count || 0,
        totalAnnouncements: announcementsRes.count || 0,
        openReports: reportsRes.count || 0,
      };
    } catch (err) {
      console.error('Error calculating admin stats from database:', err);
      return {
        totalStudents: 0,
        totalClasses: 2,
        totalDepartments: 3,
        totalBranches: 4,
        totalSubBranches: 6,
        totalSections: 3,
        totalSubjects: 0,
        totalResources: 0,
        totalAssignments: 0,
        totalAnnouncements: 0,
        openReports: 0,
      };
    }
  },

  // ==========================================================================
  // REAL USER MANAGEMENT & ADMINISTRATION
  // ==========================================================================

  async getUsers(params: {
    search?: string;
    role?: string;
    department?: string;
    branch?: string;
    sub_branch?: string;
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
    const page = params.page || 1;
    const pageSize = params.pageSize || 15;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      if (params.role && params.role !== 'all') {
        query = query.eq('role', params.role);
      }
      if (params.department && params.department !== 'all') {
        query = query.ilike('department', `%${params.department}%`);
      }
      if (params.branch && params.branch !== 'all') {
        query = query.ilike('branch', `%${params.branch}%`);
      }
      if (params.sub_branch && params.sub_branch !== 'all') {
        query = query.ilike('sub_branch', `%${params.sub_branch}%`);
      }
      if (params.academic_year && params.academic_year !== 'all') {
        query = query.ilike('academic_year', `%${params.academic_year}%`);
      }
      if (params.year && params.year !== 'all') {
        query = query.ilike('year_of_study', `%${params.year}%`);
      }
      if (params.semester && params.semester !== 'all') {
        query = query.ilike('semester', `%${params.semester}%`);
      }
      if (params.section && params.section !== 'all') {
        query = query.ilike('section', `%${params.section}%`);
      }
      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params.search && params.search.trim()) {
        const term = params.search.trim();
        query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,roll_number.ilike.%${term}%`);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error && data) {
        const users: AdminUserItem[] = (data as unknown as Record<string, unknown>[]).map((u) => {
          const rawStatus = (u.status as string) || (u.is_active === false ? 'inactive' : 'active');
          const status: UserStatus = rawStatus === 'suspended' ? 'suspended' : rawStatus === 'inactive' ? 'inactive' : 'active';
          return {
            id: (u.id as string) || (u.user_id as string),
            user_id: (u.user_id as string) || (u.id as string),
            email: (u.email as string) || '',
            full_name: (u.full_name as string) || 'User',
            role: (u.role as UserRole) || 'student',
            roll_number: u.roll_number as string | undefined,
            department: u.department as string | undefined,
            branch: u.branch as string | undefined,
            sub_branch: u.sub_branch as string | undefined,
            academic_year: u.academic_year as string | undefined,
            year_of_study: u.year_of_study as string | undefined,
            semester: u.semester as string | undefined,
            section: u.section as string | undefined,
            class_group: u.class_group as string | undefined,
            status,
            is_active: status === 'active',
            created_at: (u.created_at as string) || new Date().toISOString(),
          };
        });

        const total = count ?? users.length;
        return {
          users,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        };
      }
    } catch (err) {
      console.error('Failed to load users from database:', err);
    }

    return {
      users: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  },

  async createUser(userData: {
    full_name: string;
    email: string;
    password?: string;
    role: UserRole;
    roll_number?: string;
    department?: string;
    branch?: string;
    sub_branch?: string;
    academic_year?: string;
    year_of_study?: string;
    semester?: string;
    section?: string;
    class_group?: string;
    department_id?: string;
    branch_id?: string;
    sub_branch_id?: string;
    class_id?: string;
    section_id?: string;
    academic_year_id?: string;
    status?: UserStatus;
  }): Promise<{ success: boolean; user?: AdminUserItem; error?: string }> {
    try {
      const email = userData.email.trim().toLowerCase();
      const fullName = userData.full_name.trim();
      const role = userData.role || 'student';
      const rollNumber = userData.roll_number ? userData.roll_number.trim().toUpperCase() : (role === 'admin' ? `ADMIN-${Date.now().toString().slice(-4)}` : '');
      const branch = userData.branch || 'CSE';
      const section = userData.section || 'A';
      const classGroup = userData.class_group || deriveClassGroup(rollNumber, branch, section);
      const initialStatus = userData.status || 'active';

      // 1. Create real Auth user via transient client so admin's active session is never lost
      const transient = createTransientClient();
      const password = userData.password || `Study@${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: authData, error: authError } = await transient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            roll_number: rollNumber,
            role,
            branch,
            department: userData.department || `${branch} Department`,
            section,
            semester: userData.semester || 'Semester 1',
            academic_year: userData.academic_year || '2026–27',
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      const newUserId = authData.user?.id || `usr-${Date.now()}`;

      // 2. Insert/upsert into profiles table
      const profileRow = {
        user_id: newUserId,
        email,
        full_name: fullName,
        roll_number: rollNumber,
        department: userData.department || `${branch} Department`,
        branch,
        sub_branch: userData.sub_branch || null,
        academic_year: userData.academic_year || '2026–27',
        year_of_study: userData.year_of_study || (role === 'admin' ? 'Staff' : '1st Year'),
        section,
        semester: userData.semester || 'Semester 1',
        class_group: classGroup,
        role,
        status: initialStatus,
        is_active: initialStatus === 'active',
        department_id: userData.department_id || null,
        branch_id: userData.branch_id || null,
        sub_branch_id: userData.sub_branch_id || null,
        class_id: userData.class_id || null,
        section_id: userData.section_id || null,
        academic_year_id: userData.academic_year_id || null,
      };

      const { error: profError } = await supabase.from('profiles').upsert(profileRow);
      if (profError) {
        console.warn('Profile insert warning:', profError.message);
      }

      // 3. Upsert user_roles
      try {
        await supabase.from('user_roles').upsert({
          user_id: newUserId,
          role,
        });
      } catch {
        // ignore
      }

      await this.logAdminAudit('Admin', `Create ${role === 'admin' ? 'Admin' : 'Student'} User`, 'profiles', newUserId, {
        email,
        roll_number: rollNumber,
        role,
      });

      return {
        success: true,
        user: {
          id: newUserId,
          user_id: newUserId,
          email,
          full_name: fullName,
          role,
          roll_number: rollNumber,
          department: userData.department,
          branch,
          sub_branch: userData.sub_branch,
          academic_year: userData.academic_year,
          year_of_study: userData.year_of_study,
          semester: userData.semester,
          section,
          class_group: classGroup,
          status: initialStatus,
          is_active: initialStatus === 'active',
          created_at: new Date().toISOString(),
        },
      };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create user.' };
    }
  },

  async setUserStatus(userId: string, newStatus: UserStatus, currentAdminId?: string): Promise<{ success: boolean; error?: string }> {
    if (currentAdminId && userId === currentAdminId && newStatus !== 'active') {
      return { success: false, error: 'You cannot deactivate or suspend your own administrator account.' };
    }

    try {
      // 1. Try secure RPC
      const { error: rpcError } = await supabase.rpc('admin_set_user_status', {
        _target_user_id: userId,
        _new_status: newStatus,
      });

      if (!rpcError) {
        return { success: true };
      }

      // 2. Direct fallback with strict administrator safeguards
      const { data: targetProfile } = await supabase.from('profiles').select('role').eq('user_id', userId).maybeSingle();
      if (targetProfile?.role === 'admin' && newStatus !== 'active') {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin')
          .eq('status', 'active')
          .neq('user_id', userId);

        if ((count || 0) < 1) {
          return { success: false, error: 'At least one active administrator must remain.' };
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: newStatus,
          is_active: newStatus === 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await this.logAdminAudit('Admin', `Set User Status to ${newStatus}`, 'profiles', userId, { newStatus });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update user status.' };
    }
  },

  async deleteUser(userId: string, currentAdminId?: string): Promise<{ success: boolean; error?: string }> {
    if (currentAdminId && userId === currentAdminId) {
      return { success: false, error: 'You cannot delete your own account.' };
    }

    try {
      // 1. Try secure RPC function admin_delete_user
      const { error: rpcError } = await supabase.rpc('admin_delete_user', {
        _target_user_id: userId,
      });

      if (!rpcError) {
        return { success: true };
      }

      // 2. Fallback client-side with full guards
      const { data: targetProfile } = await supabase.from('profiles').select('role, email').eq('user_id', userId).maybeSingle();
      if (targetProfile?.role === 'admin') {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin')
          .eq('status', 'active')
          .neq('user_id', userId);

        if ((count || 0) < 1) {
          return { success: false, error: 'At least one active administrator must remain.' };
        }
      }

      // Delete dependent rows
      await Promise.all([
        supabase.from('resource_bookmarks').delete().eq('user_id', userId),
        supabase.from('student_assignments').delete().eq('user_id', userId),
        supabase.from('announcement_reads').delete().eq('user_id', userId),
        supabase.from('user_roles').delete().eq('user_id', userId),
      ]);

      const { error: delError } = await supabase.from('profiles').delete().eq('user_id', userId);
      if (delError) {
        return { success: false, error: delError.message };
      }

      await this.logAdminAudit('Admin', 'Delete User', 'profiles', userId, { email: targetProfile?.email, role: targetProfile?.role });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete user.' };
    }
  },

  async updateUser(userId: string, updates: Partial<AdminUserItem>, currentAdminId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (updates.role) {
        if (currentAdminId && userId === currentAdminId && updates.role !== 'admin') {
          return { success: false, error: 'You cannot modify your own administrator role.' };
        }

        const { data: targetProfile } = await supabase.from('profiles').select('role').eq('user_id', userId).maybeSingle();
        if (targetProfile?.role === 'admin' && updates.role === 'student') {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'admin')
            .eq('status', 'active')
            .neq('user_id', userId);

          if ((count || 0) < 1) {
            return { success: false, error: 'At least one active administrator must remain.' };
          }
        }

        try {
          await supabase.rpc('admin_update_user_role', {
            _target_user_id: userId,
            _new_role: updates.role,
          });
        } catch {
          // ignore
        }
      }

      const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
      delete payload.id;
      delete payload.user_id;

      if (updates.status) {
        payload.is_active = updates.status === 'active';
      }

      const { error } = await supabase.from('profiles').update(payload).eq('user_id', userId);
      if (error) {
        return { success: false, error: error.message };
      }

      await this.logAdminAudit('Admin', 'Update User Profile', 'profiles', userId, updates);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update user.' };
    }
  },
};
