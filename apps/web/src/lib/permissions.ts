import type { Role } from './types';

/** Permission strings mirroring the backend RbacGuard. */
export const PERMISSIONS = {
  providerConnect: 'provider:connect',
  providerRead: 'provider:read',
  providerManage: 'provider:manage',
  resourceRead: 'resource:read',
  resourceManage: 'resource:manage',
  deploymentRead: 'deployment:read',
  deploymentTrigger: 'deployment:trigger',
  deploymentRollback: 'deployment:rollback',
  metricsRead: 'metrics:read',
  logsRead: 'logs:read',
  alertsRead: 'alerts:read',
  alertsManage: 'alerts:manage',
  incidentsRead: 'incidents:read',
  incidentsManage: 'incidents:manage',
  chatUse: 'chat:use',
  auditRead: 'audit:read',
  settingsManage: 'settings:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: [
    PERMISSIONS.providerConnect,
    PERMISSIONS.providerRead,
    PERMISSIONS.providerManage,
    PERMISSIONS.resourceRead,
    PERMISSIONS.resourceManage,
    PERMISSIONS.deploymentRead,
    PERMISSIONS.deploymentTrigger,
    PERMISSIONS.deploymentRollback,
    PERMISSIONS.metricsRead,
    PERMISSIONS.logsRead,
    PERMISSIONS.alertsRead,
    PERMISSIONS.alertsManage,
    PERMISSIONS.incidentsRead,
    PERMISSIONS.incidentsManage,
    PERMISSIONS.chatUse,
    PERMISSIONS.auditRead,
    PERMISSIONS.settingsManage,
  ],
  admin: [
    PERMISSIONS.providerConnect,
    PERMISSIONS.providerRead,
    PERMISSIONS.providerManage,
    PERMISSIONS.resourceRead,
    PERMISSIONS.resourceManage,
    PERMISSIONS.deploymentRead,
    PERMISSIONS.deploymentTrigger,
    PERMISSIONS.deploymentRollback,
    PERMISSIONS.metricsRead,
    PERMISSIONS.logsRead,
    PERMISSIONS.alertsRead,
    PERMISSIONS.alertsManage,
    PERMISSIONS.incidentsRead,
    PERMISSIONS.incidentsManage,
    PERMISSIONS.chatUse,
    PERMISSIONS.auditRead,
    PERMISSIONS.settingsManage,
  ],
  operator: [
    PERMISSIONS.providerRead,
    PERMISSIONS.resourceRead,
    PERMISSIONS.resourceManage,
    PERMISSIONS.deploymentRead,
    PERMISSIONS.deploymentTrigger,
    PERMISSIONS.metricsRead,
    PERMISSIONS.logsRead,
    PERMISSIONS.alertsRead,
    PERMISSIONS.alertsManage,
    PERMISSIONS.incidentsRead,
    PERMISSIONS.incidentsManage,
    PERMISSIONS.chatUse,
  ],
  viewer: [
    PERMISSIONS.providerRead,
    PERMISSIONS.resourceRead,
    PERMISSIONS.deploymentRead,
    PERMISSIONS.metricsRead,
    PERMISSIONS.logsRead,
    PERMISSIONS.alertsRead,
    PERMISSIONS.incidentsRead,
    PERMISSIONS.chatUse,
  ],
};

export function permissionsForRole(role?: Role | null): readonly Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role | null | undefined, p: Permission): boolean {
  return permissionsForRole(role).includes(p);
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer',
};