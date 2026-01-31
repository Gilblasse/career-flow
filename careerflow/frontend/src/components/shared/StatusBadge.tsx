import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 
  | 'applied' 
  | 'interview' 
  | 'offer' 
  | 'rejected' 
  | 'saved' 
  | 'pending'
  | 'success'
  | 'warning'
  | 'error'
  | 'default';

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

const statusStyles: Record<StatusVariant, string> = {
  applied: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  interview: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  offer: 'bg-green-100 text-green-700 hover:bg-green-100',
  rejected: 'bg-red-100 text-red-700 hover:bg-red-100',
  saved: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  pending: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  success: 'bg-green-100 text-green-700 hover:bg-green-100',
  warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  error: 'bg-red-100 text-red-700 hover:bg-red-100',
  default: 'bg-secondary text-secondary-foreground hover:bg-secondary',
};

const defaultLabels: Record<StatusVariant, string> = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  saved: 'Saved',
  pending: 'Pending',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  default: 'Unknown',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge 
      variant="secondary"
      className={cn(statusStyles[status], "font-medium", className)}
    >
      {label || defaultLabels[status]}
    </Badge>
  );
}
