import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon?: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
  onClick?: () => void;
}

const iconTones = {
  neutral: 'bg-surface-100 text-surface-500',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  brand: 'bg-brand-50 text-brand-600',
};

export function StatCard({ label, value, delta, icon, tone = 'neutral', onClick }: StatCardProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-0 p-5 text-left shadow-card',
        onClick && 'cursor-pointer transition-shadow hover:shadow-panel',
      )}
    >
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        {delta && <p className="mt-1 text-xs text-muted">{delta}</p>}
      </div>
      {icon && (
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', iconTones[tone])}>
          {icon}
        </div>
      )}
    </Comp>
  );
}