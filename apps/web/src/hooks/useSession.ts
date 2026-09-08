import { useAuthStore, activeRole } from '../lib/auth';
import { hasPermission, type Permission } from '../lib/permissions';

export function useSession() {
  return useAuthStore((s) => ({
    user: s.user,
    organizations: s.organizations,
    activeOrgId: s.activeOrgId,
    accessToken: s.accessToken,
  }));
}

export function useActiveOrg() {
  return useAuthStore((s) =>
    s.organizations.find((o) => o.id === s.activeOrgId) ?? s.organizations[0] ?? null,
  );
}

export function useRole() {
  return useAuthStore(activeRole);
}

export function useCan(p: Permission) {
  const role = useRole();
  return hasPermission(role, p);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => Boolean(s.accessToken && s.user));
}