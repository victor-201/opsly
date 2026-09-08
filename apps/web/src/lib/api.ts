import { useAuthStore } from './auth';
import type { ApiErrorBody, LoginResponse, RegisterResponse, RefreshResponse } from './types';

const BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(body?.message ?? message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  orgScoped?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = true, orgScoped = true } = options;

  const state = useAuthStore.getState();

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth && state.accessToken) {
    finalHeaders.Authorization = `Bearer ${state.accessToken}`;
  }
  if (orgScoped && state.activeOrgId) {
    finalHeaders['X-Organization-Id'] = state.activeOrgId;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) {
    return undefined as T;
  }

  if (res.status === 401 && auth && state.refreshToken) {
    const refreshed = await tryRefresh(state.refreshToken);
    if (refreshed) {
      return request<T>(path, options);
    }
    useAuthStore.getState().clear();
    throw new ApiError(401, 'Session expired');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => '');

  if (!res.ok) {
    const errBody = payload as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      errBody?.message ?? `Request failed (${res.status})`,
      errBody ?? undefined,
    );
  }

  return payload as T;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(refreshToken: string): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      useAuthStore.getState().updateTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false, orgScoped: false }),
  register: (name: string, email: string, password: string) =>
    request<RegisterResponse>('/auth/register', { method: 'POST', body: { name, email, password }, auth: false, orgScoped: false }),
  refresh: (refreshToken: string) =>
    request<RefreshResponse>('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false, orgScoped: false }),
  logout: () => request('/auth/logout', { method: 'POST', orgScoped: false }),
};