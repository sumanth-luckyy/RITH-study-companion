import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Download,
  Bookmark,
  Eye,
  Calendar,
  Layers,
  ArrowUpDown,
  BookOpen,
  X,
  ExternalLink,
} from 'lucide-react';
import { academicService } from '@/services/academicService';
import { AcademicResource, ResourceCategory } from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useAuth } from '@/contexts/AuthContext';
import { useAcademicHierarchy } from '@/hooks/useAcademicHierarchy';

const CATEGORIES: ('All' | ResourceCategory)[] = [
  'All',
  'Notes',
  'PDFs',
  'Lab Manuals',
  'Question Papers',
  'Study Materials',
  'Important Documents',
];

export default function Resources() {
  const { profile, user } = useAuth();
  const hierarchy = useAcademicHierarchy();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialSubject = searchParams.get('subject') || 'All';

  const semesters = useMemo(() => {
    return ['All', ...hierarchy.getSemestersForBranch(profile?.branch)];
  }, [hierarchy, profile?.branch]);

  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<'All' | ResourceCategory>('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  const [previewResource, setPreviewResource] = useState<AcademicResource | null>(null);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await academicService.getResources(
        {
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          semester: selectedSemester !== 'All' ? selectedSemester : undefined,
          subject: selectedSubject !== 'All' ? selectedSubject : undefined,
          search: searchQuery,
        },
        user?.id
      );

      // Sort
      const sorted = [...data].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return a.title.localeCompare(b.title);
      });

      setResources(sorted);
    } catch {
      setError('Unable to load notes and academic resources.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedSemester, selectedSubject, searchQuery, sortBy, user?.id]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };

  const handleToggleBookmark = async (id: string) => {
    const isNow = await academicService.toggleBookmark(id, user?.id);
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_bookmarked: isNow } : r))
    );
  };

  const subjectList = ['All', ...Array.from(new Set(resources.map((r) => r.subject))).sort()];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes & Resources"
        subtitle="Verified course syllabus, lecture materials, lab manuals, and question papers."
        badge={`${resources.length} Available`}
      />

      {/* Search and Filters Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl space-y-3 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, subject, or filename..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button type="submit" size="sm" className="rounded-xl px-4 text-xs font-semibold">
            Search
          </Button>
        </form>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-xs">
          {/* Category filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Semester selector */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-border bg-background text-foreground"
            >
              {semesters.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2.5 py-1 text-xs rounded-xl border border-border bg-background text-foreground"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchResources} />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resources found"
          description="Try broadening your search or selecting a different category."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            setSelectedSemester('All');
            setSelectedSubject('All');
            fetchResources();
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-md bg-secondary text-secondary-foreground border border-border">
                    {res.category}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {res.file_size}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-2">
                    {res.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {res.description || 'Course material reference for exam preparation and lab work.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{res.subject}</span>
                  <span>•</span>
                  <span>{res.unit_or_topic}</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleBookmark(res.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                  title={res.is_bookmarked ? 'Saved' : 'Save resource'}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      res.is_bookmarked ? 'fill-primary text-primary' : ''
                    }`}
                  />
                </button>

                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => setPreviewResource(res)}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl text-xs gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="h-8 rounded-xl text-xs gap-1"
                  >
                    <a href={res.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <Dialog open={!!previewResource} onOpenChange={() => setPreviewResource(null)}>
          <DialogContent className="max-w-lg rounded-2xl p-6">
            <DialogHeader className="space-y-1">
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-primary/10 text-primary w-fit">
                {previewResource.category}
              </span>
              <DialogTitle className="text-base font-bold">
                {previewResource.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                {previewResource.description || 'No additional summary provided.'}
              </p>

              <div className="rounded-xl bg-secondary/50 p-3 space-y-1.5 border border-border/60">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-semibold text-foreground">{previewResource.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Topic/Unit:</span>
                  <span className="font-semibold text-foreground">{previewResource.unit_or_topic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size:</span>
                  <span className="font-semibold text-foreground">{previewResource.file_size} ({previewResource.file_type})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uploader:</span>
                  <span className="font-semibold text-foreground">{previewResource.uploader_name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewResource(null)}
                className="rounded-xl"
              >
                Close
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-xl gap-1.5"
              >
                <a href={previewResource.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
