import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { IconFlame } from '../../components/ui/icons';
import { useIncidents } from '../../hooks/useHooks';
import { formatDateTime } from '../../lib/format';
import type { Incident } from '../../lib/types';

const SEVERITY_TONE: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

export function IncidentsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useIncidents();

  const columns: Column<Incident>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (i) => <p className="font-medium text-foreground">{i.title}</p>,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (i) => <Badge tone={SEVERITY_TONE[i.severity] ?? 'neutral'}>{i.severity}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <StatusBadge value={i.status} />,
    },
    {
      key: 'affected',
      header: 'Affected',
      render: (i) => (
        <span className="text-muted">{Array.isArray(i.affectedResources) ? i.affectedResources.length : 0} resources</span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (i) => <span className="text-muted">{formatDateTime(i.createdAt)}</span>,
    },
  ];

  if (isLoading) return <PageLoader label="Loading incidents…" />;
  if (isError) return <ErrorState title="Failed to load incidents" description={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Incidents" description="Detected and actively managed incidents across your organization." />

      <Card>
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(i) => i.id}
          onRowClick={(i) => navigate(`/incidents/${i.id}`)}
          empty={<EmptyState title="No incidents" description="All clear — there are no incidents to review." icon={IconFlame} />}
        />
      </Card>
    </div>
  );
}