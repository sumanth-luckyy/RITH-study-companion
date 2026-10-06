import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  iconBg?: string;
  onClick?: () => void;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'text-primary',
  iconBg = 'bg-primary/10',
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all duration-200',
        onClick && 'cursor-pointer hover:border-primary/40 hover:shadow-sm'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtext && <p className="text-[11px] text-muted-foreground">{subtext}</p>}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
      </div>
    </div>
  );
}
