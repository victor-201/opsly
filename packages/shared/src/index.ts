export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export const PROVIDER_TYPES = ['render', 'cloudflare', 'neon', 'upstash', 'mongodb-atlas'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export type HealthState =
  | 'healthy'
  | 'degraded'
  | 'down'
  | 'unknown'
  | 'not_supported'
  | 'provider_error'
  | 'authentication_error';

export type MemberRole = 'owner' | 'admin' | 'operator' | 'viewer';

export type DeploymentStatus = 'building' | 'deploying' | 'live' | 'failed' | 'rolling_back';

export type AlertStatus = 'inactive' | 'triggered' | 'acknowledged' | 'resolved';

export type IncidentStatus = 'detected' | 'investigating' | 'acknowledged' | 'resolved' | 'closed';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SyncJobStatus = 'queued' | 'running' | 'completed' | 'failed';
