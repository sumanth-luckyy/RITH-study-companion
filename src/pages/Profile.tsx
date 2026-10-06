import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  GraduationCap,
  Hash,
  Layers,
  Calendar,
  Shield,
  Edit2,
  Check,
  Building,
  BookOpen,
  Key,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    branch: profile?.branch || 'CSE',
    section: profile?.section || 'A',
    semester: profile?.semester || 'Semester 1',
    department: profile?.department || 'Computer Science & Engineering',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: formData.full_name.trim(),
        branch: formData.branch,
        section: formData.section,
        semester: formData.semester,
        department: formData.department,
      });

      if (error) {
        toast({
          title: 'Error updating profile',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Profile Updated',
          description: 'Your academic information has been saved.',
        });
        setEditOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Student Academic Profile"
        subtitle="Manage your institutional identity, academic enrollment details, and account preferences."
        actions={
          <Button
            onClick={() => {
              setFormData({
                full_name: profile?.full_name || '',
                branch: profile?.branch || 'CSE',
                section: profile?.section || 'A',
                semester: profile?.semester || 'Semester 1',
                department: profile?.department || 'Computer Science & Engineering',
              });
              setEditOpen(true);
            }}
            size="sm"
            className="rounded-xl text-xs gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </Button>
        }
      />

      {/* Hero Profile Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <UserAvatar
            name={profile?.full_name || 'Student'}
            role={profile?.role}
            size="lg"
            className="w-20 h-20 text-2xl"
          />

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {profile?.full_name || 'Student'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {profile?.class_group || '25CS-A'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border uppercase">
                {profile?.role || 'student'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              {profile?.roll_number} • {profile?.department || 'Computer Science & Engineering'}
            </p>

            <p className="text-xs text-muted-foreground pt-1">
              Registered Email: <span className="font-medium text-foreground">{profile?.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Academic Information & Account Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Details */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Academic Information</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Roll Number:</span>
              <span className="font-mono font-semibold text-foreground">{profile?.roll_number}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Department:</span>
              <span className="font-semibold text-foreground">{profile?.department || 'Engineering'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Branch:</span>
              <span className="font-semibold text-foreground">{profile?.branch || 'CSE'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Sub-Branch / Specialization:</span>
              <span className="font-semibold text-primary">{profile?.sub_branch || 'Cyber Security'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Academic Year:</span>
              <span className="font-semibold text-foreground">{profile?.academic_year || '2026–27'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Year of Study:</span>
              <span className="font-semibold text-foreground">{profile?.year_of_study || '1st Year'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Semester:</span>
              <span className="font-semibold text-foreground">{profile?.semester || '1st Semester'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Section:</span>
              <span className="font-semibold text-foreground">Section {profile?.section || 'A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Class / Group:</span>
              <span className="font-semibold text-primary">{profile?.class_group || '25CS-A'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Joining Year / College / Branch Code:</span>
              <span className="font-mono text-muted-foreground">
                {profile?.joining_year || '2025'} • {profile?.college_code || 'ME'} • {profile?.branch_code || '1A'}
              </span>
            </div>
          </div>
        </div>

        {/* Account & Security Information */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Shield className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-foreground">Account & Access</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Full Name:</span>
              <span className="font-semibold text-foreground">{profile?.full_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-semibold text-foreground">{profile?.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">System Role:</span>
              <span className="font-semibold text-foreground capitalize">{profile?.role}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Member Since:</span>
              <span className="font-semibold text-foreground">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'August 2025'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 items-center">
              <span className="text-muted-foreground">Account Status:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                ACTIVE & VERIFIED
              </span>
            </div>

            <div className="pt-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="w-full rounded-xl text-xs gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-primary" />
                Change Password in Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Edit Academic Details</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Branch</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  >
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
