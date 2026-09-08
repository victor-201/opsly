import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500 active:bg-brand-800',
  secondary:
    'bg-surface-900 text-white shadow-sm hover:bg-surface-700 focus-visible:ring-surface-400',
  outline:
    'border border-border bg-surface-0 text-foreground shadow-sm hover:bg-surface-50 focus-visible:ring-brand-500',
  ghost: 'text-surface-700 hover:bg-surface-100 hover:text-foreground focus-visible:ring-surface-300',
  danger:
    'bg-danger-600 text-white shadow-sm hover:bg-danger-700 focus-visible:ring-danger-500',
  success:
    'bg-success-600 text-white shadow-sm hover:bg-success-700 focus-visible:ring-success-500',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-9 w-9',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';