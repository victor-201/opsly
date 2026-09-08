import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input, Select } from '../../components/ui/fields';
import { StatusBadge } from '../../components/ui/Badge';
import { IconSearch, IconServer } from '../../components/ui/icons';
import { useResources } from '../../hooks/useHooks';
import { useApiFilters, PROVIDER_FILTERS, STATUS_FILTERS } from '../../hooks/useResourceFilters';
import { titleCase } from '../../lib/format';
import type { Resource } from '../../lib/types';

export function ResourcesPage() {
  const navigate = useNavigate();
  const { filters, debouncedSearch, update } = useApiFilters(300);
  const { data, isLoading, isError, error } = useResources({
    provider: filters.provider || undefined,
    type: filters.type || undefined,
    status: filters.status || undefined,
    search: debouncedSearch || undefined,
  });

  const columns: Column<Resource>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.name}</p>
          <p className="text-xs text-muted">{r.region ? `${r.region} · ` : ''}{titleCase(r.provider)}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <span className="text-muted">{titleCase(r.type)}</span>,
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (r) => (
        <span className="text-muted">
          {r.providerConnection?.name ?? titleCase(r.provider)}
        </span>
      ),
    },
    {
      key: 'apps',
      header: 'Applications',
      render: (r) => (
        <span className="text-muted">
          {(r.applicationResources ?? []).map((ar) => ar.application.name).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge value={r.status} />,
    },
  ];

  if (isLoading) return <PageLoader label="Loading resources…" />;
  if (isError) return <ErrorState title="Failed to load resources" description={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Resources" description="All infrastructure resources discovered from your providers." />

      <Card>
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
              <IconSearch width={16} height={16} />
            </span>
            <Input
              placeholder="Search resources…"
              className="pl-9"
              value={filters.search}
              onChange={(e) => update('search', e.target.value)}
            />
          </div>
          <Select className="w-44" value={filters.provider ?? ''} onChange={(e) => update('provider', e.target.value)}>
            <option value="">All providers</option>
            {PROVIDER_FILTERS.map((p) => (
              <option key={p} value={p}>{titleCase(p)}</option>
            ))}
          </Select>
          <Select className="w-52" value={filters.type ?? ''} onChange={(e) => update('type', e.target.value)}>
            <option value="">All types</option>
            {['web-service', 'api', 'database', 'static-site', 'cdn', 'pages-project'].map((t) => (
              <option key={t} value={t}>{titleCase(t)}</option>
            ))}
          </Select>
          <Select className="w-44" value={filters.status ?? ''} onChange={(e) => update('status', e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{titleCase(s)}</option>
            ))}
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/resources/${r.id}`)}
          empty={
            <EmptyState
              title="No resources found"
              description="Adjust your filters or connect a provider to discover resources."
              icon={IconServer}
            />
          }
        />
      </Card>
    </div>
  );
}