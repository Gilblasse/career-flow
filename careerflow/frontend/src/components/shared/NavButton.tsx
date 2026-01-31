import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}

export function NavButton({ icon, label, isActive = false, onClick, className }: NavButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "w-full justify-start gap-4 px-5 py-6 rounded-xl text-[15px] font-medium transition-all",
        isActive 
          ? "bg-primary/10 text-primary font-bold hover:bg-primary/15" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <span className="flex items-center justify-center shrink-0">
        {icon}
      </span>
      {label}
    </Button>
  );
}
