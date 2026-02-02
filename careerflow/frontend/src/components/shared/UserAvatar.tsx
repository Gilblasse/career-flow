import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

export function UserAvatar({ src, name, size = 'md', className }: UserAvatarProps) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Check if className includes rounded-full to override default rounded-xl
  const hasRoundedFull = className?.includes('rounded-full');
  const roundedClass = hasRoundedFull ? '' : 'rounded-xl';

  if (src) {
    return (
      <div
        className={cn(
          "bg-muted bg-cover bg-center shrink-0",
          roundedClass,
          sizeStyles[size],
          className
        )}
        style={{ backgroundImage: `url("${src}")` }}
      />
    );
  }

  return (
    <div
      className={cn(
        "bg-muted flex items-center justify-center shrink-0 font-medium text-muted-foreground",
        roundedClass,
        sizeStyles[size],
        className
      )}
    >
      {initials || <User className="w-1/2 h-1/2" />}
    </div>
  );
}
