import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  Edit2,
  RefreshCw,
  Code,
  Hash,
} from 'lucide-react';
import { academicService } from '@/services/academicService';
import {
  RollNumberFormatConfig,
  ParsedRollNumber,
} from '@/types/academic';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function RollParserSettings() {
  const { toast } = useToast();
  const [formats, setFormats] = useState<RollNumberFormatConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live Tester
  const [testRoll, setTestRoll] = useState('25ME1A4602');
  const [testResult, setTestResult] = useState<ParsedRollNumber | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Format Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<RollNumberFormatConfig | null>(null);
  const [formatForm, setFormatForm] = useState({
    name: '',
    pattern: '',
    year_group_index: 1,
    college_group_index: 2,
    branch_code_group_index: 3,
    roll_group_index: 4,
    century_prefix: 2000,
    sample_roll: '25ME1A4602',
    description: '',
    is_default: false,
    is_active: true,
  });

  const loadFormats = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicService.getRollFormats();
      setFormats(data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load roll number format rules.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleRunTest = async (rollToTest: string) => {
    setIsTesting(true);
    try {
      const result = await academicService.parseStudentRoll(rollToTest);
      setTestResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    loadFormats();
    handleRunTest('25ME1A4602');
  }, [loadFormats]);

  const openCreateModal = () => {
    setEditingFormat(null);
    setFormatForm({
      name: 'Custom Institutional Format',
      pattern: '^(\\d{2})([A-Z]{2})([A-Z0-9]{2})(\\d{4})$',
      year_group_index: 1,
      college_group_index: 2,
      branch_code_group_index: 3,
      roll_group_index: 4,
      century_prefix: 2000,
      sample_roll: '25ME1A4602',
      description: 'Custom regex pattern for new institutional batches',
      is_default: false,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleSaveFormat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formatForm.name || !formatForm.pattern) return;

    if (editingFormat) {
      const ok = await academicService.updateRollFormat(editingFormat.id, formatForm);
      if (ok) {
        toast({ title: 'Format Updated' });
        setModalOpen(false);
        loadFormats();
      }
    } else {
      const created = await academicService.createRollFormat(formatForm);
      if (created) {
        toast({ title: 'Format Created', description: created.name });
        setModalOpen(false);
        loadFormats();
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* ---------------- 1. HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <span>Configurable Roll Number Parser & Rules</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure dynamic institutional parsing rules for roll numbers (e.g. 25ME1A4602 → 25 Joining Year, ME College, 1A Branch Code, 4602 Roll).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={loadFormats} className="h-8 gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button size="sm" onClick={openCreateModal} className="h-8 gap-1.5 text-xs bg-primary">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Format Rule</span>
          </Button>
        </div>
      </div>

      {/* ---------------- 2. LIVE INTERACTIVE PARSER SANDBOX ---------------- */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Interactive Roll Parser Sandbox</h3>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
            Live Testing Engine
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={testRoll}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setTestRoll(val);
                handleRunTest(val);
              }}
              placeholder="e.g. 25ME1A4602 or 25CS042"
              className="w-full pl-9 pr-4 py-2.5 text-sm font-mono font-bold tracking-wider rounded-xl border border-border bg-background uppercase focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleRunTest(testRoll)}
              disabled={isTesting}
              className="h-10 text-xs gap-1.5 px-4 bg-primary"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Evaluate</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestRoll('25ME1A4602');
                handleRunTest('25ME1A4602');
              }}
              className="h-10 text-xs px-3"
            >
              Example 1 (25ME1A4602)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestRoll('25CS042');
                handleRunTest('25CS042');
              }}
              className="h-10 text-xs px-3"
            >
              Example 2 (25CS042)
            </Button>
          </div>
        </div>

        {/* Live Parse Results Cards */}
        {testResult && (
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {testResult.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
                <span className="text-xs font-bold text-foreground">
                  Parse Status:{' '}
                  <span className={testResult.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                    {testResult.isValid ? 'VALID INSTITUTIONAL ROLL NUMBER' : 'INVALID / UNMATCHED'}
                  </span>
                </span>
              </div>
              {testResult.formatName && (
                <span className="text-[10px] font-mono bg-background px-2 py-0.5 rounded border border-border text-muted-foreground">
                  Rule: {testResult.formatName}
                </span>
              )}
            </div>

            {testResult.isValid ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                <div className="p-3 bg-background rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Joining Year
                  </span>
                  <span className="text-sm font-bold font-mono text-primary mt-0.5 block">
                    {testResult.joiningYear || '—'}
                  </span>
                </div>

                <div className="p-3 bg-background rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    College Code
                  </span>
                  <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                    {testResult.collegeCode || 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-background rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Branch Code
                  </span>
                  <span className="text-sm font-bold font-mono text-amber-500 mt-0.5 block">
                    {testResult.branchCode || '—'}
                  </span>
                </div>

                <div className="p-3 bg-background rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Numeric Roll
                  </span>
                  <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                    {testResult.numericRoll || '—'}
                  </span>
                </div>

                <div className="p-3 bg-background rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Mapped Branch
                  </span>
                  <span className="text-xs font-bold text-foreground mt-0.5 block truncate" title={testResult.mappedBranchName}>
                    {testResult.mappedBranchName || 'CSE'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/20 text-xs text-destructive">
                {testResult.errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------- 3. CONFIGURED FORMAT RULES TABLE ---------------- */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Configured Roll Number Format Rules</h3>
          </div>
          <span className="text-xs text-muted-foreground">{formats.length} registered patterns</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Format Name</th>
                  <th className="py-3 px-4 font-semibold">Sample Pattern</th>
                  <th className="py-3 px-4 font-semibold">Regex Rule</th>
                  <th className="py-3 px-4 font-semibold">Group Mappings</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {formats.map((fmt) => (
                  <tr key={fmt.id} className="hover:bg-secondary/20">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground block">{fmt.name}</span>
                      {fmt.description && (
                        <span className="text-[10px] text-muted-foreground block">{fmt.description}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">{fmt.sample_roll}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground max-w-xs truncate" title={fmt.pattern}>
                      {fmt.pattern}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-muted-foreground">
                      Year: G{fmt.year_group_index} | College: G{fmt.college_group_index} | Code: G{fmt.branch_code_group_index} | Roll: G{fmt.roll_group_index}
                    </td>
                    <td className="py-3 px-4">
                      {fmt.is_default ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                          DEFAULT ACTIVE
                        </span>
                      ) : fmt.is_active ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingFormat(fmt);
                          setFormatForm({
                            name: fmt.name,
                            pattern: fmt.pattern,
                            year_group_index: fmt.year_group_index,
                            college_group_index: fmt.college_group_index,
                            branch_code_group_index: fmt.branch_code_group_index,
                            roll_group_index: fmt.roll_group_index,
                            century_prefix: fmt.century_prefix || 2000,
                            sample_roll: fmt.sample_roll,
                            description: fmt.description || '',
                            is_default: fmt.is_default,
                            is_active: fmt.is_active,
                          });
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                        title="Edit Format"
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
      </div>

      {/* ---------------- 4. CREATE / EDIT FORMAT MODAL ---------------- */}
      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingFormat ? 'Edit Format Rule' : 'New Roll Number Format Rule'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveFormat} className="space-y-4 py-2 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={formatForm.name}
                  onChange={(e) => setFormatForm({ ...formatForm, name: e.target.value })}
                  placeholder="e.g. Institutional 10-Character"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Sample Roll Number *</label>
                <input
                  type="text"
                  required
                  value={formatForm.sample_roll}
                  onChange={(e) => setFormatForm({ ...formatForm, sample_roll: e.target.value.toUpperCase() })}
                  placeholder="e.g. 25ME1A4602"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Regular Expression Pattern *</label>
                <input
                  type="text"
                  required
                  value={formatForm.pattern}
                  onChange={(e) => setFormatForm({ ...formatForm, pattern: e.target.value })}
                  placeholder="^(\\d{2})([A-Z]{2})([A-Z0-9]{2})(\\d{4})$"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Year Group #</label>
                  <input
                    type="number"
                    value={formatForm.year_group_index}
                    onChange={(e) => setFormatForm({ ...formatForm, year_group_index: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">College Code Group #</label>
                  <input
                    type="number"
                    value={formatForm.college_group_index}
                    onChange={(e) => setFormatForm({ ...formatForm, college_group_index: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Branch Code Group #</label>
                  <input
                    type="number"
                    value={formatForm.branch_code_group_index}
                    onChange={(e) => setFormatForm({ ...formatForm, branch_code_group_index: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Roll Sequence Group #</label>
                  <input
                    type="number"
                    value={formatForm.roll_group_index}
                    onChange={(e) => setFormatForm({ ...formatForm, roll_group_index: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Century Prefix</label>
                <input
                  type="number"
                  value={formatForm.century_prefix}
                  onChange={(e) => setFormatForm({ ...formatForm, century_prefix: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fmt_is_default"
                  checked={formatForm.is_default}
                  onChange={(e) => setFormatForm({ ...formatForm, is_default: e.target.checked })}
                  className="rounded border-border text-primary"
                />
                <label htmlFor="fmt_is_default" className="text-muted-foreground cursor-pointer">
                  Set as Default Institutional Format
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-primary">Save Format</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
