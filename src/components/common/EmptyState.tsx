import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  const btnLabel = actionLabel || action?.label;
  const btnAction = onAction || action?.onClick;

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 my-4">
      <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {btnLabel && btnAction && (
        <Button onClick={btnAction} variant="outline" size="sm" className="rounded-xl">
          {btnLabel}
        </Button>
      )}
    </div>
  );
}
