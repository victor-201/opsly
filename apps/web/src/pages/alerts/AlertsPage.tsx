import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';
import { IconBell } from '../../components/ui/icons';
import { useAlerts, useAcknowledgeAlert, useResolveAlert } from '../../hooks/useHooks';
import { useCan } from '../../hooks/useSession';
import { useToast } from '../../lib/toast';
import { PERMISSIONS } from '../../lib/permissions';
import { formatDateTime } from '../../lib/format';
import type { Alert } from '../../lib/types';

export function AlertsPage() {
  const { data, isLoading, isError, error } = useAlerts();
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();
  const canManage = useCan(PERMISSIONS.alertsManage);
  const toast = useToast();

  const act = async (id: string, fn: typeof acknowledge.mutateAsync, label: string) => {
    try {
      await fn(id);
      toast.success(label);
    } catch (err) {
      toast.error(`${label} failed`, err instanceof Error ? err.message : undefined);
    }
  };

  const columns: Column<Alert>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (a) => (
        <div>
          <p className="font-medium text-foreground">{a.name}</p>
          <p className="text-xs text-muted">{a.condition}{a.threshold != null ? ` > ${a.threshold}` : ''}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge value={a.status} />,
    },
    {
      key: 'triggered',
      header: 'Last triggered',
      render: (a) => <span className="text-muted">{a.lastTriggeredAt ? formatDateTime(a.lastTriggeredAt) : '—'}</span>,
    },
    {
      key: 'acknowledged',
      header: 'Acknowledged',
      render: (a) => <span className="text-muted">{a.lastAcknowledgedAt ? formatDateTime(a.lastAcknowledgedAt) : '—'}</span>,
    },
    {
      key: 'resolved',
      header: 'Resolved',
      render: (a) => <span className="text-muted">{a.lastResolvedAt ? formatDateTime(a.lastResolvedAt) : '—'}</span>,
    },
  ];

  if (isLoading) return <PageLoader label="Loading alerts…" />;
  if (isError) return <ErrorState title="Failed to load alerts" description={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" description="Monitoring rules and their current state across your infrastructure." />

      <Card>
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(a) => a.id}
          actions={canManage ? (a) => (
            <div className="flex items-center justify-end gap-2">
              {a.status === 'triggered' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => act(a.id, acknowledge.mutateAsync, 'Alert acknowledged')}
                  loading={acknowledge.isPending}
                >
                  Acknowledge
                </Button>
              )}
              {(a.status === 'triggered' || a.status === 'acknowledged') && (
                <Button
                  size="sm"
                  onClick={() => act(a.id, resolve.mutateAsync, 'Alert resolved')}
                  loading={resolve.isPending}
                >
                  Resolve
                </Button>
              )}
            </div>
          ) : undefined}
          empty={<EmptyState title="No alerts" description="Monitoring rules you create will appear here." icon={IconBell} />}
        />
      </Card>
    </div>
  );
}