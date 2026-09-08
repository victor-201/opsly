import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { badgeStyles, toneFor, type Tone } from '../../lib/theme';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ className, tone = 'neutral', dot = false, children, ...props }: BadgeProps) {
  const style = badgeStyles[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        style.container,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />}
      {children}
    </span>
  );
}

/** Badge whose tone is derived automatically from a raw status value. */
export function StatusBadge({ value, ...props }: Omit<BadgeProps, 'tone'> & { value?: string | null }) {
  return <Badge tone={toneFor(value)} {...props}>{value ?? 'Unknown'}</Badge>;
}

export function StatusPill({ value, className }: { value?: string | null; className?: string }) {
  const style = badgeStyles[toneFor(value)];
  return <span className={cn('inline-flex h-2 w-2 shrink-0 rounded-full', style.dot, className)} />;
}