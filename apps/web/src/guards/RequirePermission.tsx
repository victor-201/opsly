import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useSession';
import { hasPermission, type Permission } from '../lib/permissions';

/** Blocks access to a route when the active role lacks the permission. */
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const role = useRole();

  if (!hasPermission(role, permission)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}