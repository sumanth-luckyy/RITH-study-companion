import { useState } from 'react';
import {
  Sun,
  Moon,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { profile, changePassword } = useAuth();
  const { toast } = useToast();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [examAlerts, setExamAlerts] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);

  // Change Password Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSavePreferences = () => {
    toast({
      title: 'Preferences Saved',
      description: 'Your companion settings have been updated.',
    });
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await changePassword(newPassword);
      if (error) {
        setPasswordError(error.message);
      } else {
        toast({
          title: 'Password Changed',
          description: 'Your private password has been successfully updated.',
        });
        setPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordError('Unable to update password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Customize display appearance, notification alerts, and account security."
      />

      {/* Security & Password */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Key className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Security & Credentials</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Change Password</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Your default authentication password is your institutional roll number. You can set a secure private password here.
            </p>
          </div>

          <Button
            onClick={() => {
              setPasswordError('');
              setNewPassword('');
              setConfirmPassword('');
              setPasswordModalOpen(true);
            }}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1.5 flex-shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            Change Password
          </Button>
        </div>
      </div>

      {/* Theme & Display */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Sun className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-foreground">Appearance</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">Color Theme</p>
            <p className="text-[11px] text-muted-foreground">
              Current theme is <span className="capitalize font-medium text-foreground">{theme}</span> mode.
            </p>
          </div>

          <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-2"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" /> Dark Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Academic Notifications</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-border/40">
            <div>
              <p className="font-semibold text-foreground">Classroom Announcements</p>
              <p className="text-[11px] text-muted-foreground">Notify when college publishes a circular</p>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/40">
            <div>
              <p className="font-semibold text-foreground">Examination Deadlines</p>
              <p className="text-[11px] text-muted-foreground">Alerts for upcoming mid and end sem exams</p>
            </div>
            <input
              type="checkbox"
              checked={examAlerts}
              onChange={(e) => setExamAlerts(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div>
              <p className="font-semibold text-foreground">Assignment Reminders</p>
              <p className="text-[11px] text-muted-foreground">Notify 48 hours before task due dates</p>
            </div>
            <input
              type="checkbox"
              checked={assignmentReminders}
              onChange={(e) => setAssignmentReminders(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={handleSavePreferences} size="sm" className="rounded-xl text-xs">
            Save Preferences
          </Button>
        </div>
      </div>

      {/* Platform Information */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Application Info</h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Study Companion Version</span>
            <span className="font-mono text-foreground">2.0.0 (Unified)</span>
          </div>
          <div className="flex justify-between">
            <span>Roll Number</span>
            <span className="font-mono text-foreground">{profile?.roll_number || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Class Affiliation</span>
            <span className="font-semibold text-foreground">{profile?.class_group || '25CS-A'}</span>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Replace your default roll-number credential with a private password.
            </DialogDescription>
          </DialogHeader>

          {passwordError && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isChangingPassword}
                className="rounded-xl text-xs"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
