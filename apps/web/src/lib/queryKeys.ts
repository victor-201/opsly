export const queryKeys = {
  dashboard: ['dashboard'] as const,
  applications: ['applications'] as const,
  application: (id: string) => ['applications', id] as const,
  resources: ['resources'] as const,
  resource: (id: string) => ['resources', id] as const,
  providers: ['providers'] as const,
  provider: (id: string) => ['providers', id] as const,
  alerts: ['alerts'] as const,
  incidents: ['incidents'] as const,
  incident: (id: string) => ['incidents', id] as const,
  chatTools: ['chat', 'tools'] as const,
  audit: (filters: Record<string, string | undefined>) =>
    ['audit', filters.userId ?? '', filters.action ?? ''] as const,
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organizations', id] as const,
};