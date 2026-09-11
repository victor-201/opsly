import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { IconLock, IconActivity, IconShieldCheck } from '../components/ui/icons';
import { useIsAuthenticated } from '../hooks/useSession';

export function NotFoundPage() {
  const authed = useIsAuthenticated();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-surface-400">
        <IconActivity width={28} height={28} />
      </div>
      <div>
        <p className="text-4xl font-bold text-foreground">404</p>
        <p className="mt-1 text-muted">The page you're looking for doesn't exist.</p>
      </div>
      <Link to={authed ? '/dashboard' : '/login'}>
        <Button variant="outline">Back home</Button>
      </Link>
    </div>
  );
}

export function ForbiddenPage() {
  const authed = useIsAuthenticated();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-50 text-warning-600">
        <IconLock width={28} height={28} />
      </div>
      <div>
        <p className="text-4xl font-bold text-foreground">403</p>
        <p className="mt-1 text-muted">Your role doesn't have access to this page.</p>
      </div>
      <Link to={authed ? '/dashboard' : '/login'}>
        <Button variant="outline">
          <IconShieldCheck width={14} height={14} /> Back home
        </Button>
      </Link>
    </div>
  );
}