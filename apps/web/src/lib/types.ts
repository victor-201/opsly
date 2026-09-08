/** Shared API types for OPSLY frontend. */

export type Role = 'owner' | 'admin' | 'operator' | 'viewer';

export type ProviderType =
  | 'render'
  | 'cloudflare'
  | 'neon'
  | 'upstash'
  | 'mongodb-atlas';

export type HealthState =
  | 'healthy'
  | 'degraded'
  | 'down'
  | 'unknown'
  | 'not_supported'
  | 'provider_error'
  | 'authentication_error';

export type AlertStatus = 'active' | 'inactive' | 'triggered' | 'acknowledged' | 'resolved';

export type IncidentStatus = 'detected' | 'investigating' | 'acknowledged' | 'resolved' | 'closed';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ApiErrorBody {
  message: string;
  statusCode: number;
  error?: string;
  details?: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface OrgRef {
  id: string;
  name: string;
  slug: string;
  role: Role;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  organizations: OrgRef[];
}

export interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  deletedAt?: string | null;
  createdAt?: string;
  _count?: { memberships: number; resources: number; applications: number };
  memberships?: Array<{
    id: string;
    role: Role;
    user: { id: string; email: string; name: string };
  }>;
}

export interface ProviderConnection {
  id: string;
  name: string;
  providerType: ProviderType;
  status: string;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
  createdAt?: string;
  _count?: { resources: number };
}

export interface Resource {
  id: string;
  provider: string;
  providerResourceId: string;
  type: string;
  name: string;
  region?: string | null;
  environment?: string | null;
  repository?: string | null;
  branch?: string | null;
  domain?: string | null;
  status: string;
  providerUrl?: string | null;
  capabilities: Record<string, unknown>;
  metadata: Record<string, unknown>;
  lastSyncAt?: string | null;
  createdAt?: string;
  providerConnection?: { name: string; providerType: string } | null;
  applicationResources?: Array<{
    application: { id: string; name: string };
  }>;
  deployments?: Deployment[];
  metricPoints?: MetricPoint[];
  logs?: LogRecord[];
}

export interface Application {
  id: string;
  name: string;
  description?: string | null;
  metadata: {
    repositoryUrl?: string;
    type?: string;
  };
  _count?: { applicationResources: number };
  createdAt?: string;
}

export interface ApplicationDetail extends Application {
  applicationResources?: Array<{
    role: string;
    confidence: string | number;
    resource: Pick<Resource, 'id' | 'name' | 'type' | 'status' | 'provider'>;
  }>;
  domains?: Domain[];
}

export interface Domain {
  id: string;
  name: string;
  verified: boolean;
  ssl: boolean;
  expiresAt?: string | null;
  dnsRecords: unknown[];
}

export interface Alert {
  id: string;
  name: string;
  condition: string;
  threshold?: number | null;
  scope: Record<string, unknown>;
  enabled: boolean;
  status: AlertStatus;
  lastTriggeredAt?: string | null;
  lastAcknowledgedAt?: string | null;
  lastResolvedAt?: string | null;
  createdAt?: string;
}

export interface Incident {
  id: string;
  title: string;
  description?: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  affectedResources?: unknown[];
  timeline?: unknown[];
  createdAt?: string;
}

export interface IncidentDetail extends Incident {
  notes?: IncidentNote[];
}

export interface IncidentNote {
  id: string;
  content: string;
  createdAt: string;
  author?: { name?: string; email?: string } | null;
}

export interface AuditLog {
  id: string;
  actorEmail?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  details: Record<string, unknown>;
  ipAddress?: string | null;
  result: string;
  createdAt?: string;
}

export interface Deployment {
  id: string;
  status: string;
  commitSha?: string | null;
  branch?: string | null;
  providerDeploymentId?: string | null;
  startedAt?: string;
  finishedAt?: string | null;
}

export interface MetricPoint {
  id: string;
  metric: string;
  value: number;
  unit?: string | null;
  recordedAt: string;
}

export interface LogRecord {
  id: string;
  level: string;
  message: string;
  source?: string | null;
  recordedAt: string;
}

export interface ChatToolResult {
  tool: string;
  success: boolean;
  data: unknown;
  error?: string;
}