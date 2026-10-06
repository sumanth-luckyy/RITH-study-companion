import { cn } from '@/lib/utils';

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-muted/60 dark:bg-muted/40',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-5 w-1/3" />
        <LoadingSkeleton className="h-4 w-16 rounded-full" />
      </div>
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-3/4" />
      <div className="pt-2 flex items-center gap-2">
        <LoadingSkeleton className="h-8 w-24 rounded-lg" />
        <LoadingSkeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
