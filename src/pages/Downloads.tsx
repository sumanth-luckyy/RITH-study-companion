import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Bookmark,
  FileText,
  Search,
  Eye,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { academicService } from '@/services/academicService';
import { AcademicResource } from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Downloads() {
  const { user } = useAuth();
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'all'>('saved');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicService.getResources(undefined, user?.id);
      setResources(data);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleToggleBookmark = async (id: string) => {
    const isNow = await academicService.toggleBookmark(id, user?.id);
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_bookmarked: isNow } : r))
    );
  };

  const savedResources = resources.filter((r) => r.is_bookmarked);

  const displayedList = (activeTab === 'saved' ? savedResources : resources).filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      r.title.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q) ||
      r.unit_or_topic.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Downloads & Saved Materials"
        subtitle="Quick access to bookmarked lecture notes, offline files, and reference PDFs."
        badge={`${savedResources.length} Bookmarked`}
      />

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-border pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'saved'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Saved Bookmarks ({savedResources.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All Course Downloads ({resources.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved files..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : displayedList.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={
            activeTab === 'saved'
              ? 'No saved materials yet'
              : 'No matching materials found'
          }
          description={
            activeTab === 'saved'
              ? 'Bookmark key notes and question papers from the Notes & Resources page to access them quickly here.'
              : 'Try changing your search term.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedList.map((res) => (
            <div
              key={res.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-secondary text-secondary-foreground border border-border">
                    {res.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{res.file_size}</span>
                </div>

                <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                  {res.title}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-1">
                  {res.subject} • {res.unit_or_topic}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => handleToggleBookmark(res.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                  title={res.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      res.is_bookmarked ? 'fill-primary text-primary' : ''
                    }`}
                  />
                </button>

                <Button
                  asChild
                  size="sm"
                  className="rounded-xl text-xs gap-1.5 h-8"
                >
                  <a href={res.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5" /> Download
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
