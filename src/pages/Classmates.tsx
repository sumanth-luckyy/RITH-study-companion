import { useState, useEffect } from 'react';
import { Users, Search, Hash, GraduationCap, Shield } from 'lucide-react';
import { academicService } from '@/services/academicService';
import { Classmate } from '@/types/academic';
import { PageHeader } from '@/components/common/PageHeader';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';

export default function Classmates() {
  const { profile } = useAuth();
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadClassmates() {
      setIsLoading(true);
      try {
        const list = await academicService.getClassmates(
          profile?.class_group || '',
          profile?.branch,
          profile?.section
        );
        setClassmates(list);
      } finally {
        setIsLoading(false);
      }
    }
    loadClassmates();
  }, [profile?.class_group, profile?.branch, profile?.section]);

  const filtered = classmates.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.roll_number.toLowerCase().includes(q) ||
      c.branch.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Directory"
        subtitle={`Enrolled student directory for ${profile?.class_group || 'your class'} • ${profile?.academic_year || '2025-2026'}.`}
        badge={`${classmates.length} Students`}
      />

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search classmate by name or roll number..."
          className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No classmates found"
          description="Try searching with a different name or roll number."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filtered.map((student) => {
            const isSelf =
              student.roll_number.toUpperCase() === profile?.roll_number?.toUpperCase();

            return (
              <div
                key={student.id}
                className={`rounded-2xl border p-4 bg-card transition-all hover:border-primary/40 ${
                  isSelf
                    ? 'border-primary/50 ring-1 ring-primary/20 bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={student.full_name} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {student.full_name}
                      </h3>
                      {isSelf && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary text-primary-foreground">
                          YOU
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {student.roll_number}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Branch: {student.branch}</span>
                  <span className="font-semibold text-foreground">Section {student.section}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
