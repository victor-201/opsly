import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useIsAuthenticated } from '../hooks/useSession';
import { PageLoader } from '../components/ui/Spinner';
import { useAuthStore } from '../lib/auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuth = useIsAuthenticated();
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export function ActiveOrgGate({ children }: { children: ReactNode }) {
  const orgCount = useAuthStore((s) => s.organizations.length);
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <PageLoader label="Preparing workspace…" />;
  }
  if (orgCount === 0) {
    return <Navigate to="/org/setup" replace />;
  }
  return <>{children}</>;
}