import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Input, Select } from '../../components/ui/fields';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconSearch, IconShieldCheck } from '../../components/ui/icons';
import { useAuditLogs } from '../../hooks/useHooks';
import { formatDateTime } from '../../lib/format';
import type { AuditLog } from '../../lib/types';

export function AuditPage() {
  const [userId, setUserId] = useState('');
  const [method, setMethod] = useState('');
  const [path, setPath] = useState('');
  const [debouncedUserId, setDebouncedUserId] = useState('');

  const { data, isLoading, isError, error } = useAuditLogs({
    userId: debouncedUserId || undefined,
    action: method ? `${method} ` : path || undefined,
  });

  const setUserSlow = (v: string) => {
    setUserId(v);
    setTimeout(() => setDebouncedUserId(v.trim()), 300);
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'time',
      header: 'Time',
      render: (l) => <span className="whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (l) => <span className="font-medium text-foreground">{l.actorEmail ?? 'system'}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (l) => (
        <span className="font-mono text-xs text-foreground">
          {l.action} {l.result !== 'success' && <span className="text-danger-600">· {l.result}</span>}
        </span>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (l) => <span className="font-mono text-xs text-muted">{l.resourceType ?? '—'}</span>,
    },
    {
      key: 'ip',
      header: 'IP',
      render: (l) => <span className="text-muted">{l.ipAddress ?? '—'}</span>,
    },
  ];

  if (isLoading) return <PageLoader label="Loading audit log…" />;
  if (isError) return <ErrorState title="Failed to load audit log" description={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Every security-relevant action recorded in your organization." />

      <Card>
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
              <IconSearch width={16} height={16} />
            </span>
            <Input
              placeholder="Filter by user email…"
              className="pl-9"
              value={userId}
              onChange={(e) => setUserSlow(e.target.value)}
            />
          </div>
          <Select className="w-48" value={method} onChange={(e) => { setMethod(e.target.value); setPath(''); }}>
            <option value="">All methods</option>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
          <Select className="w-64" value={path} onChange={(e) => { setPath(e.target.value); setMethod(''); }}>
            <option value="">All paths</option>
            {[...new Set((data ?? []).map((l) => l.action.replace(/^[A-Z]+\s/, '')))].sort().map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={(data ?? []).slice(0, 100)}
          rowKey={(l) => l.id}
          empty={<EmptyState title="No audit records" description="Actions will appear here as they happen." icon={IconShieldCheck} />}
        />
      </Card>
    </div>
  );
}