import type { ReactNode } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { cn } from '../../lib/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-surface-400">
          <Icon width={22} height={22} />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}