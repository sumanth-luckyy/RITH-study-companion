import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  role?: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ name, role, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : 'U';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg font-bold',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          'rounded-xl object-cover border border-border',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  const isAdmin = role?.toLowerCase() === 'admin';

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center font-bold select-none border transition-colors',
        isAdmin
          ? 'bg-destructive/10 text-destructive border-destructive/20'
          : 'bg-primary/10 text-primary border-primary/20',
        sizeClasses[size],
        className
      )}
      title={`${name} (${role || 'student'})`}
    >
      {initial}
    </div>
  );
}
