import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  GraduationCap,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Building2,
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { academicService } from '@/services/academicService';
import {
  AdminUserItem,
  UserRole,
  UserStatus,
  Department,
  Branch,
} from '@/types/academic';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademicHierarchy } from '@/hooks/useAcademicHierarchy';
import { toast } from 'sonner';

export function AdminUserManagement() {
  const { user: currentAuthUser } = useAuth();
  const currentAdminId = currentAuthUser?.id || '';
  const hierarchy = useAcademicHierarchy();

  // Data State
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // Add User Form State
  const [formRole, setFormRole] = useState<UserRole>('student');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRollNumber, setFormRollNumber] = useState('');
  const [formDepartment, setFormDepartment] = useState('Engineering & Technology');
  const [formBranch, setFormBranch] = useState('CSE');
  const [formAcademicYear, setFormAcademicYear] = useState('2026–27');
  const [formYearOfStudy, setFormYearOfStudy] = useState('1st Year');
  const [formSemester, setFormSemester] = useState('Semester 1');
  const [formSection, setFormSection] = useState('A');
  const [formStatus, setFormStatus] = useState<UserStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await academicService.getUsers({
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        department: deptFilter,
        branch: branchFilter,
        year: yearFilter,
        section: sectionFilter,
        page: currentPage,
        pageSize: 12,
      });

      setUsers(res.users);
      setTotalUsers(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to fetch user list.');
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    roleFilter,
    statusFilter,
    deptFilter,
    branchFilter,
    yearFilter,
    sectionFilter,
    currentPage,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDeptFilter('all');
    setBranchFilter('all');
    setYearFilter('all');
    setSectionFilter('all');
    setCurrentPage(1);
  };

  // Open Add Modal
  const handleOpenAddModal = (initialRole: UserRole = 'student') => {
    setFormRole(initialRole);
    setFormFullName('');
    setFormEmail('');
    setFormPassword('');
    setShowPassword(false);
    setFormRollNumber('');
    setFormDepartment('Engineering & Technology');
    setFormBranch('CSE');
    setFormAcademicYear('2026–27');
    setFormYearOfStudy(initialRole === 'admin' ? 'Staff' : '1st Year');
    setFormSemester('Semester 1');
    setFormSection('A');
    setFormStatus('active');
    setIsAddModalOpen(true);
  };

  // Submit Add User
  const handleSubmitAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) {
      toast.error('Full Name is required.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      toast.error('A valid Email address is required.');
      return;
    }
    if (formRole === 'student' && !formRollNumber.trim()) {
      toast.error('Roll Number is required for students.');
      return;
    }
    if (formPassword && formPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await academicService.createUser({
        full_name: formFullName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim() || undefined,
        role: formRole,
        roll_number: formRole === 'student' ? formRollNumber.trim().toUpperCase() : undefined,
        department: formDepartment,
        branch: formBranch,
        academic_year: formAcademicYear,
        year_of_study: formYearOfStudy,
        semester: formSemester,
        section: formSection,
        status: formStatus,
      });

      if (res.success) {
        toast.success(
          formRole === 'admin'
            ? 'Administrator account created successfully.'
            : 'Student account created successfully.'
        );
        setIsAddModalOpen(false);
        fetchUsers();
      } else {
        toast.error(res.error || 'Failed to create account.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setFormRole(user.role);
    setFormFullName(user.full_name);
    setFormEmail(user.email);
    setFormRollNumber(user.roll_number || '');
    setFormDepartment(user.department || 'Engineering & Technology');
    setFormBranch(user.branch || 'CSE');
    setFormAcademicYear(user.academic_year || '2026–27');
    setFormYearOfStudy(user.year_of_study || '1st Year');
    setFormSemester(user.semester || 'Semester 1');
    setFormSection(user.section || 'A');
    setFormStatus(user.status || 'active');
    setIsEditModalOpen(true);
  };

  // Submit Edit User
  const handleSubmitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formFullName.trim()) {
      toast.error('Full Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await academicService.updateUser(
        selectedUser.user_id,
        {
          full_name: formFullName.trim(),
          role: formRole,
          roll_number: formRole === 'student' ? formRollNumber.trim().toUpperCase() : formRollNumber,
          department: formDepartment,
          branch: formBranch,
          academic_year: formAcademicYear,
          year_of_study: formYearOfStudy,
          semester: formSemester,
          section: formSection,
          status: formStatus,
        },
        currentAdminId
      );

      if (res.success) {
        toast.success('User updated successfully.');
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        toast.error(res.error || 'Failed to update user.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error updating user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Change (Active / Inactive / Suspended)
  const handleStatusChange = async (user: AdminUserItem, newStatus: UserStatus) => {
    if (user.user_id === currentAdminId && newStatus !== 'active') {
      toast.error('You cannot deactivate or suspend your own account.');
      return;
    }

    try {
      const res = await academicService.setUserStatus(user.user_id, newStatus, currentAdminId);
      if (res.success) {
        toast.success(`User marked as ${newStatus}.`);
        setUsers((prev) =>
          prev.map((u) => (u.user_id === user.user_id ? { ...u, status: newStatus, is_active: newStatus === 'active' } : u))
        );
      } else {
        toast.error(res.error || 'Failed to update status.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (user: AdminUserItem) => {
    if (user.user_id === currentAdminId) {
      toast.error('You cannot delete your own account.');
      return;
    }
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete User
  const handleConfirmDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await academicService.deleteUser(selectedUser.user_id, currentAdminId);
      if (res.success) {
        toast.success(`User ${selectedUser.full_name} deleted.`);
        setIsDeleteModalOpen(false);
        fetchUsers();
      } else {
        toast.error(res.error || 'Failed to delete user.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Single source of truth academic hierarchy options
  const departments = hierarchy.activeDepartments;
  const branches = hierarchy.activeBranches;
  const availableBranches = hierarchy.activeBranches;

  const availableYears = useMemo(() => {
    return hierarchy.getYearsForBranch(formBranch);
  }, [hierarchy, formBranch]);

  const availableSemesters = useMemo(() => {
    return hierarchy.getSemestersForBranch(formBranch, formYearOfStudy);
  }, [hierarchy, formBranch, formYearOfStudy]);

  const availableSections = hierarchy.activeSections;

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Users Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage real database student and administrator credentials, access permissions, and academic profiles.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            className="rounded-xl h-9 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAddModal('admin')}
            className="rounded-xl h-9 text-xs gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            Add Admin
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenAddModal('student')}
            className="rounded-xl h-9 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and Filters Card */}
      <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or roll number..."
                className="pl-9 h-9 text-xs rounded-xl bg-background/80"
              />
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-40">
              <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-36">
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Academic Sub-filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1 border-t border-border/40">
            <div>
              <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-[11px] rounded-lg bg-background/60">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depts</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.code || d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-[11px] rounded-lg bg-background/60">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.code || b.name}>{b.code || b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-[11px] rounded-lg bg-background/60">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {hierarchy.getYearsForBranch(branchFilter).map((yr) => (
                    <SelectItem key={yr} value={yr}>{yr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={sectionFilter} onValueChange={(v) => { setSectionFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-[11px] rounded-lg bg-background/60">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {hierarchy.activeSections.map((sec) => (
                    <SelectItem key={sec.id} value={sec.code}>Section {sec.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-[11px] text-muted-foreground hover:text-foreground w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeleton / Empty State / Content */}
      {isLoading ? (
        <div className="p-8 text-center bg-card/40 rounded-2xl border border-border">
          <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading verified users from database...</p>
        </div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-dashed border-border bg-card/30">
          <Users className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Users Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            No accounts match your current filter parameters. Try adjusting search or create a new student or admin.
          </p>
          <Button
            size="sm"
            onClick={() => handleOpenAddModal('student')}
            className="rounded-xl text-xs gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add First User
          </Button>
        </Card>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (hidden on mobile) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Roll Number</th>
                    <th className="py-3 px-3">Department & Branch</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {users.map((user) => {
                    const isSelf = user.user_id === currentAdminId;
                    const status = user.status || (user.is_active === false ? 'inactive' : 'active');

                    return (
                      <tr key={user.user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase flex-shrink-0">
                              {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                                <span>{user.full_name}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-mono font-normal">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {user.role === 'admin' ? (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 gap-1 text-[10px]">
                              <Shield className="w-2.5 h-2.5" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1 text-[10px]">
                              <GraduationCap className="w-2.5 h-2.5" />
                              Student
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono font-medium text-foreground">
                          {user.roll_number || '—'}
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-foreground font-medium">{user.branch || 'CSE'}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {user.department || 'Engineering'}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-muted-foreground">
                          <div>{user.year_of_study || '1st Year'}</div>
                          <div className="text-[10px]">Sec {user.section || 'A'}</div>
                        </td>

                        <td className="py-3 px-3">
                          {status === 'active' && (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 hover:bg-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Active
                            </Badge>
                          )}
                          {status === 'inactive' && (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] gap-1 hover:bg-amber-500/20">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Inactive
                            </Badge>
                          )}
                          {status === 'suspended' && (
                            <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] gap-1 hover:bg-rose-500/20">
                              <XCircle className="w-2.5 h-2.5" />
                              Suspended
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              <DropdownMenuItem onClick={() => handleOpenEditModal(user)} className="gap-2">
                                <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                                Edit User
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'active')} className="gap-2 text-emerald-400">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Mark Active
                                </DropdownMenuItem>
                              )}

                              {status !== 'inactive' && !isSelf && (
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'inactive')} className="gap-2 text-amber-400">
                                  <UserX className="w-3.5 h-3.5" />
                                  Deactivate User
                                </DropdownMenuItem>
                              )}

                              {status !== 'suspended' && !isSelf && (
                                <DropdownMenuItem onClick={() => handleStatusChange(user, 'suspended')} className="gap-2 text-rose-400">
                                  <XCircle className="w-3.5 h-3.5" />
                                  Suspend User
                                </DropdownMenuItem>
                              )}

                              {!isSelf && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleOpenDeleteModal(user)}
                                    className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE USER CARDS VIEW (Section 8 Requirement) */}
          <div className="block md:hidden space-y-3">
            {users.map((user) => {
              const isSelf = user.user_id === currentAdminId;
              const status = user.status || (user.is_active === false ? 'inactive' : 'active');

              return (
                <Card
                  key={user.user_id}
                  className="rounded-2xl border-border bg-card/90 shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-foreground text-sm truncate">{user.full_name}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-primary font-semibold mt-0.5">
                        {user.roll_number || user.email}
                      </div>
                    </div>

                    {user.role === 'admin' ? (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] gap-1 flex-shrink-0">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px] gap-1 flex-shrink-0">
                        <GraduationCap className="w-2.5 h-2.5" />
                        Student
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 block">Branch</span>
                      <span className="text-foreground font-medium">{user.branch || 'CSE'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 block">Class & Sec</span>
                      <span className="text-foreground font-medium">{user.year_of_study || '1st Year'} • Sec {user.section || 'A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div>
                      {status === 'active' && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Active
                        </Badge>
                      )}
                      {status === 'inactive' && (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Inactive
                        </Badge>
                      )}
                      {status === 'suspended' && (
                        <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] gap-1">
                          <XCircle className="w-2.5 h-2.5" />
                          Suspended
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(user)}
                        className="rounded-xl h-8 text-xs px-3"
                      >
                        Edit
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          {status !== 'active' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(user, 'active')} className="text-emerald-400">
                              Mark Active
                            </DropdownMenuItem>
                          )}
                          {status !== 'inactive' && !isSelf && (
                            <DropdownMenuItem onClick={() => handleStatusChange(user, 'inactive')} className="text-amber-400">
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          {status !== 'suspended' && !isSelf && (
                            <DropdownMenuItem onClick={() => handleStatusChange(user, 'suspended')} className="text-rose-400">
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {!isSelf && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleOpenDeleteModal(user)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
            <div>
              Showing {users.length > 0 ? (currentPage - 1) * 12 + 1 : 0} to{' '}
              {Math.min(currentPage * 12, totalUsers)} of {totalUsers} registered users
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="rounded-xl h-8 text-xs"
              >
                Previous
              </Button>

              <span className="font-medium text-foreground px-2">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isLoading}
                className="rounded-xl h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* ADD USER MODAL (Student or Admin)                                  */}
      {/* =================================================================== */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {formRole === 'admin' ? (
                <>
                  <Shield className="w-5 h-5 text-purple-400" />
                  Add Administrator Account
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 text-primary" />
                  Add Student Account
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create a verified database user with linked Supabase authentication and academic identity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAddUser} className="space-y-4 pt-2">
            {/* Role Switcher */}
            <div className="flex p-1 bg-muted rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setFormRole('student')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  formRole === 'student' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setFormRole('admin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  formRole === 'admin' ? 'bg-background text-purple-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Administrator
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Full Name *</Label>
                <Input
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="e.g. Sumanth or Dr. Robert Smith"
                  className="rounded-xl h-9 text-xs mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Institutional Email *</Label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. student@college.edu or admin@college.edu"
                  className="rounded-xl h-9 text-xs mt-1"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <Label className="text-xs">
                  {formRole === 'student' ? 'Initial Password (Defaults to student roll number if blank)' : 'Password *'}
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={formRole === 'student' ? 'Blank = Student Roll Number (Default)' : 'Min 6 characters'}
                    className="rounded-xl h-9 text-xs pr-9"
                    required={formRole === 'admin'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Student specific fields */}
              {formRole === 'student' && (
                <div>
                  <Label className="text-xs">Roll Number * (Institutional Format: 25ME1A4602)</Label>
                  <Input
                    value={formRollNumber}
                    onChange={(e) => setFormRollNumber(e.target.value)}
                    placeholder="e.g. 25ME1A4602"
                    className="rounded-xl h-9 text-xs mt-1 font-mono uppercase"
                    required
                  />
                </div>
              )}
            </div>

            {/* Academic Placement */}
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">Academic Hierarchy & Placement</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">Branch / Program</Label>
                  <Select value={formBranch} onValueChange={setFormBranch}>
                    <SelectTrigger className="h-8 text-xs rounded-xl mt-1">
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranches.map((b) => (
                        <SelectItem key={b.id} value={b.code || b.name}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[11px]">Year</Label>
                  <Select value={formYearOfStudy} onValueChange={setFormYearOfStudy}>
                    <SelectTrigger className="h-8 text-xs rounded-xl mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((yr) => (
                        <SelectItem key={yr} value={yr}>{yr}</SelectItem>
                      ))}
                      {formRole === 'admin' && <SelectItem value="Staff">Staff</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px]">Semester</Label>
                  <Select value={formSemester} onValueChange={setFormSemester}>
                    <SelectTrigger className="h-8 text-xs rounded-xl mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSemesters.map((sem) => (
                        <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px]">Section</Label>
                  <Select value={formSection} onValueChange={setFormSection}>
                    <SelectTrigger className="h-8 text-xs rounded-xl mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSections.map((sec) => (
                        <SelectItem key={sec.id} value={sec.code}>Section {sec.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-[11px]">Initial Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as UserStatus)}>
                  <SelectTrigger className="h-8 text-xs rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl text-xs gap-1.5"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                {formRole === 'admin' ? 'Create Admin' : 'Create Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =================================================================== */}
      {/* EDIT USER MODAL                                                     */}
      {/* =================================================================== */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit User Profile</DialogTitle>
            <DialogDescription className="text-xs">
              Update academic placement, status, or role for {selectedUser?.full_name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEditUser} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">Full Name *</Label>
              <Input
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                className="rounded-xl h-9 text-xs mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Email (Read-only)</Label>
              <Input
                value={formEmail}
                disabled
                className="rounded-xl h-9 text-xs mt-1 bg-muted text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Role</Label>
                <Select
                  value={formRole}
                  onValueChange={(v) => setFormRole(v as UserRole)}
                  disabled={selectedUser?.user_id === currentAdminId}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                {selectedUser?.user_id === currentAdminId && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">You cannot change your own role.</p>
                )}
              </div>

              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(v) => setFormStatus(v as UserStatus)}
                  disabled={selectedUser?.user_id === currentAdminId}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Roll Number</Label>
              <Input
                value={formRollNumber}
                onChange={(e) => setFormRollNumber(e.target.value)}
                className="rounded-xl h-9 text-xs mt-1 font-mono uppercase"
              />
            </div>

            <div className="pt-2 border-t border-border">
              <div>
                <Label className="text-[11px]">Branch / Program</Label>
                <Select value={formBranch} onValueChange={setFormBranch}>
                  <SelectTrigger className="h-8 text-xs rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((b) => (
                      <SelectItem key={b.id} value={b.code || b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[11px]">Year</Label>
                <Select value={formYearOfStudy} onValueChange={setFormYearOfStudy}>
                  <SelectTrigger className="h-8 text-xs rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((yr) => (
                      <SelectItem key={yr} value={yr}>{yr}</SelectItem>
                    ))}
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px]">Semester</Label>
                <Select value={formSemester} onValueChange={setFormSemester}>
                  <SelectTrigger className="h-8 text-xs rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSemesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px]">Section</Label>
                <Select value={formSection} onValueChange={setFormSection}>
                  <SelectTrigger className="h-8 text-xs rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.code}>Section {sec.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl text-xs gap-1.5"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Edit className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =================================================================== */}
      {/* DELETE CONFIRMATION MODAL (Section 13 Requirement)                 */}
      {/* =================================================================== */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete User?
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 space-y-2">
              <p>
                Are you sure you want to permanently delete this user?
              </p>
              <p>
                This action may remove the user's account and associated data according to the application's deletion policy.
              </p>
              {selectedUser && (
                <div className="p-3 bg-muted/60 rounded-xl mt-2 text-foreground font-medium text-xs space-y-1">
                  <div>Name: <span className="font-semibold">{selectedUser.full_name}</span></div>
                  <div>Email: <span className="font-mono text-[11px]">{selectedUser.email}</span></div>
                  {selectedUser.roll_number && <div>Roll: <span className="font-mono">{selectedUser.roll_number}</span></div>}
                  <div>Role: <span className="capitalize">{selectedUser.role}</span></div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={handleConfirmDeleteUser}
              className="rounded-xl text-xs gap-1.5 bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
