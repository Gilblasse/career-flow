import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function IconButton({
  icon,
  onClick,
  variant = 'ghost',
  size = 'icon',
  className,
  label,
  disabled,
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn("shrink-0", className)}
      aria-label={label}
    >
      {icon}
    </Button>
  );
}
