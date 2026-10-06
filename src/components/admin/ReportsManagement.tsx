import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Trash2,
  Search,
  X,
  Check,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Report {
  id: string;
  user_id: string | null;
  reporter_name: string;
  reporter_email: string;
  report_type: string;
  subject: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ['pending', 'in_progress', 'resolved', 'closed'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-warning/10 text-warning';
    case 'in_progress': return 'bg-primary/10 text-primary';
    case 'resolved': return 'bg-success/10 text-success';
    case 'closed': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="w-3.5 h-3.5" />;
    case 'in_progress': return <AlertCircle className="w-3.5 h-3.5" />;
    case 'resolved': return <CheckCircle className="w-3.5 h-3.5" />;
    case 'closed': return <X className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
};

export default function ReportsManagement() {
  const { toast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: unknown) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateReport = async () => {
    if (!viewingReport) return;

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: selectedStatus || viewingReport.status,
          admin_notes: adminNotes || null,
        })
        .eq('id', viewingReport.id);

      if (error) throw error;

      toast({
        title: 'Report Updated',
        description: 'The report has been updated successfully.',
      });

      setViewingReport(null);
      setAdminNotes('');
      setSelectedStatus('');
      fetchReports();
    } catch (error: unknown) {
      console.error('Error updating report:', error);
      toast({
        title: 'Update Failed',
        description: (error as Error).message || 'Failed to update report.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (report: Report) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);

      if (error) throw error;

      toast({
        title: 'Report Deleted',
        description: 'The report has been removed.',
      });

      setDeleteConfirm(null);
      fetchReports();
    } catch (error: unknown) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Delete Failed',
        description: (error as Error).message || 'Failed to delete report.',
        variant: 'destructive',
      });
    }
  };

  const openViewModal = (report: Report) => {
    setViewingReport(report);
    setAdminNotes(report.admin_notes || '');
    setSelectedStatus(report.status);
  };

  const filteredReports = reports.filter(report =>
    report.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.report_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Reports Management</h2>
          <p className="text-sm text-muted-foreground">View and manage student reports</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchReports}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reports.length}</p>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by subject, name, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input pl-12"
        />
      </motion.div>

      {/* Reports List */}
      <motion.div variants={itemVariants} className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No reports found</p>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'Try a different search term' : 'No reports have been submitted yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Report</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Type</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Date</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-xs">{report.subject}</p>
                          <p className="text-sm text-muted-foreground">{report.reporter_name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent">
                          {report.report_type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          {report.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">{formatDate(report.created_at)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(report)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {deleteConfirm === report.id ? (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(report)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(report.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate max-w-[200px]">{report.subject}</p>
                      <p className="text-xs text-muted-foreground">{report.reporter_name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewModal(report)}
                        className="h-9 w-9 p-0 text-primary hover:bg-primary/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {deleteConfirm === report.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(report)}
                            className="h-9 w-9 p-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                            className="h-9 w-9 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(report.id)}
                          className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-xl">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent">
                      {report.report_type}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold px-1">
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* View Report Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Report Details</h2>
              <button
                onClick={() => {
                  setViewingReport(null);
                  setAdminNotes('');
                  setSelectedStatus('');
                }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Reporter Info */}
              <div className="p-4 rounded-xl bg-secondary">
                <p className="text-sm text-muted-foreground">Reported by</p>
                <p className="font-semibold text-foreground">{viewingReport.reporter_name}</p>
                <p className="text-sm text-muted-foreground">{viewingReport.reporter_email}</p>
              </div>

              {/* Report Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-foreground">{viewingReport.report_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subject</p>
                  <p className="text-foreground font-medium">{viewingReport.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-foreground whitespace-pre-wrap">{viewingReport.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                  <p className="text-foreground">{formatDate(viewingReport.created_at)}</p>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-2 pt-4 border-t border-border">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="form-input"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status} className="capitalize">
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="form-input min-h-[80px] resize-none"
                  placeholder="Add notes about this report..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setViewingReport(null);
                    setAdminNotes('');
                    setSelectedStatus('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  className="flex-1"
                  onClick={handleUpdateReport}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Update Report
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
