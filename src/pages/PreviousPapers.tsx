import { useState, useEffect } from 'react';
import {
  Archive,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { academicService } from '@/services/academicService';
import { AcademicResource } from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

export default function PreviousPapers() {
  const [papers, setPapers] = useState<AcademicResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    async function loadPapers() {
      setIsLoading(true);
      try {
        const allRes = await academicService.getResources({ category: 'Question Papers' });
        setPapers(allRes);
      } finally {
        setIsLoading(false);
      }
    }
    loadPapers();
  }, []);

  const years = ['All', '2025', '2024', '2023'];
  const examTypes = ['All', 'Mid-Semester', 'End-Semester'];

  const filtered = papers.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      p.title.toLowerCase().includes(q) ||
      p.subject.toLowerCase().includes(q);
    const matchYear = selectedYear === 'All' || p.exam_year === selectedYear;
    const matchType = selectedType === 'All' || p.exam_type === selectedType;
    return matchSearch && matchYear && matchType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Previous Question Papers"
        subtitle="Mid-semester, End-semester, and model examination papers for focused revision."
        badge={`${papers.length} Papers`}
      />

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl space-y-3 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers by subject or title..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Exam Year:</span>
            <div className="flex items-center gap-1">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    selectedYear === y
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Exam Type:</span>
            <div className="flex items-center gap-1">
              {examTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    selectedType === t
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No question papers match your filters"
          description="Try selecting 'All' for year and exam type, or clearing your search query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((paper) => (
            <div
              key={paper.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    {paper.exam_year || '2025'} • {paper.exam_type || 'Examination'}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {paper.file_size}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-2">
                    {paper.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {paper.subject} • {paper.semester}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{paper.uploader_name}</span>
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl text-xs gap-1.5 h-8"
                >
                  <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5" /> Download Paper
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
