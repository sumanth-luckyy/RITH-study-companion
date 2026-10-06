import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  User,
  Mail,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { academicService } from '@/services/academicService';
import { ReportItem } from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';

const PROBLEM_TYPES = [
  'Technical Issue',
  'Content Error',
  'Account Problem',
  'Feature Request',
  'Other',
];

export default function ReportProblem() {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: profile?.full_name || '',
    email: profile?.email || '',
    type: 'Technical Issue',
    subject: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myReports, setMyReports] = useState<ReportItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadMyReports() {
      try {
        const all = await academicService.getReports();
        const userEmail = profile?.email?.toLowerCase();
        const mine = all.filter((r) => r.reporter_email.toLowerCase() === userEmail);
        setMyReports(mine);
      } catch {
        // Ignore
      }
    }
    loadMyReports();
  }, [profile?.email]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Valid email is required';
    if (!formData.subject.trim() || formData.subject.length < 4) {
      newErrors.subject = 'Subject must be at least 4 characters';
    }
    if (!formData.description.trim() || formData.description.length < 15) {
      newErrors.description = 'Please describe the problem in detail (min 15 characters)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const newRep = await academicService.submitReport({
        reporter_name: formData.name.trim(),
        reporter_email: formData.email.trim(),
        report_type: formData.type,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        user_id: user?.id || null,
      });

      setMyReports((prev) => [newRep, ...prev]);
      setSubmitted(true);
      toast({
        title: 'Report Submitted',
        description: 'Your report has been sent to the academic department administration.',
      });
      setFormData({
        name: profile?.full_name || '',
        email: profile?.email || '',
        type: 'Technical Issue',
        subject: '',
        description: '',
      });
    } catch {
      toast({
        title: 'Submission error',
        description: 'Failed to record report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ReportItem['status']) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'in_progress':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'closed':
        return 'bg-secondary text-muted-foreground border-border';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Report a Problem"
        subtitle="Report discrepancies in notes, technical bugs, or submission questions to the administration."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Submit New Ticket
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
                {errors.name && <p className="text-destructive text-[11px] mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Contact Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
                {errors.email && <p className="text-destructive text-[11px] mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Category</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              >
                {PROBLEM_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Subject</label>
              <input
                type="text"
                placeholder="Brief summary of the issue..."
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              />
              {errors.subject && <p className="text-destructive text-[11px] mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Description</label>
              <textarea
                rows={4}
                placeholder="Provide details, affected subject, page or error message..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              />
              {errors.description && <p className="text-destructive text-[11px] mt-1">{errors.description}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs gap-1.5 w-full sm:w-auto"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
            </Button>
          </form>
        </div>

        {/* History / Info Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">My Submitted Tickets</h3>
            {myReports.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                You haven't submitted any tickets yet.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin">
                {myReports.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-border/70 bg-secondary/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-foreground line-clamp-1">{item.subject}</span>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-bold border uppercase ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
                    <span className="text-[10px] text-muted-foreground block pt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
