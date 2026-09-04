export interface ProviderAdapter {
  validateConnection(credentials: ProviderCredentials): Promise<ConnectionResult>;
  getCapabilities(): ProviderCapabilities;
  discoverResources(): Promise<NormalizedResource[]>;
  getResource(id: string): Promise<NormalizedResource>;

  getHealth?(id: string): Promise<ResourceHealth>;
  getMetrics?(id: string, range: MetricRange): Promise<MetricPoint[]>;
  getDeployments?(id: string): Promise<Deployment[]>;
  getLogs?(id: string, query: LogQuery): Promise<LogEntry[]>;
}

export interface ProviderCredentials {
  [key: string]: string;
}

export interface ConnectionResult {
  valid: boolean;
  error?: string;
  accountInfo?: {
    id: string;
    name: string;
  };
}

export interface ProviderCapabilities {
  health: boolean;
  metrics: string[];
  deployments: boolean;
  logs: boolean;
  domains: boolean;
}

export interface NormalizedResource {
  providerResourceId: string;
  type: string;
  name: string;
  region?: string;
  environment?: string;
  repository?: string;
  branch?: string;
  domain?: string;
  status: string;
  providerUrl?: string;
  capabilities: Record<string, boolean>;
  metadata: Record<string, unknown>;
}

export interface ResourceHealth {
  health: 'healthy' | 'degraded' | 'down' | 'unknown';
  evidence: HealthEvidence[];
  checkedAt: Date;
}

export interface HealthEvidence {
  source: string;
  value: string;
  collectedAt: Date;
  freshness: string;
}

export interface MetricRange {
  from: Date;
  to: Date;
  interval?: string;
}

export interface MetricPoint {
  timestamp: Date;
  metric: string;
  value: number;
  unit?: string;
  source: string;
}

export interface Deployment {
  id: string;
  status: string;
  commitSha?: string;
  branch?: string;
  metadata: Record<string, unknown>;
  startedAt: Date;
  finishedAt?: Date;
}

export interface LogQuery {
  from?: Date;
  to?: Date;
  level?: string;
  limit?: number;
  search?: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: string;
  message: string;
  metadata: Record<string, unknown>;
  source?: string;
}
