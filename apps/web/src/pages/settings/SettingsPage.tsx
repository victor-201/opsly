import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { IconBuilding, IconAlertTriangle } from '../../components/ui/icons';
import { useOrganization, useDeleteOrganization } from '../../hooks/useHooks';
import { useActiveOrg, useRole } from '../../hooks/useSession';
import { useAuthStore } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import { formatDateTime, titleCase } from '../../lib/format';

const ROLE_TONE: Record<string, 'brand' | 'warning' | 'info' | 'neutral'> = {
  owner: 'warning',
  admin: 'brand',
  operator: 'info',
  viewer: 'neutral',
};

export function SettingsPage() {
  const activeOrg = useActiveOrg();
  const { data: org, isLoading, isError, error } = useOrganization(activeOrg?.id ?? '');
  const deleteMutation = useDeleteOrganization();
  const role = useRole();
  const toast = useToast();
  const navigate = useNavigate();
  const removeOrganization = useAuthStore((s) => s.removeOrganization);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isOwner = role === 'owner';
  const canDelete = isOwner && (org?._count?.memberships ?? 1) === 1;

  if (isLoading) return <PageLoader label="Loading organization…" />;
  if (isError) return <ErrorState title="Failed to load organization" description={(error as Error).message} />;
  if (!org) return null;

  const doDelete = async () => {
    try {
      await deleteMutation.mutateAsync(org.id);
      removeOrganization(org.id);
      toast.success('Organization deleted');
      navigate('/org/setup', { replace: true });
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Organization details, members, and danger zone." />

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Created {formatDateTime(org.createdAt)} · slug: <span className="font-mono">{org.slug}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={<IconBuilding width={16} height={16} />} label="Name" value={org.name} />
            <Metric label="Members" value={String(org._count?.memberships ?? 0)} />
            <Metric label="Resources" value={String(org._count?.resources ?? 0)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {org.memberships && org.memberships.length > 0 ? (
            <ul className="divide-y divide-border">
              {(org.memberships ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.user.name || m.user.email}</p>
                    <p className="text-xs text-muted">{m.user.email}</p>
                  </div>
                  <Badge tone={ROLE_TONE[m.role] ?? 'neutral'}>{titleCase(m.role)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No members found.</p>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="border-danger-200">
          <CardHeader>
            <CardTitle className="text-danger-600">Danger zone</CardTitle>
            <CardDescription>
              Deleting an organization is permanent and removes all its resources and history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 rounded-lg border border-danger-200 bg-danger-50 p-4">
      <IconAlertTriangle className="text-danger-600" width={20} height={20} />
      <div className="flex flex-1 items-center justify-between gap-4">
        <p className="text-sm text-danger-700">
          {canDelete
            ? 'You are the only member, so this organization can be deleted.'
            : 'Transfer or remove other members before deleting this organization.'}
        </p>
        <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={!canDelete}>
          Delete organization
        </Button>
      </div>
    </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete this organization?"
        description={`"${org.name}" and all of its data will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete organization"
        loading={deleteMutation.isPending}
        onConfirm={doDelete}
      />
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
  icon?: ReactNode;
}

function Metric({ label, value, icon }: MetricProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}