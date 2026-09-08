import { useToastStore } from '../../lib/toast';
import { IconCheck, IconAlertTriangle, IconX, IconActivity } from './icons';
import { cn } from '../../lib/cn';

const styles = {
  success: { border: 'border-success-200', icon: <IconCheck width={16} height={16} className="text-success-600" />, bar: 'bg-success-500' },
  error: { border: 'border-danger-200', icon: <IconAlertTriangle width={16} height={16} className="text-danger-600" />, bar: 'bg-danger-500' },
  warning: { border: 'border-warning-200', icon: <IconAlertTriangle width={16} height={16} className="text-warning-600" />, bar: 'bg-warning-500' },
  info: { border: 'border-info-200', icon: <IconActivity width={16} height={16} className="text-info-600" />, bar: 'bg-info-500' },
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const s = styles[t.tone];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-md border bg-surface-0 p-4 shadow-panel',
              s.border,
            )}
          >
            <span className={cn('absolute inset-y-0 left-0 w-1', s.bar)} />
            <div className="mt-0.5">{s.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-muted">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded p-0.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
              aria-label="Dismiss"
            >
              <IconX width={14} height={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}