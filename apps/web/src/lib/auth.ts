import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, OrgRef, Role } from './types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  organizations: OrgRef[];
  activeOrgId: string | null;
  setSession: (payload: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    organizations?: OrgRef[];
  }) => void;
  setOrganizations: (orgs: OrgRef[]) => void;
  setActiveOrgId: (id: string) => void;
  removeOrganization: (id: string) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      organizations: [],
      activeOrgId: null,
      setSession: ({ accessToken, refreshToken, user, organizations = [] }) =>
        set({ accessToken, refreshToken, user, organizations }),
      setOrganizations: (organizations) => set({ organizations }),
      setActiveOrgId: (activeOrgId) => set({ activeOrgId }),
      removeOrganization: (id) =>
        set((state) => {
          const organizations = state.organizations.filter((o) => o.id !== id);
          const activeOrgId =
            state.activeOrgId === id ? (organizations[0]?.id ?? null) : state.activeOrgId;
          return { organizations, activeOrgId };
        }),
      updateTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          organizations: [],
          activeOrgId: null,
        }),
    }),
    { name: 'opsly-auth' },
  ),
);

export function selectActiveOrg(state: AuthState): OrgRef | null {
  return (
    state.organizations.find((o) => o.id === state.activeOrgId) ??
    state.organizations[0] ??
    null
  );
}

export function activeRole(state: AuthState): Role | null {
  return selectActiveOrg(state)?.role ?? null;
}