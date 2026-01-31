import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export function FormTextarea({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  placeholder, 
  required,
  disabled,
  rows = 4,
  className 
}: FormTextareaProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={name} 
        className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}
      >
        {label}
      </Label>
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
