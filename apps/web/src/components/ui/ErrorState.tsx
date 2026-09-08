import { cn } from '../../lib/cn';

export function ErrorState({ title, description, className }: { title: string; description?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      <p className="text-sm font-medium text-danger-600">{title}</p>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
    </div>
  );
}