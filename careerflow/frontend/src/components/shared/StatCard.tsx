import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  change?: string;
  iconClassName?: string;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export function StatCard({ 
  icon, 
  title, 
  value, 
  change,
  iconClassName = 'bg-primary/10 text-primary',
  className,
  onClick,
  isSelected = false,
}: StatCardProps) {
  return (
    <Card 
      className={cn(
        "border-0 shadow-sm transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
        isSelected && "ring-2 ring-primary ring-offset-2",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            iconClassName
          )}>
            {icon}
          </div>
          <span className="font-semibold text-[15px]">{title}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold">{value}</span>
          {change && (
            <span className="text-xs text-muted-foreground">{change}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
