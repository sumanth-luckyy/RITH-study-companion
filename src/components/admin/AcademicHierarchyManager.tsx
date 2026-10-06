import React, { useState, useEffect } from 'react';
import {
  Layers,
  Building,
  GitFork,
  Calendar,
  Grid,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Hash,
  Sparkles,
} from 'lucide-react';
import { academicService } from '@/services/academicService';
import {
  Department,
  Branch,
  SubBranch,
  AcademicYear,
  AcademicClass,
  Section,
  BranchCodeMapping,
} from '@/types/academic';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type HierarchyTab =
  | 'departments'
  | 'branches'
  | 'sub_branches'
  | 'academic_years'
  | 'classes'
  | 'sections'
  | 'branch_codes';

export function AcademicHierarchyManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<HierarchyTab>('departments');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [subBranches, setSubBranches] = useState<SubBranch[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [branchCodes, setBranchCodes] = useState<BranchCodeMapping[]>([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);

  // Forms
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', is_active: true });
  const [branchForm, setBranchForm] = useState({ department_id: '', name: '', code: '', description: '', is_active: true });
  const [subBranchForm, setSubBranchForm] = useState({ branch_id: '', name: '', code: '', description: '', is_active: true });
  const [yearForm, setYearForm] = useState({ name: '', start_year: 2026, end_year: 2027, is_current: true, is_active: true });
  const [classForm, setClassForm] = useState({
    name: '',
    branch_id: '',
    sub_branch_id: '',
    academic_year_id: '',
    year_of_study: '1st Year',
    semester: 'Semester 1',
    code: '',
    is_active: true,
  });
  const [sectionForm, setSectionForm] = useState({ class_id: '', name: '', code: '', capacity: 60, is_active: true });
  const [branchCodeForm, setBranchCodeForm] = useState({
    code: '',
    name: '',
    branch_id: '',
    sub_branch_id: '',
    description: '',
    is_active: true,
  });

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [deptList, brList, sbList, ayList, clList, secList, bcList] = await Promise.all([
        academicService.getDepartments(),
        academicService.getBranches(),
        academicService.getSubBranches(),
        academicService.getAcademicYears(),
        academicService.getClasses(),
        academicService.getSections(),
        academicService.getBranchCodes(),
      ]);

      setDepartments(deptList);
      setBranches(brList);
      setSubBranches(sbList);
      setAcademicYears(ayList);
      setClasses(clList);
      setSections(secList);
      setBranchCodes(bcList);
    } catch {
      toast({
        title: 'Error loading hierarchy',
        description: 'Failed to retrieve academic hierarchy data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingItem(null);
    if (activeTab === 'departments') {
      setDeptForm({ name: '', code: '', description: '', is_active: true });
    } else if (activeTab === 'branches') {
      setBranchForm({
        department_id: departments[0]?.id || '',
        name: '',
        code: '',
        description: '',
        is_active: true,
      });
    } else if (activeTab === 'sub_branches') {
      setSubBranchForm({
        branch_id: branches[0]?.id || '',
        name: '',
        code: '',
        description: '',
        is_active: true,
      });
    } else if (activeTab === 'academic_years') {
      setYearForm({ name: '2027–28', start_year: 2027, end_year: 2028, is_current: false, is_active: true });
    } else if (activeTab === 'classes') {
      setClassForm({
        name: '',
        branch_id: branches[0]?.id || '',
        sub_branch_id: subBranches[0]?.id || '',
        academic_year_id: academicYears[0]?.id || '',
        year_of_study: '1st Year',
        semester: 'Semester 1',
        code: '',
        is_active: true,
      });
    } else if (activeTab === 'sections') {
      setSectionForm({
        class_id: classes[0]?.id || '',
        name: 'Section A',
        code: 'A',
        capacity: 60,
        is_active: true,
      });
    } else if (activeTab === 'branch_codes') {
      setBranchCodeForm({
        code: '',
        name: '',
        branch_id: branches[0]?.id || '',
        sub_branch_id: subBranches[0]?.id || '',
        description: '',
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;

    if (editingItem) {
      const ok = await academicService.updateDepartment(editingItem.id as string, deptForm);
      if (ok) {
        toast({ title: 'Department Updated' });
        setModalOpen(false);
        loadData();
      }
    } else {
      const created = await academicService.createDepartment(deptForm);
      if (created) {
        toast({ title: 'Department Created', description: `${created.name} (${created.code})` });
        setModalOpen(false);
        loadData();
      }
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;
    const ok = await academicService.deleteDepartment(id);
    if (ok) {
      toast({ title: 'Department Deleted' });
      loadData();
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.code || !branchForm.department_id) return;

    if (editingItem) {
      const ok = await academicService.updateBranch(editingItem.id as string, branchForm);
      if (ok) {
        toast({ title: 'Branch Updated' });
        setModalOpen(false);
        loadData();
      }
    } else {
      const created = await academicService.createBranch(branchForm);
      if (created) {
        toast({ title: 'Branch Created', description: `${created.name} (${created.code})` });
        setModalOpen(false);
        loadData();
      }
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (!window.confirm(`Delete branch "${name}" and related specializations?`)) return;
    const ok = await academicService.deleteBranch(id);
    if (ok) {
      toast({ title: 'Branch Deleted' });
      loadData();
    }
  };

  const handleSaveSubBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subBranchForm.name || !subBranchForm.code || !subBranchForm.branch_id) return;

    if (editingItem) {
      const ok = await academicService.updateSubBranch(editingItem.id as string, subBranchForm);
      if (ok) {
        toast({ title: 'Sub-Branch Updated' });
        setModalOpen(false);
        loadData();
      }
    } else {
      const created = await academicService.createSubBranch(subBranchForm);
      if (created) {
        toast({ title: 'Sub-Branch Created', description: `${created.name} (${created.code})` });
        setModalOpen(false);
        loadData();
      }
    }
  };

  const handleDeleteSubBranch = async (id: string, name: string) => {
    if (!window.confirm(`Delete sub-branch "${name}"?`)) return;
    const ok = await academicService.deleteSubBranch(id);
    if (ok) {
      toast({ title: 'Sub-Branch Deleted' });
      loadData();
    }
  };

  const handleSaveAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.name) return;

    if (editingItem) {
      const ok = await academicService.updateAcademicYear(editingItem.id as string, yearForm);
      if (ok) {
        toast({ title: 'Academic Year Updated' });
        setModalOpen(false);
        loadData();
      }
    } else {
      const created = await academicService.createAcademicYear(yearForm);
      if (created) {
        toast({ title: 'Academic Year Created', description: created.name });
        setModalOpen(false);
        loadData();
      }
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name || !classForm.branch_id) return;

    if (editingItem) {
      const ok = await academicService.updateClass(editingItem.id as string, classForm);
      if (ok) {
        toast({ title: 'Class Updated' });
        setModalOpen(false);
        loadData();
      }
    } else {
      const created = await academicService.createClass(classForm);
      if (created) {
        toast({ title: 'Class Created', description: created.name });
        setModalOpen(false);
        loadData();
      }
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!window.confirm(`Delete class "${name}"?`)) return;
    const ok = await academicService.deleteClass(id);
    if (ok) {
      toast({ title: 'Class Deleted' });
      loadData();
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.name || !sectionForm.code || !sectionForm.class_id) return;

    if (editingItem) {
      const ok = await academicService.updateSection(editingItem.id as string, sectionForm);
      if (ok) {
        toast({ title: 'Section Updated' });
        setModalOpen(false);
        loadData();
      }
    } else {
      const created = await academicService.createSection(sectionForm);
      if (created) {
        toast({ title: 'Section Created', description: `${created.name} (${created.code})` });
        setModalOpen(false);
        loadData();
      }
    }
  };

  const handleDeleteSection = async (id: string, name: string) => {
    if (!window.confirm(`Delete section "${name}"?`)) return;
    const ok = await academicService.deleteSection(id);
    if (ok) {
      toast({ title: 'Section Deleted' });
      loadData();
    }
  };

  const handleSaveBranchCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchCodeForm.code || !branchCodeForm.name) return;

    if (editingItem) {
      const ok = await academicService.updateBranchCode(editingItem.id as string, branchCodeForm);
      if (ok) {
        toast({ title: 'Branch Code Mapping Updated' });
        setModalOpen(false);
        loadData();
      }
    } else {
      const created = await academicService.createBranchCode(branchCodeForm);
      if (created) {
        toast({ title: 'Branch Code Mapped', description: `${created.code} -> ${created.name}` });
        setModalOpen(false);
        loadData();
      }
    }
  };

  const handleDeleteBranchCode = async (id: string, code: string) => {
    if (!window.confirm(`Delete branch code mapping "${code}"?`)) return;
    const ok = await academicService.deleteBranchCode(id);
    if (ok) {
      toast({ title: 'Branch Code Mapping Deleted' });
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Hierarchy Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>Academic Hierarchy & Structure</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure institutional levels: Department → Branch → Sub-Branch → Academic Year → Class → Section → Branch Codes
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={loadData} className="h-8 gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button size="sm" onClick={openCreateModal} className="h-8 gap-1.5 text-xs bg-primary">
            <Plus className="w-3.5 h-3.5" />
            <span>Add {activeTab.replace('_', ' ').replace(/s$/, '')}</span>
          </Button>
        </div>
      </div>

      {/* Hierarchy Navigation Pills */}
      <div className="flex flex-wrap items-center gap-1.5 bg-secondary/50 p-1.5 rounded-xl border border-border/50 text-xs">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'departments' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'branches' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Branches ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sub_branches')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'sub_branches' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sub-Branches ({subBranches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('academic_years')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'academic_years' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Academic Years ({academicYears.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'classes' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Classes ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'sections' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Sections ({sections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('branch_codes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'branch_codes' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Branch Code Mappings ({branchCodes.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* DEPARTMENTS TABLE */}
          {activeTab === 'departments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Department Code</th>
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-secondary/20">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{dept.code}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{dept.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{dept.description || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dept.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                          {dept.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingItem(dept as unknown as Record<string, unknown>);
                              setDeptForm({
                                name: dept.name,
                                code: dept.code,
                                description: dept.description || '',
                                is_active: dept.is_active,
                              });
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                            title="Edit Department"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                            className="p-1.5 text-destructive hover:text-destructive rounded hover:bg-destructive/10"
                            title="Delete Department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* BRANCHES TABLE */}
          {activeTab === 'branches' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Branch Code</th>
                    <th className="py-3 px-4 font-semibold">Branch Name</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {branches.map((b) => {
                    const dept = departments.find((d) => d.id === b.department_id);
                    return (
                      <tr key={b.id} className="hover:bg-secondary/20">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{b.code}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{b.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{dept ? dept.name : 'Engineering'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                            {b.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(b as unknown as Record<string, unknown>);
                                setBranchForm({
                                  department_id: b.department_id,
                                  name: b.name,
                                  code: b.code,
                                  description: b.description || '',
                                  is_active: b.is_active,
                                });
                                setModalOpen(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(b.id, b.name)}
                              className="p-1.5 text-destructive hover:text-destructive rounded hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SUB-BRANCHES TABLE */}
          {activeTab === 'sub_branches' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Specialization Code</th>
                    <th className="py-3 px-4 font-semibold">Sub-Branch / Specialization</th>
                    <th className="py-3 px-4 font-semibold">Parent Branch</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {subBranches.map((sb) => {
                    const parentBranch = branches.find((b) => b.id === sb.branch_id);
                    return (
                      <tr key={sb.id} className="hover:bg-secondary/20">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{sb.code}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{sb.name}</td>
                        <td className="py-3 px-4 text-muted-foreground font-medium">{parentBranch ? parentBranch.name : 'CSE'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{sb.description || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(sb as unknown as Record<string, unknown>);
                                setSubBranchForm({
                                  branch_id: sb.branch_id,
                                  name: sb.name,
                                  code: sb.code,
                                  description: sb.description || '',
                                  is_active: sb.is_active,
                                });
                                setModalOpen(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubBranch(sb.id, sb.name)}
                              className="p-1.5 text-destructive hover:text-destructive rounded hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ACADEMIC YEARS TABLE */}
          {activeTab === 'academic_years' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Academic Year</th>
                    <th className="py-3 px-4 font-semibold">Start Year</th>
                    <th className="py-3 px-4 font-semibold">End Year</th>
                    <th className="py-3 px-4 font-semibold">Current Batch</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {academicYears.map((ay) => (
                    <tr key={ay.id} className="hover:bg-secondary/20">
                      <td className="py-3 px-4 font-bold text-foreground">{ay.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{ay.start_year}</td>
                      <td className="py-3 px-4 text-muted-foreground">{ay.end_year}</td>
                      <td className="py-3 px-4">
                        {ay.is_current ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                            CURRENT ACTIVE
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Archived / Past</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingItem(ay as unknown as Record<string, unknown>);
                            setYearForm({
                              name: ay.name,
                              start_year: ay.start_year,
                              end_year: ay.end_year,
                              is_current: ay.is_current,
                              is_active: ay.is_active,
                            });
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CLASSES TABLE */}
          {activeTab === 'classes' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Class Name</th>
                    <th className="py-3 px-4 font-semibold">Branch</th>
                    <th className="py-3 px-4 font-semibold">Sub-Branch</th>
                    <th className="py-3 px-4 font-semibold">Year & Semester</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {classes.map((cls) => {
                    const br = branches.find((b) => b.id === cls.branch_id);
                    const sb = subBranches.find((s) => s.id === cls.sub_branch_id);
                    return (
                      <tr key={cls.id} className="hover:bg-secondary/20">
                        <td className="py-3 px-4 font-semibold text-foreground">{cls.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{br ? br.name : 'CSE'}</td>
                        <td className="py-3 px-4 text-primary font-medium">{sb ? sb.name : 'Core'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{cls.year_of_study} • {cls.semester}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(cls as unknown as Record<string, unknown>);
                                setClassForm({
                                  name: cls.name,
                                  branch_id: cls.branch_id,
                                  sub_branch_id: cls.sub_branch_id || '',
                                  academic_year_id: cls.academic_year_id || '',
                                  year_of_study: cls.year_of_study,
                                  semester: cls.semester,
                                  code: cls.code || '',
                                  is_active: cls.is_active ?? true,
                                });
                                setModalOpen(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls.id, cls.name)}
                              className="p-1.5 text-destructive hover:text-destructive rounded hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTIONS TABLE */}
          {activeTab === 'sections' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Section Name</th>
                    <th className="py-3 px-4 font-semibold">Code</th>
                    <th className="py-3 px-4 font-semibold">Class Group</th>
                    <th className="py-3 px-4 font-semibold">Capacity</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sections.map((sec) => {
                    const cls = classes.find((c) => c.id === sec.class_id);
                    return (
                      <tr key={sec.id} className="hover:bg-secondary/20">
                        <td className="py-3 px-4 font-semibold text-foreground">{sec.name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-primary">{sec.code}</td>
                        <td className="py-3 px-4 text-muted-foreground">{cls ? cls.name : 'B.Tech CSE'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{sec.capacity || 60} students</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(sec as unknown as Record<string, unknown>);
                                setSectionForm({
                                  class_id: sec.class_id,
                                  name: sec.name,
                                  code: sec.code,
                                  capacity: sec.capacity || 60,
                                  is_active: sec.is_active ?? true,
                                });
                                setModalOpen(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sec.id, sec.name)}
                              className="p-1.5 text-destructive hover:text-destructive rounded hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* BRANCH CODE MAPPINGS TABLE */}
          {activeTab === 'branch_codes' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Roll Branch Code</th>
                    <th className="py-3 px-4 font-semibold">Mapped Program Name</th>
                    <th className="py-3 px-4 font-semibold">Branch</th>
                    <th className="py-3 px-4 font-semibold">Sub-Branch</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {branchCodes.map((bc) => {
                    const br = branches.find((b) => b.id === bc.branch_id);
                    const sb = subBranches.find((s) => s.id === bc.sub_branch_id);
                    return (
                      <tr key={bc.id} className="hover:bg-secondary/20">
                        <td className="py-3 px-4 font-mono font-bold text-primary bg-primary/5">{bc.code}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{bc.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{br ? br.name : 'CSE'}</td>
                        <td className="py-3 px-4 text-primary font-medium">{sb ? sb.name : 'Core'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(bc as unknown as Record<string, unknown>);
                                setBranchCodeForm({
                                  code: bc.code,
                                  name: bc.name,
                                  branch_id: bc.branch_id || '',
                                  sub_branch_id: bc.sub_branch_id || '',
                                  description: bc.description || '',
                                  is_active: bc.is_active ?? true,
                                });
                                setModalOpen(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranchCode(bc.id, bc.code)}
                              className="p-1.5 text-destructive hover:text-destructive rounded hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT HIERARCHY MODAL */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingItem ? 'Edit' : 'Add New'} {activeTab.replace('_', ' ').replace(/s$/, '')}
              </DialogTitle>
            </DialogHeader>

            {/* Department Form */}
            {activeTab === 'departments' && (
              <form onSubmit={handleSaveDepartment} className="space-y-4 py-2 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    placeholder="e.g. Engineering & Technology"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ENG"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Description</label>
                  <textarea
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-primary">Save Department</Button>
                </div>
              </form>
            )}

            {/* Branch Form */}
            {activeTab === 'branches' && (
              <form onSubmit={handleSaveBranch} className="space-y-4 py-2 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">Department *</label>
                  <select
                    value={branchForm.department_id}
                    onChange={(e) => setBranchForm({ ...branchForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CSE"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-primary">Save Branch</Button>
                </div>
              </form>
            )}

            {/* Sub-Branch Form */}
            {activeTab === 'sub_branches' && (
              <form onSubmit={handleSaveSubBranch} className="space-y-4 py-2 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">Parent Branch *</label>
                  <select
                    value={subBranchForm.branch_id}
                    onChange={(e) => setSubBranchForm({ ...subBranchForm, branch_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Sub-Branch / Specialization *</label>
                  <input
                    type="text"
                    required
                    value={subBranchForm.name}
                    onChange={(e) => setSubBranchForm({ ...subBranchForm, name: e.target.value })}
                    placeholder="e.g. Cyber Security"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Specialization Code *</label>
                  <input
                    type="text"
                    required
                    value={subBranchForm.code}
                    onChange={(e) => setSubBranchForm({ ...subBranchForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CS"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-primary">Save Sub-Branch</Button>
                </div>
              </form>
            )}

            {/* Academic Year Form */}
            {activeTab === 'academic_years' && (
              <form onSubmit={handleSaveAcademicYear} className="space-y-4 py-2 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">Academic Year Label *</label>
                  <input
                    type="text"
                    required
                    value={yearForm.name}
                    onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                    placeholder="e.g. 2026–27"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1">Start Year</label>
                    <input
                      type="number"
                      value={yearForm.start_year}
                      onChange={(e) => setYearForm({ ...yearForm, start_year: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">End Year</label>
                    <input
                      type="number"
                      value={yearForm.end_year}
                      onChange={(e) => setYearForm({ ...yearForm, end_year: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_current_year"
                    checked={yearForm.is_current}
                    onChange={(e) => setYearForm({ ...yearForm, is_current: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  <label htmlFor="is_current_year" className="text-muted-foreground cursor-pointer">
                    Set as Current Active Academic Year
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-primary">Save Year</Button>
                </div>
              </form>
            )}

            {/* Class Form */}
            {activeTab === 'classes' && (
              <form onSubmit={handleSaveClass} className="space-y-4 py-2 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">Class Name *</label>
                  <input
                    type="text"
                    required
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    placeholder="e.g. B.Tech CSE - Cyber Security (2026-27)"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1">Branch *</label>
                    <select
                      value={classForm.branch_id}
                      onChange={(e) => setClassForm({ ...classForm, branch_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">Sub-Branch</label>
                    <select
                      value={classForm.sub_branch_id}
                      onChange={(e) => setClassForm({ ...classForm, sub_branch_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option value="">None / Core</option>
                      {subBranches.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1">Year of Study</label>
                    <select
                      value={classForm.year_of_study}
                      onChange={(e) => setClassForm({ ...classForm, year_of_study: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">Semester</label>
                    <select
                      value={classForm.semester}
                      onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                      <option value="Semester 7">Semester 7</option>
                      <option value="Semester 8">Semester 8</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-primary">Save Class</Button>
                </div>
              </form>
            )}

            {/* Section Form */}
            {activeTab === 'sections' && (
              <form onSubmit={handleSaveSection} className="space-y-4 py-2 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">Parent Class *</label>
                  <select
                    value={sectionForm.class_id}
                    onChange={(e) => setSectionForm({ ...sectionForm, class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1">Section Name *</label>
                    <input
                      type="text"
                      required
                      value={sectionForm.name}
                      onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                      placeholder="e.g. Section A"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">Code *</label>
                    <input
                      type="text"
                      required
                      value={sectionForm.code}
                      onChange={(e) => setSectionForm({ ...sectionForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. A"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Capacity</label>
                  <input
                    type="number"
                    value={sectionForm.capacity}
                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-primary">Save Section</Button>
                </div>
              </form>
            )}

            {/* Branch Code Mapping Form */}
            {activeTab === 'branch_codes' && (
              <form onSubmit={handleSaveBranchCode} className="space-y-4 py-2 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">Institutional Code * (e.g. 1A, 05, 42)</label>
                  <input
                    type="text"
                    required
                    value={branchCodeForm.code}
                    onChange={(e) => setBranchCodeForm({ ...branchCodeForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. 1A"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    This is extracted from roll numbers like 25ME<b>1A</b>4602.
                  </p>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Program / Specialization Name *</label>
                  <input
                    type="text"
                    required
                    value={branchCodeForm.name}
                    onChange={(e) => setBranchCodeForm({ ...branchCodeForm, name: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering (Cyber Security)"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground mb-1">Mapped Branch</label>
                    <select
                      value={branchCodeForm.branch_id}
                      onChange={(e) => setBranchCodeForm({ ...branchCodeForm, branch_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option value="">Auto / Default</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">Mapped Sub-Branch</label>
                    <select
                      value={branchCodeForm.sub_branch_id}
                      onChange={(e) => setBranchCodeForm({ ...branchCodeForm, sub_branch_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                    >
                      <option value="">Core</option>
                      {subBranches.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-primary">Save Branch Code Mapping</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
