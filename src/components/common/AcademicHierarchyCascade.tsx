import React from 'react';
import { useAcademicHierarchy } from '@/hooks/useAcademicHierarchy';
import { Layers, Building, GitFork, Calendar, BookOpen, Hash } from 'lucide-react';

export interface AcademicSelectionValues {
  department_id?: string;
  department?: string;
  branch_id?: string;
  branch?: string;
  academic_year_id?: string;
  academic_year?: string;
  year_of_study?: string;
  semester?: string;
  section_id?: string;
  section?: string;
}

export interface AcademicHierarchyCascadeProps {
  values: AcademicSelectionValues;
  onChange: (updated: AcademicSelectionValues) => void;
  showDepartment?: boolean;
  showBranch?: boolean;
  showAcademicYear?: boolean;
  showYear?: boolean;
  showSemester?: boolean;
  showSection?: boolean;
  allowAllOption?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AcademicHierarchyCascade({
  values,
  onChange,
  showDepartment = true,
  showBranch = true,
  showAcademicYear = true,
  showYear = true,
  showSemester = true,
  showSection = true,
  allowAllOption = true,
  required = false,
  disabled = false,
  className = '',
}: AcademicHierarchyCascadeProps) {
  const hierarchy = useAcademicHierarchy();

  // Cascading options derived from current selections
  const availableBranches = hierarchy.getBranchesForDepartment(values.department_id || values.department, true);
  const availableYears = hierarchy.getYearsForBranch(values.branch_id || values.branch);
  const availableSemesters = hierarchy.getSemestersForBranch(values.branch_id || values.branch, values.year_of_study);
  const availableSections = hierarchy.getSectionsForBranchAndClass(values.branch_id || values.branch);

  // Department Change
  const handleDepartmentChange = (deptVal: string) => {
    if (deptVal === 'All' || !deptVal) {
      onChange({
        ...values,
        department_id: '',
        department: allowAllOption ? 'All' : '',
        branch_id: '',
        branch: allowAllOption ? 'All' : '',
      });
      return;
    }
    const deptObj = hierarchy.findDepartment(deptVal);
    onChange({
      ...values,
      department_id: deptObj?.id || '',
      department: deptObj?.name || deptVal,
      // reset downstream branch if not valid
      branch_id: '',
      branch: allowAllOption ? 'All' : '',
    });
  };

  // Branch Change
  const handleBranchChange = (branchVal: string) => {
    if (branchVal === 'All' || !branchVal) {
      onChange({
        ...values,
        branch_id: '',
        branch: allowAllOption ? 'All' : '',
      });
      return;
    }
    const branchObj = hierarchy.findBranch(branchVal);
    onChange({
      ...values,
      branch_id: branchObj?.id || '',
      branch: branchObj?.name || branchVal,
      // Ensure department is also linked if known
      department_id: branchObj?.department_id || values.department_id,
      department: branchObj ? hierarchy.getDepartmentName(branchObj.department_id) : values.department,
    });
  };

  // Academic Year Change
  const handleAcademicYearChange = (ayVal: string) => {
    if (ayVal === 'All' || !ayVal) {
      onChange({
        ...values,
        academic_year_id: '',
        academic_year: allowAllOption ? 'All' : '',
      });
      return;
    }
    const ayObj = hierarchy.academicYears.find((y) => y.id === ayVal || y.name === ayVal);
    onChange({
      ...values,
      academic_year_id: ayObj?.id || '',
      academic_year: ayObj?.name || ayVal,
    });
  };

  // Year of Study Change
  const handleYearChange = (yrVal: string) => {
    onChange({
      ...values,
      year_of_study: yrVal,
    });
  };

  // Semester Change
  const handleSemesterChange = (semVal: string) => {
    onChange({
      ...values,
      semester: semVal,
    });
  };

  // Section Change
  const handleSectionChange = (secVal: string) => {
    if (secVal === 'All' || !secVal) {
      onChange({
        ...values,
        section_id: '',
        section: allowAllOption ? 'All' : '',
      });
      return;
    }
    const secObj = hierarchy.findSection(secVal);
    onChange({
      ...values,
      section_id: secObj?.id || '',
      section: secObj?.code || secVal,
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 1. Department */}
        {showDepartment && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Building className="w-3 h-3 text-primary" />
              Department {required && '*'}
            </label>
            <select
              disabled={disabled}
              value={values.department || (allowAllOption ? 'All' : '')}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground h-9 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allowAllOption && <option value="All">All Departments</option>}
              {hierarchy.activeDepartments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 2. Branch */}
        {showBranch && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <GitFork className="w-3 h-3 text-cyan-500" />
              Branch / Program {required && '*'}
            </label>
            <select
              disabled={disabled}
              value={values.branch || (allowAllOption ? 'All' : '')}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground h-9 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allowAllOption && <option value="All">All Branches</option>}
              {availableBranches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 3. Academic Year */}
        {showAcademicYear && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-500" />
              Academic Year
            </label>
            <select
              disabled={disabled}
              value={values.academic_year || (allowAllOption ? 'All' : '')}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground h-9 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allowAllOption && <option value="All">All Academic Years</option>}
              {hierarchy.activeAcademicYears.map((ay) => (
                <option key={ay.id} value={ay.name}>
                  {ay.name} {ay.is_current ? '• (Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 4. Year of Study */}
        {showYear && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-500" />
              Year of Study
            </label>
            <select
              disabled={disabled}
              value={values.year_of_study || (allowAllOption ? 'All' : '')}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground h-9 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allowAllOption && <option value="All">All Years</option>}
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 5. Semester */}
        {showSemester && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Layers className="w-3 h-3 text-sky-500" />
              Semester
            </label>
            <select
              disabled={disabled}
              value={values.semester || (allowAllOption ? 'All' : '')}
              onChange={(e) => handleSemesterChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground h-9 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allowAllOption && <option value="All">All Semesters</option>}
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 6. Section */}
        {showSection && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Hash className="w-3 h-3 text-rose-500" />
              Section
            </label>
            <select
              disabled={disabled}
              value={values.section || (allowAllOption ? 'All' : '')}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground h-9 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allowAllOption && <option value="All">All Sections</option>}
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.code}>
                  Section {sec.code} ({sec.name})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
