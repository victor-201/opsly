import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const baseField =
  'flex w-full rounded-md border border-input bg-surface-0 px-3 text-sm text-foreground shadow-sm ' +
  'placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(baseField, 'h-10', invalid ? 'border-danger-500' : '', className)}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(baseField, 'min-h-[80px] py-2', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(baseField, 'h-10 pr-8', invalid ? 'border-danger-500' : '', className)}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-danger-600">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}