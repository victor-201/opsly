import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Input, Field } from '../../components/ui/fields';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusPill, Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ProviderLogo } from '../../components/providers/ProviderLogo';
import { IconLayers, IconPlus, IconTrash } from '../../components/ui/icons';
import { useProviders, useConnectProvider, useDeleteProvider } from '../../hooks/useHooks';
import { useCan } from '../../hooks/useSession';
import { useToast } from '../../lib/toast';
import { PERMISSIONS } from '../../lib/permissions';
import { formatDateTime, titleCase } from '../../lib/format';
import type { ProviderConnection, ProviderType } from '../../lib/types';

const CREDENTIAL_FIELDS: Record<string, { key: string; label: string; type?: string }[]> = {
  render: [
    { key: 'apiKey', label: 'API Key', type: 'password' },
    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
  ],
  cloudflare: [
    { key: 'apiToken', label: 'API Token', type: 'password' },
    { key: 'accountId', label: 'Account ID' },
  ],
  neon: [
    { key: 'apiKey', label: 'API Key', type: 'password' },
    { key: 'projectId', label: 'Project ID' },
  ],
  upstash: [
    { key: 'email', label: 'Email' },
    { key: 'apiKey', label: 'API Key', type: 'password' },
  ],
  'mongodb-atlas': [
    { key: 'publicKey', label: 'Public Key' },
    { key: 'privateKey', label: 'Private Key', type: 'password' },
  ],
};

export function ProvidersPage() {
  const { data, isLoading, isError, error } = useProviders();
  const connectMutation = useConnectProvider();
  const deleteMutation = useDeleteProvider();
  const canConnect = useCan(PERMISSIONS.providerConnect);
  const canManage = useCan(PERMISSIONS.providerManage);
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [providerType, setProviderType] = useState<ProviderType>('render');
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<ProviderConnection | null>(null);

  const openModal = () => {
    setProviderType('render');
    setName('');
    setCredentials({});
    setOpen(true);
  };

  const fields = CREDENTIAL_FIELDS[providerType] ?? [];
  const fieldsComplete = fields.every((f) => credentials[f.key]?.trim()) && name.trim();

  const submit = async () => {
    if (!fieldsComplete) return;
    try {
      await connectMutation.mutateAsync({ providerType, name: name.trim(), credentials });
      toast.success('Provider connected', `${titleCase(providerType)} connection created`);
      setOpen(false);
    } catch (err) {
      toast.error('Connection failed', err instanceof Error ? err.message : undefined);
    }
  };

  const setField = (key: string, value: string) => setCredentials((prev) => ({ ...prev, [key]: value }));

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success('Provider connection removed', toDelete.name);
      setToDelete(null);
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : undefined);
    }
  };

  const columns: Column<ProviderConnection>[] = [
    {
      key: 'name',
      header: 'Provider',
      render: (p) => (
        <div className="flex items-center gap-3">
          <ProviderLogo providerType={p.providerType} className="h-6 w-6" />
          <div>
            <p className="font-medium text-foreground">{p.name}</p>
            <p className="text-xs text-muted">{titleCase(p.providerType)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge
          tone={
            p.status === 'valid' ? 'success'
              : p.status === 'validating' ? 'info'
              : p.status === 'invalid' ? 'warning'
              : 'danger'
          }
        >
          <StatusPill value={p.status} /> {p.status === 'valid' ? 'Connected' : p.status === 'validating' ? 'Validating…' : p.status === 'invalid' ? 'Invalid credentials' : 'Error'}
        </Badge>
      ),
    },
    {
      key: 'sync',
      header: 'Last sync',
      render: (p) => <span className="text-muted">{p.lastSyncAt ? formatDateTime(p.lastSyncAt) : '—'}</span>,
    },
    {
      key: 'created',
      header: 'Created',
      render: (p) => <span className="text-muted">{formatDateTime(p.createdAt)}</span>,
    },
  ];

  if (isLoading) return <PageLoader label="Loading providers…" />;
  if (isError) return <ErrorState title="Failed to load providers" description={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Providers"
        description="Connect and manage external provider accounts that back your infrastructure."
        actions={
          canConnect && (
            <Button onClick={openModal}>
              <IconPlus width={16} height={16} /> Connect provider
            </Button>
          )
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(p) => p.id}
          empty={<EmptyState title="No providers connected" description="Connect a provider to start discovering resources automatically." icon={IconLayers} />}
          actions={canManage ? (p) => (
            <Button size="sm" variant="ghost" className="text-danger-600" onClick={() => setToDelete(p)}>
              <IconTrash width={14} height={14} /> Remove
            </Button>
          ) : undefined}
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Connect a provider"
        description="Provide the credentials OPSLY needs to sync resources from this provider."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={connectMutation.isPending} disabled={!fieldsComplete}>
              Connect
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(['render', 'cloudflare', 'neon', 'upstash', 'mongodb-atlas'] as ProviderType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setProviderType(t); setCredentials({}); }}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  providerType === t
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-border text-muted hover:border-surface-300 hover:text-foreground'
                }`}
              >
                <ProviderLogo providerType={t} className="h-4 w-4" />
                {titleCase(t)}
              </button>
            ))}
          </div>

          <Field label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`My ${titleCase(providerType)} account`} />
          </Field>

          {fields.map((f) => (
            <Field key={f.key} label={f.label} required>
              <Input
                type={f.type ?? 'text'}
                value={credentials[f.key] ?? ''}
                onChange={(e) => setField(f.key, e.target.value)}
                autoComplete="off"
              />
            </Field>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Remove provider connection?"
        description={`"${toDelete?.name}" will be disconnected. Resources synced from it will stop updating.`}
        confirmLabel="Remove connection"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}