import type { ComponentType, SVGProps } from 'react';
import {
  IconDashboard,
  IconBox,
  IconServer,
  IconLayers,
  IconBell,
  IconFlame,
  IconChat,
  IconShieldCheck,
  IconSettings,
} from '../components/ui/icons';
import { PERMISSIONS } from '../lib/permissions';
import type { Permission } from '../lib/permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  permission?: Permission;
  end?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: IconDashboard, end: true },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { to: '/applications', label: 'Applications', icon: IconBox, permission: PERMISSIONS.resourceRead },
      { to: '/resources', label: 'Resources', icon: IconServer, permission: PERMISSIONS.resourceRead },
      { to: '/providers', label: 'Providers', icon: IconLayers, permission: PERMISSIONS.providerRead },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/alerts', label: 'Alerts', icon: IconBell, permission: PERMISSIONS.alertsRead },
      { to: '/incidents', label: 'Incidents', icon: IconFlame, permission: PERMISSIONS.incidentsRead },
    ],
  },
  {
    title: 'Platform',
    items: [
      { to: '/chat', label: 'AI Assistant', icon: IconChat, permission: PERMISSIONS.chatUse },
      { to: '/audit', label: 'Audit Log', icon: IconShieldCheck, permission: PERMISSIONS.auditRead },
      { to: '/settings', label: 'Settings', icon: IconSettings, permission: PERMISSIONS.settingsManage },
    ],
  },
];