import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Field } from '../../components/ui/fields';
import { Badge } from '../../components/ui/Badge';
import { IconBox, IconPlus } from '../../components/ui/icons';
import { useApplications, useCreateApplication } from '../../hooks/useHooks';
import { useCan } from '../../hooks/useSession';
import { useToast } from '../../lib/toast';
import { PERMISSIONS } from '../../lib/permissions';
import { formatDateTime } from '../../lib/format';
import type { Application } from '../../lib/types';

export function ApplicationsPage() {
  const { data, isLoading, isError, error } = useApplications();
  const createMutation = useCreateApplication();
  const canManage = useCan(PERMISSIONS.resourceManage);
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');

  const openModal = () => {
    setName('');
    setDescription('');
    setRepositoryUrl('');
    setModalOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        repositoryUrl: repositoryUrl.trim() || undefined,
      });
      toast.success('Application created', name.trim());
      setModalOpen(false);
    } catch (err) {
      toast.error('Failed to create application', err instanceof Error ? err.message : undefined);
    }
  };

  const columns: Column<Application>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (a) => (
        <div>
          <p className="font-medium text-foreground">{a.name}</p>
          {a.metadata?.type && <p className="text-xs text-muted">{a.metadata.type}</p>}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (a) => <p className="max-w-md truncate text-muted">{a.description ?? '—'}</p>,
    },
    {
      key: 'resources',
      header: 'Resources',
      render: (a) => <Badge tone="neutral">{a._count?.applicationResources ?? 0} linked</Badge>,
    },
    {
      key: 'created',
      header: 'Created',
      render: (a) => <span className="text-muted">{formatDateTime(a.createdAt)}</span>,
    },
  ];

  if (isLoading) return <PageLoader label="Loading applications…" />;
  if (isError) return <ErrorState title="Failed to load applications" description={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Logical applications composed of discovered resources."
        actions={
          canManage && (
            <Button onClick={openModal}>
              <IconPlus width={16} height={16} /> New Application
            </Button>
          )
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(a) => a.id}
          onRowClick={(a) => navigate(`/applications/${a.id}`)}
          empty={
            <EmptyState
              title="No applications found"
              description="Create an application and link resources to build your service graph."
              icon={IconBox}
              action={
                canManage && (
                  <Button size="sm" onClick={openModal}>
                    <IconPlus width={14} height={14} /> New Application
                  </Button>
                )
              }
            />
          }
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New application"
        description="Applications group related resources."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={createMutation.isPending} disabled={!name.trim()}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Service" autoFocus />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this application do?" />
          </Field>
          <Field label="Repository URL">
            <Input value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="https://github.com/org/repo" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}