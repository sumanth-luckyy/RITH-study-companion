import { useState, useEffect, useCallback, useMemo } from 'react';
import { academicService } from '@/services/academicService';
import {
  Department,
  Branch,
  AcademicYear,
  AcademicClass,
  Section,
  BranchCodeMapping,
} from '@/types/academic';

export interface AcademicHierarchyState {
  departments: Department[];
  branches: Branch[];
  academicYears: AcademicYear[];
  classes: AcademicClass[];
  sections: Section[];
  branchCodes: BranchCodeMapping[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;

  // Filtered by active status (for new record creation/selection)
  activeDepartments: Department[];
  activeBranches: Branch[];
  activeAcademicYears: AcademicYear[];
  activeClasses: AcademicClass[];
  activeSections: Section[];

  // Cascading Helpers
  getBranchesForDepartment: (departmentId?: string, onlyActive?: boolean) => Branch[];
  getClassesForBranch: (branchId?: string, onlyActive?: boolean) => AcademicClass[];
  getYearsForBranch: (branchIdOrName?: string) => string[];
  getSemestersForBranch: (branchIdOrName?: string, yearOfStudy?: string) => string[];
  getSectionsForClass: (classId?: string, onlyActive?: boolean) => Section[];
  getSectionsForBranchAndClass: (branchIdOrName?: string, sectionCodeOrName?: string) => Section[];

  // Relational Lookups
  findDepartment: (idOrName?: string) => Department | undefined;
  findBranch: (idOrNameOrCode?: string) => Branch | undefined;
  findClass: (idOrNameOrCode?: string) => AcademicClass | undefined;
  findSection: (idOrNameOrCode?: string) => Section | undefined;

  // Name Resolvers
  getDepartmentName: (id?: string) => string;
  getBranchName: (id?: string) => string;
  getAcademicYearName: (id?: string) => string;
}

export function useAcademicHierarchy(): AcademicHierarchyState {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [branchCodes, setBranchCodes] = useState<BranchCodeMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const snapshot = await academicService.getAcademicHierarchySnapshot(true);
      setDepartments(snapshot.departments);
      setBranches(snapshot.branches);
      setAcademicYears(snapshot.academicYears);
      setClasses(snapshot.classes);
      setSections(snapshot.sections);
      setBranchCodes(snapshot.branchCodes);
    } catch (err: unknown) {
      console.error('Failed to load academic hierarchy:', err);
      setError(err instanceof Error ? err : new Error('Failed to load hierarchy'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and automatic real-time listener for hierarchy mutations
  useEffect(() => {
    loadData();

    // Listen to hierarchy changes dispatched across any admin component or service action
    const handleHierarchyChange = () => {
      loadData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('academic-hierarchy-updated', handleHierarchyChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('academic-hierarchy-updated', handleHierarchyChange);
      }
    };
  }, [loadData]);

  // Active-only entity filters (used for dropdowns when creating/editing new records)
  const activeDepartments = useMemo(() => departments.filter((d) => d.is_active !== false), [departments]);
  const activeBranches = useMemo(() => branches.filter((b) => b.is_active !== false), [branches]);
  const activeAcademicYears = useMemo(() => academicYears.filter((ay) => ay.is_active !== false), [academicYears]);
  const activeClasses = useMemo(() => classes.filter((c) => c.is_active !== false), [classes]);
  const activeSections = useMemo(() => sections.filter((s) => s.is_active !== false), [sections]);

  // Lookup helpers
  const findDepartment = useCallback(
    (idOrName?: string) => {
      if (!idOrName || idOrName === 'All' || idOrName === 'all') return undefined;
      const lower = idOrName.toLowerCase();
      return departments.find((d) => d.id === idOrName || d.name.toLowerCase() === lower || d.code.toLowerCase() === lower);
    },
    [departments]
  );

  const findBranch = useCallback(
    (idOrNameOrCode?: string) => {
      if (!idOrNameOrCode || idOrNameOrCode === 'All' || idOrNameOrCode === 'all') return undefined;
      const lower = idOrNameOrCode.toLowerCase();
      return branches.find(
        (b) =>
          b.id === idOrNameOrCode ||
          b.code.toLowerCase() === lower ||
          b.name.toLowerCase() === lower ||
          b.name.toLowerCase().includes(lower) ||
          lower.includes(b.name.toLowerCase())
      );
    },
    [branches]
  );

  const findClass = useCallback(
    (idOrNameOrCode?: string) => {
      if (!idOrNameOrCode) return undefined;
      const lower = idOrNameOrCode.toLowerCase();
      return classes.find((c) => c.id === idOrNameOrCode || c.name.toLowerCase() === lower || (c.code && c.code.toLowerCase() === lower));
    },
    [classes]
  );

  const findSection = useCallback(
    (idOrNameOrCode?: string) => {
      if (!idOrNameOrCode) return undefined;
      const lower = idOrNameOrCode.toLowerCase();
      return sections.find((s) => s.id === idOrNameOrCode || s.name.toLowerCase() === lower || s.code.toLowerCase() === lower);
    },
    [sections]
  );

  // Cascading resolvers:
  // 1. Branches for Department
  const getBranchesForDepartment = useCallback(
    (departmentId?: string, onlyActive: boolean = true) => {
      const source = onlyActive ? activeBranches : branches;
      if (!departmentId || departmentId === 'All' || departmentId === 'all') {
        return source;
      }
      const dept = findDepartment(departmentId);
      const targetDeptId = dept ? dept.id : departmentId;
      return source.filter((b) => b.department_id === targetDeptId);
    },
    [activeBranches, branches, findDepartment]
  );

  // 2. Classes for Branch
  const getClassesForBranch = useCallback(
    (branchId?: string, onlyActive: boolean = true) => {
      const source = onlyActive ? activeClasses : classes;
      if (!branchId || branchId === 'All' || branchId === 'all') {
        return source;
      }
      const br = findBranch(branchId);
      const targetBranchId = br ? br.id : branchId;
      return source.filter((c) => c.branch_id === targetBranchId);
    },
    [activeClasses, classes, findBranch]
  );

  // 3. Unique Years of Study for a Branch (derived from real classes)
  const getYearsForBranch = useCallback(
    (branchIdOrName?: string) => {
      const standardYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      if (!branchIdOrName || branchIdOrName === 'All' || branchIdOrName === 'all') {
        return standardYears;
      }
      const branchClasses = getClassesForBranch(branchIdOrName, true);
      const yearsFromClasses = Array.from(new Set(branchClasses.map((c) => c.year_of_study).filter(Boolean)));
      if (yearsFromClasses.length > 0) {
        return standardYears.filter((y) => yearsFromClasses.includes(y));
      }
      return standardYears;
    },
    [getClassesForBranch]
  );

  // 4. Unique Semesters for a Branch & Year (derived from real classes)
  const getSemestersForBranch = useCallback(
    (branchIdOrName?: string, yearOfStudy?: string) => {
      const standardSemesters = [
        'Semester 1',
        'Semester 2',
        'Semester 3',
        'Semester 4',
        'Semester 5',
        'Semester 6',
        'Semester 7',
        'Semester 8',
      ];

      if (!branchIdOrName || branchIdOrName === 'All' || branchIdOrName === 'all') {
        if (!yearOfStudy || yearOfStudy === 'All' || yearOfStudy === 'all') {
          return standardSemesters;
        }
      }

      const branchClasses = getClassesForBranch(branchIdOrName, true);
      const filteredClasses =
        yearOfStudy && yearOfStudy !== 'All' && yearOfStudy !== 'all'
          ? branchClasses.filter((c) => c.year_of_study === yearOfStudy)
          : branchClasses;

      const semsFromClasses = Array.from(new Set(filteredClasses.map((c) => c.semester).filter(Boolean)));
      if (semsFromClasses.length > 0) {
        return standardSemesters.filter((s) => semsFromClasses.includes(s));
      }

      // If classes haven't been created yet for this combination, map standard semesters
      if (yearOfStudy && yearOfStudy !== 'All' && yearOfStudy !== 'all') {
        switch (yearOfStudy) {
          case '1st Year':
            return ['Semester 1', 'Semester 2'];
          case '2nd Year':
            return ['Semester 3', 'Semester 4'];
          case '3rd Year':
            return ['Semester 5', 'Semester 6'];
          case '4th Year':
            return ['Semester 7', 'Semester 8'];
          default:
            return standardSemesters;
        }
      }

      return standardSemesters;
    },
    [getClassesForBranch]
  );

  // 5. Sections for Class
  const getSectionsForClass = useCallback(
    (classId?: string, onlyActive: boolean = true) => {
      const source = onlyActive ? activeSections : sections;
      if (!classId || classId === 'All' || classId === 'all') {
        return source;
      }
      return source.filter((s) => s.class_id === classId);
    },
    [activeSections, sections]
  );

  // 6. Sections for Branch & Class
  const getSectionsForBranchAndClass = useCallback(
    (branchIdOrName?: string, sectionCodeOrName?: string) => {
      let candidateClasses = activeClasses;
      if (branchIdOrName && branchIdOrName !== 'All') {
        const br = findBranch(branchIdOrName);
        if (br) {
          candidateClasses = activeClasses.filter((c) => c.branch_id === br.id);
        }
      }
      const classIds = new Set(candidateClasses.map((c) => c.id));
      let candidateSections = activeSections.filter((s) => classIds.has(s.class_id));

      if (sectionCodeOrName && sectionCodeOrName !== 'All') {
        const secUpper = sectionCodeOrName.toUpperCase();
        candidateSections = candidateSections.filter((s) => s.code.toUpperCase() === secUpper || s.name.toUpperCase() === secUpper);
      }

      return candidateSections.length > 0 ? candidateSections : activeSections;
    },
    [activeClasses, activeSections, findBranch]
  );

  // Label resolvers
  const getDepartmentName = useCallback(
    (id?: string) => {
      if (!id) return '';
      const d = departments.find((item) => item.id === id);
      return d ? d.name : id;
    },
    [departments]
  );

  const getBranchName = useCallback(
    (id?: string) => {
      if (!id) return '';
      const b = branches.find((item) => item.id === id);
      return b ? b.name : id;
    },
    [branches]
  );

  const getAcademicYearName = useCallback(
    (id?: string) => {
      if (!id) return '';
      const ay = academicYears.find((item) => item.id === id);
      return ay ? ay.name : id;
    },
    [academicYears]
  );

  return {
    departments,
    branches,
    academicYears,
    classes,
    sections,
    branchCodes,
    isLoading,
    error,
    refresh: loadData,

    activeDepartments,
    activeBranches,
    activeAcademicYears,
    activeClasses,
    activeSections,

    getBranchesForDepartment,
    getClassesForBranch,
    getYearsForBranch,
    getSemestersForBranch,
    getSectionsForClass,
    getSectionsForBranchAndClass,

    findDepartment,
    findBranch,
    findClass,
    findSection,

    getDepartmentName,
    getBranchName,
    getAcademicYearName,
  };
}
