import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Field } from '../../components/ui/fields';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusPill, Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ProviderLogo } from '../../components/providers/ProviderLogo';
import { IconLayers, IconPlus, IconTrash, IconRefresh } from '../../components/ui/icons';
import { useProviders, useConnectProvider, useDeleteProvider } from '../../hooks/useHooks';
import { useCan } from '../../hooks/useSession';
import { useToast } from '../../lib/toast';
import { api } from '../../lib/api';
import { PERMISSIONS } from '../../lib/permissions';
import { formatDateTime, titleCase } from '../../lib/format';
import type { ProviderConnection, ProviderType } from '../../lib/types';

interface CredentialField {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  hint?: string;
}

const CREDENTIAL_FIELDS: Record<string, CredentialField[]> = {
  render: [
    { key: 'apiKey', label: 'API Key', type: 'password', required: true, hint: 'Your Render API key (dashboard.render.com → Account Settings → API Keys).' },
    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', hint: 'Optional — used to verify Render webhook signatures.' },
  ],
  cloudflare: [
    { key: 'apiToken', label: 'API Token', type: 'password', required: true, hint: 'A scoped Cloudflare API token with Pages edit permissions.' },
    { key: 'accountId', label: 'Account ID', required: true, hint: 'In the dashboard: https://dash.cloudflare.com/<ACCOUNT_ID>/...' },
  ],
  neon: [
    { key: 'apiKey', label: 'API Key', type: 'password', required: true, hint: 'Your Neon API key (console.neon.tech → Account → API keys).' },
    { key: 'orgId', label: 'Organization ID', hint: 'Optional — auto-detected when connecting with a personal API key. Set it only to pick a specific organization.' },
  ],
  upstash: [
    { key: 'apiToken', label: 'API Token', type: 'password', required: true, hint: 'The token shown in your Upstash database settings (REST section).' },
    { key: 'restUrl', label: 'REST URL', required: true, hint: 'Your Upstash REST endpoint, e.g. https://xxxx.upstash.io.' },
  ],
  'mongodb-atlas': [
    { key: 'apiKey', label: 'API Key', type: 'password', required: true, hint: 'The private key of an Atlas API key (Project → Access Manager → API Keys).' },
    { key: 'projectId', label: 'Project ID', required: true, hint: 'The group ID in your Atlas API URL: /api/atlas/v1.0/groups/<PROJECT_ID>/...' },
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
  const [customVars, setCustomVars] = useState<{ id: string; key: string; value: string }[]>([]);
  const [orgOptions, setOrgOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [toDelete, setToDelete] = useState<ProviderConnection | null>(null);

  const openModal = () => {
    setProviderType('render');
    setName('');
    setCredentials({});
    setCustomVars([]);
    setOrgOptions([]);
    setOpen(true);
  };

  const loadOrganizations = async () => {
    const apiKey = credentials.apiKey?.trim();
    if (!apiKey) return;
    setLoadingOrgs(true);
    try {
      const data = await api.post<{ id: string; name: string }[]>('/provider-connections/organizations', {
        providerType: 'neon',
        credentials: { apiKey },
      });
      setOrgOptions(data ?? []);
      toast.success('Organizations loaded', `Found ${(data ?? []).length} organization(s)`);
    } catch (err) {
      setOrgOptions([]);
      toast.error('Failed to load organizations', err instanceof Error ? err.message : undefined);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const fields = CREDENTIAL_FIELDS[providerType] ?? [];
  const customValid = customVars.every(
    (r) => (r.key.trim() && r.value.trim()) || (!r.key.trim() && !r.value.trim()),
  );
  const requiredComplete =
    fields.filter((f) => f.required).every((f) => credentials[f.key]?.trim()) || fields.length === 0;
  const fieldsComplete = requiredComplete && name.trim() && customValid;

  const submit = async () => {
    if (!fieldsComplete) return;
    try {
      const merged: Record<string, string> = {};
      for (const [k, v] of Object.entries(credentials)) {
        const value = v?.trim();
        if (value) merged[k] = value;
      }
      for (const r of customVars) {
        const k = r.key.trim();
        const value = r.value.trim();
        if (k && value) merged[k] = value;
      }
      await connectMutation.mutateAsync({ providerType, name: name.trim(), credentials: merged });
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
                onClick={() => { setProviderType(t); setCredentials({}); setCustomVars([]); setOrgOptions([]); }}
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

          {fields.map((f) =>
            providerType === 'neon' && f.key === 'orgId' ? (
              <Field key={f.key} label={f.label} required={f.required} hint={f.hint}>
                <div className="flex gap-2">
                  <Select
                    value={credentials.orgId ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                  >
                    <option value="">Auto-detect (recommended)</option>
                    {orgOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} — {o.id}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadOrganizations}
                    loading={loadingOrgs}
                    disabled={!credentials.apiKey?.trim()}
                  >
                    <IconRefresh width={14} height={14} /> Load
                  </Button>
                </div>
              </Field>
            ) : (
              <Field key={f.key} label={f.label} required={f.required} hint={f.hint}>
                <Input
                  type={f.type ?? 'text'}
                  value={credentials[f.key] ?? ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                  autoComplete="off"
                />
              </Field>
            ),
          )}

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Additional variables</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCustomVars((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), key: '', value: '' },
                  ])
                }
              >
                <IconPlus width={14} height={14} /> Add variable
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Add any extra key/value this provider needs (e.g. a connection string or extra secret).
            </p>
            {customVars.length > 0 && (
              <div className="mt-3 space-y-2">
                {customVars.map((v) => (
                  <div key={v.id} className="flex items-center gap-2">
                    <Input
                      className="w-1/2"
                      placeholder="Variable name"
                      value={v.key}
                      onChange={(e) =>
                        setCustomVars((prev) =>
                          prev.map((x) => (x.id === v.id ? { ...x, key: e.target.value } : x)),
                        )
                      }
                      autoComplete="off"
                    />
                    <Input
                      className="flex-1"
                      type="password"
                      placeholder="Value"
                      value={v.value}
                      onChange={(e) =>
                        setCustomVars((prev) =>
                          prev.map((x) => (x.id === v.id ? { ...x, value: e.target.value } : x)),
                        )
                      }
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      aria-label="Remove variable"
                      onClick={() => setCustomVars((prev) => prev.filter((x) => x.id !== v.id))}
                      className="shrink-0 rounded-md p-1.5 text-muted hover:bg-surface-100 hover:text-danger-600"
                    >
                      <IconTrash width={16} height={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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