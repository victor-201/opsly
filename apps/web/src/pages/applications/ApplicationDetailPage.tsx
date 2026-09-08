import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Field } from '../../components/ui/fields';
import { StatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { IconBox, IconChevronLeft, IconChevronRight, IconPlus, IconX } from '../../components/ui/icons';
import {
  useApplication,
  useResourceLite,
  useUpdateApplication,
  useDeleteApplication,
  useLinkResource,
  useUnlinkResource,
} from '../../hooks/useHooks';
import { useCan } from '../../hooks/useSession';
import { useToast } from '../../lib/toast';
import { PERMISSIONS } from '../../lib/permissions';
import { formatDateTime } from '../../lib/format';
import { titleCase } from '../../lib/format';

export function ApplicationDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: app, isLoading, isError, error } = useApplication(id);
  const updateMutation = useUpdateApplication(id);
  const deleteMutation = useDeleteApplication();
  const linkMutation = useLinkResource(id);
  const unlinkMutation = useUnlinkResource(id);
  // Lightweight list used to offer candidate resources for linking
  const { data: candidateResources, isLoading: loadingResources, error: resourcesError } = useResourceLite();

  const canManage = useCan(PERMISSIONS.resourceManage);
  const toast = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');

  if (isLoading) return <PageLoader label="Loading application…" />;
  if (isError) return <ErrorState title="Application not found" description={(error as Error).message} />;
  if (!app) return null;

  const openEdit = () => {
    setName(app.name);
    setDescription(app.description ?? '');
    setRepositoryUrl(app.metadata?.repositoryUrl ?? '');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!name.trim()) return;
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        repositoryUrl: repositoryUrl.trim() || undefined,
      });
      toast.success('Application updated');
      setEditOpen(false);
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : undefined);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Application deleted');
      navigate('/applications');
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : undefined);
    }
  };

  const linkedIds = (app.applicationResources ?? []).map((ar) => ar.resource.id);
  const linkable = (candidateResources ?? []).filter((r) => !linkedIds.includes(r.id));

  const doLink = async (resourceId: string) => {
    try {
      await linkMutation.mutateAsync(resourceId);
      setLinkOpen(false);
      toast.success('Resource linked');
    } catch (err) {
      toast.error('Link failed', err instanceof Error ? err.message : undefined);
    }
  };

  const doUnlink = async (resourceId: string) => {
    try {
      await unlinkMutation.mutateAsync(resourceId);
      toast.success('Resource unlinked');
    } catch (err) {
      toast.error('Unlink failed', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={app.name}
        description={`${app.metadata?.type ? titleCase(app.metadata.type) + ' · ' : ''}Created ${formatDateTime(app.createdAt)}`}
        actions={
          <>
            <Link to="/applications">
              <Button variant="outline" size="sm">
                <IconChevronLeft width={16} height={16} /> Back
              </Button>
            </Link>
            {canManage && (
              <>
                <Button size="sm" onClick={openEdit}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Linked resources</CardTitle>
            {canManage && (
              <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)}>
                <IconPlus width={14} height={14} /> Link resource
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {app.applicationResources && app.applicationResources.length > 0 ? (
              <ul className="divide-y divide-border">
                {app.applicationResources.map((ar) => (
                  <li key={ar.resource.id} className="flex items-center justify-between gap-3 py-3">
                    <Link
                      to={`/resources/${ar.resource.id}`}
                      className="group flex min-w-0 items-center gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-100 text-surface-500">
                        <IconBox width={16} height={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium group-hover:text-brand-600">{ar.resource.name}</p>
                        <p className="truncate text-xs text-muted">
                          {titleCase(ar.resource.type)} · {titleCase(ar.resource.provider)}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={ar.resource.status} />
                      {canManage && (
                        <button
                          onClick={() => doUnlink(ar.resource.id)}
                          className="rounded p-1 text-surface-400 hover:bg-danger-50 hover:text-danger-600"
                          title="Unlink"
                        >
                          <IconX width={14} height={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No resources linked"
                description="Link resources to model how this application works."
                icon={IconBox}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {app.description && (
                <p className="text-muted">{app.description}</p>
              )}
              {app.metadata?.repositoryUrl && (
                <p>
                  <span className="text-muted">Repository:</span>{' '}
                  <a href={app.metadata.repositoryUrl} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">
                    {app.metadata.repositoryUrl}
                  </a>
                </p>
              )}
              <p><span className="text-muted">Resources:</span> {(app.applicationResources ?? []).length} linked</p>
              <p><span className="text-muted">Domains:</span> {(app.domains ?? []).length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit application"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} loading={updateMutation.isPending} disabled={!name.trim()}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Repository URL">
            <Input value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} />
          </Field>
        </div>
      </Modal>

      {/* Link */}
      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Link a resource"
        description="Choose an unlinked resource to add to this application."
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setLinkOpen(false)}>Close</Button>
        }
      >
        {loadingResources ? (
          <PageLoader label="Loading resources…" />
        ) : resourcesError ? (
          <ErrorState title="Couldn't load resources" />
        ) : linkable.length === 0 ? (
          <EmptyState title="No more resources to link" description="All known resources are already part of this application." />
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {linkable.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted">{titleCase(r.type)} · {titleCase(r.provider)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => doLink(r.id)} loading={linkMutation.isPending}>
                  Link <IconChevronRight width={14} height={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete application?"
        description={`"${app.name}" and its resource links will be permanently removed.`}
        confirmLabel="Delete application"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}