import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type {
  Application,
  ApplicationDetail,
  Resource,
  ProviderConnection,
  Alert,
  Incident,
  IncidentDetail,
  AuditLog,
  ChatToolResult,
  Organization,
} from '../lib/types';

export function useApplications() {
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => api.get<Application[]>('/applications'),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: queryKeys.application(id),
    queryFn: () => api.get<ApplicationDetail>(`/applications/${id}`),
    enabled: Boolean(id),
  });
}

export function useResources(filters?: { provider?: string; type?: string; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.provider) params.set('provider', filters.provider);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  return useQuery({
    queryKey: ['resources', filters ?? {}],
    queryFn: () => api.get<Resource[]>(`/resources${qs ? `?${qs}` : ''}`),
  });
}

export function useResource(id: string) {
  return useQuery({
    queryKey: queryKeys.resource(id),
    queryFn: () => api.get<Resource>(`/resources/${id}`),
    enabled: Boolean(id),
  });
}

/** Lightweight resource list used in pickers (name/type/provider/status). */
export function useResourceLite() {
  return useQuery({
    queryKey: ['resources-lite'],
    queryFn: () => api.get<Resource[]>('/resources'),
    select: (data) => data.map((r) => ({ id: r.id, name: r.name, type: r.type, provider: r.provider, status: r.status })),
  });
}

export function useProviders() {
  return useQuery({
    queryKey: queryKeys.providers,
    queryFn: () => api.get<ProviderConnection[]>('/provider-connections'),
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => api.get<Alert[]>('/monitoring/alerts'),
  });
}

export function useIncidents() {
  return useQuery({
    queryKey: queryKeys.incidents,
    queryFn: () => api.get<Incident[]>('/incidents'),
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: queryKeys.incident(id),
    queryFn: () => api.get<IncidentDetail>(`/incidents/${id}`),
    enabled: Boolean(id),
  });
}

export function useAuditLogs(filters?: { userId?: string; action?: string }) {
  const params = new URLSearchParams();
  if (filters?.userId) params.set('userId', filters.userId);
  if (filters?.action) params.set('action', filters.action);
  const qs = params.toString();
  return useQuery({
    queryKey: queryKeys.audit(filters ?? {}),
    queryFn: () => api.get<AuditLog[]>(`/audit${qs ? `?${qs}` : ''}`),
  });
}

export function useChatTools() {
  return useQuery({
    queryKey: queryKeys.chatTools,
    queryFn: () => api.get<{ tools: string[] }>('/chat/tools'),
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => api.get<Organization[]>('/organizations'),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: queryKeys.organization(id),
    queryFn: () => api.get<Organization>(`/organizations/${id}`),
    enabled: Boolean(id),
  });
}

/* Mutations */

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; repositoryUrl?: string }) =>
      api.post<Application>('/applications', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.applications }),
  });
}

export function useUpdateApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; description?: string; repositoryUrl?: string }) =>
      api.put<Application>(`/applications/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.applications });
      qc.invalidateQueries({ queryKey: queryKeys.application(id) });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/applications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.applications }),
  });
}

export function useLinkResource(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => api.post(`/applications/${appId}/resources/${resourceId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.application(appId) }),
  });
}

export function useUnlinkResource(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => api.delete(`/applications/${appId}/resources/${resourceId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.application(appId) }),
  });
}

export function useConnectProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { providerType: string; name: string; credentials: Record<string, string> }) =>
      api.post<ProviderConnection>('/provider-connections', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.providers }),
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/provider-connections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.providers }),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<Resource>(`/resources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.resources }),
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Alert>(`/monitoring/alerts/${id}/acknowledge`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts }),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Alert>(`/monitoring/alerts/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts }),
  });
}

export function useUpdateIncidentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<Incident>(`/incidents/${id}/status`, { status }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: queryKeys.incident(vars.id) }),
  });
}

export function useAddIncidentNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.post(`/incidents/${id}/notes`, { content }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: queryKeys.incident(vars.id) }),
  });
}

export function useExecuteChatTool() {
  return useMutation({
    mutationFn: (body: { tool: string; args?: Record<string, unknown> }) =>
      api.post<ChatToolResult>('/chat/execute', body),
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/organizations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.organizations }),
  });
}