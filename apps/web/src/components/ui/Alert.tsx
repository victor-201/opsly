import type { ComponentType, ReactNode, SVGProps } from 'react';
import { cn } from '../../lib/cn';
import { IconAlertTriangle, IconActivity, IconCheck } from './icons';

type AlertTone = 'info' | 'warning' | 'danger' | 'success';

const styles: Record<AlertTone, { container: string; icon: ComponentType<SVGProps<SVGSVGElement>>; iconColor: string }> = {
  info: { container: 'border-info-200 bg-info-50 text-info-700', icon: IconActivity, iconColor: 'text-info-600' },
  warning: { container: 'border-warning-200 bg-warning-50 text-warning-700', icon: IconAlertTriangle, iconColor: 'text-warning-600' },
  danger: { container: 'border-danger-200 bg-danger-50 text-danger-700', icon: IconAlertTriangle, iconColor: 'text-danger-600' },
  success: { container: 'border-success-200 bg-success-50 text-success-700', icon: IconCheck, iconColor: 'text-success-600' },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const s = styles[tone];
  const Icon = s.icon as ComponentType<SVGProps<SVGSVGElement>>;
  return (
    <div className={cn('flex items-start gap-3 rounded-md border px-4 py-3 text-sm', s.container, className)}>
      <Icon className={cn('mt-0.5 shrink-0', s.iconColor)} width={18} height={18} />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
      </div>
    </div>
  );
}