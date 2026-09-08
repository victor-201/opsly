import { useState } from 'react';

export const PROVIDER_FILTERS = ['render', 'cloudflare', 'neon', 'upstash', 'mongodb-atlas'];
export const STATUS_FILTERS = ['active', 'degraded', 'down', 'error', 'inactive'];

export interface ResourceFilters {
  provider?: string;
  type?: string;
  status?: string;
  search?: string;
}

export function useApiFilters(delay = 300) {
  const [filters, setFilters] = useState<ResourceFilters>({});
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const update = (key: keyof ResourceFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
    if (key === 'search') {
      setTimeout(() => setDebouncedSearch(value.trim()), delay);
    }
  };

  return { filters, debouncedSearch, update };
}