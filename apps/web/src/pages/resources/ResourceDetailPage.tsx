import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { IconChevronLeft, IconExternalLink } from '../../components/ui/icons';
import { useResource, useDeleteResource } from '../../hooks/useHooks';
import { useCan } from '../../hooks/useSession';
import { useToast } from '../../lib/toast';
import { PERMISSIONS } from '../../lib/permissions';
import { formatDateTime, titleCase } from '../../lib/format';

export function ResourceDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: resource, isLoading, isError, error } = useResource(id);
  const deleteMutation = useDeleteResource();
  const canManage = useCan(PERMISSIONS.resourceManage);
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <PageLoader label="Loading resource…" />;
  if (isError) return <ErrorState title="Resource not found" description={(error as Error).message} />;
  if (!resource) return null;

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Resource removed');
      navigate('/resources');
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : undefined);
    }
  };

  const keyValue = (label: string, value?: string | number | null) => (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={resource.name}
        description={`${titleCase(resource.provider)} resource · ${titleCase(resource.type)}`}
        actions={
          <>
            <Link to="/resources">
              <Button variant="outline" size="sm">
                <IconChevronLeft width={16} height={16} /> Back
              </Button>
            </Link>
            {canManage && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Remove</Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <StatusBadge value={resource.status} />
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {keyValue('Provider', titleCase(resource.provider))}
              {keyValue('Provider connection', resource.providerConnection?.name)}
              {keyValue('Region', resource.region)}
              {keyValue('Environment', resource.environment)}
              {keyValue('Last synced', formatDateTime(resource.lastSyncAt))}
              {resource.repository && keyValue('Repository', resource.repository)}
              {resource.branch && keyValue('Branch', resource.branch)}
              {resource.domain && keyValue('Domain', resource.domain)}
            </div>
            {resource.providerUrl && (
              <a
                href={resource.providerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
              >
                Open in provider <IconExternalLink width={14} height={14} />
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {resource.applicationResources && resource.applicationResources.length > 0 ? (
              <ul className="space-y-1.5">
                {(resource.applicationResources ?? []).map((ar) => (
                  <li key={ar.application.id}>
                    <Link to={`/applications/${ar.application.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                      {ar.application.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Not linked" description="This resource isn't part of any application yet." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs
          items={[
            {
              value: 'deployments',
              label: 'Deployments',
              content: (resource.deployments ?? []).length === 0 ? (
                <EmptyState title="No deployments" description="Deployments will appear here once triggered." />
              ) : (
                <ul className="divide-y divide-border">
                  {(resource.deployments ?? []).map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-medium">
                          {d.commitSha ? d.commitSha.slice(0, 8) : 'Deployment'} <span className="text-muted">on {d.branch ?? 'default'}</span>
                        </p>
                        <p className="text-xs text-muted">{formatDateTime(d.startedAt)}</p>
                      </div>
                      <StatusBadge value={d.status} />
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              value: 'metrics',
              label: 'Metrics',
              content: (resource.metricPoints ?? []).length === 0 ? (
                <EmptyState title="No metrics recorded" description="Metric points will appear here once collected from the provider." />
              ) : (
                <ul className="divide-y divide-border">
                  {(resource.metricPoints ?? []).map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-sm">{titleCase(m.metric)}</span>
                      <span className="text-sm font-medium">
                        {m.value}{m.unit ? ` ${m.unit}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              value: 'logs',
              label: 'Logs',
              content: (resource.logs ?? []).length === 0 ? (
                <EmptyState title="No logs" description="Log entries will appear here once collected." />
              ) : (
                <ul className="divide-y divide-border">
                  {(resource.logs ?? []).map((l) => (
                    <li key={l.id} className="flex items-start gap-3 py-2">
                      <Badge tone={l.level === 'error' ? 'danger' : l.level === 'warn' ? 'warning' : 'info'}>{l.level}</Badge>
                      <p className="flex-1 text-sm text-foreground">{l.message}</p>
                      <span className="text-xs text-muted">{formatDateTime(l.recordedAt)}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Remove resource?"
        description={`"${resource.name}" will be soft-deleted and marked inactive.`}
        confirmLabel="Remove resource"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}