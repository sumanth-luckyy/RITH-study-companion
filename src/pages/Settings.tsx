import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Bell,
  Lock,
  Eye,
  Shield,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [examAlerts, setExamAlerts] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);

  const handleSavePreferences = () => {
    toast({
      title: 'Preferences Saved',
      description: 'Your companion settings have been updated.',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Customize display appearance, notification alerts, and companion behavior."
      />

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
            <span className="font-mono text-foreground">2.0.0 (Modernized)</span>
          </div>
          <div className="flex justify-between">
            <span>Class Affiliation</span>
            <span className="font-semibold text-foreground">{profile?.class_group || '25CS-A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Primary Backend</span>
            <span className="text-foreground">Supabase PostgreSQL + RLS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
