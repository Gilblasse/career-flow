import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
  collapsed?: boolean;
}

export function NavButton({ icon, label, isActive = false, onClick, className, collapsed = false }: NavButtonProps) {
  const button = (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl text-[15px] font-medium transition-all",
        collapsed ? "justify-center px-3 py-6" : "justify-start gap-4 px-5 py-6",
        isActive 
          ? "bg-primary/10 text-primary font-bold hover:bg-primary/15" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <span className="flex items-center justify-center shrink-0">
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
