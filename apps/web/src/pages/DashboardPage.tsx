import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { Badge, StatusPill } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { IconBox, IconServer, IconBell, IconLayers, IconChevronRight } from '../components/ui/icons';
import { useApplications, useResources, useProviders, useAlerts, useIncidents } from '../hooks/useHooks';
import { formatDateTime, titleCase } from '../lib/format';

export function DashboardPage() {
  const apps = useApplications();
  const resources = useResources();
  const providers = useProviders();
  const alerts = useAlerts();
  const incidents = useIncidents();

  const loading = apps.isLoading || resources.isLoading || providers.isLoading || alerts.isLoading || incidents.isLoading;
  const error = apps.error ?? resources.error ?? providers.error ?? alerts.error ?? incidents.error;

  if (loading) return <PageLoader label="Building dashboard…" />;
  if (error) return <ErrorState title="Failed to load dashboard" description={(error as Error).message} />;

  const activeAlerts = (alerts.data ?? []).filter(
    (a) => a.status === 'triggered' || a.status === 'acknowledged' || a.status === 'active',
  ).length;
  const downResources = (resources.data ?? []).filter(
    (r) => r.status === 'down' || r.status === 'error' || r.status === 'inactive',
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your organization's infrastructure health."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/applications">
          <StatCard label="Applications" value={apps.data?.length ?? 0} icon={<IconBox />} tone="brand" />
        </Link>
        <Link to="/resources">
          <StatCard label="Resources" value={resources.data?.length ?? 0} delta={`${downResources} unhealthy`} icon={<IconServer />} tone={downResources > 0 ? 'danger' : 'success'} />
        </Link>
        <Link to="/alerts">
          <StatCard label="Active Alerts" value={activeAlerts} icon={<IconBell />} tone={activeAlerts > 0 ? 'warning' : 'success'} />
        </Link>
        <Link to="/providers">
          <StatCard label="Providers" value={providers.data?.length ?? 0} icon={<IconLayers />} tone="neutral" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent resources</CardTitle>
            <Link to="/resources" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
              View all <IconChevronRight width={14} height={14} />
            </Link>
          </CardHeader>
          <CardContent>
            {resources.data && resources.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {(resources.data ?? []).slice(0, 6).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted">{titleCase(r.type)} · {titleCase(r.provider)}</p>
                    </div>
                    <Badge tone={r.status === 'active' ? 'success' : r.status === 'degraded' ? 'warning' : 'danger'}>
                      <StatusPill value={r.status} /> {titleCase(r.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No resources yet" description="Connect a provider to start discovering resources." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open incidents</CardTitle>
            <Link to="/incidents" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
              View all <IconChevronRight width={14} height={14} />
            </Link>
          </CardHeader>
          <CardContent>
            {incidents.data && incidents.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {(incidents.data ?? []).slice(0, 6).map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.title}</p>
                      <p className="text-xs text-muted">{formatDateTime(i.createdAt)}</p>
                    </div>
                    <Badge tone={
                      i.status === 'resolved' || i.status === 'closed' ? 'success'
                        : i.severity === 'critical' ? 'danger' : i.severity === 'high' ? 'warning' : 'info'
                    }>
                      {i.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No incidents" description="All clear — no open incidents right now." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}