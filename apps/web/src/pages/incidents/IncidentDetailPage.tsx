import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/fields';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconChevronLeft, IconSend } from '../../components/ui/icons';
import { useIncident, useUpdateIncidentStatus, useAddIncidentNote } from '../../hooks/useHooks';
import { useCan } from '../../hooks/useSession';
import { useToast } from '../../lib/toast';
import { PERMISSIONS } from '../../lib/permissions';
import { formatDateTime } from '../../lib/format';
import type { IncidentStatus } from '../../lib/types';

const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus> = {
  detected: 'investigating',
  investigating: 'acknowledged',
  acknowledged: 'resolved',
  resolved: 'closed',
  closed: 'closed',
};

export function IncidentDetailPage() {
  const { id = '' } = useParams();
  const { data: incident, isLoading, isError, error } = useIncident(id);
  const updateStatus = useUpdateIncidentStatus();
  const addNote = useAddIncidentNote();
  const canManage = useCan(PERMISSIONS.incidentsManage);
  const toast = useToast();

  const [note, setNote] = useState('');

  if (isLoading) return <PageLoader label="Loading incident…" />;
  if (isError) return <ErrorState title="Incident not found" description={(error as Error).message} />;
  if (!incident) return null;

  const nextStatus = VALID_TRANSITIONS[incident.status];
  const advanceDisabled = incident.status === 'closed';

  const advance = async () => {
    if (advanceDisabled) return;
    try {
      await updateStatus.mutateAsync({ id, status: nextStatus });
      toast.success('Incident updated', `Status changed to ${nextStatus}`);
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : undefined);
    }
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    try {
      await addNote.mutateAsync({ id, content: note.trim() });
      setNote('');
    } catch (err) {
      toast.error("Couldn't add note", err instanceof Error ? err.message : undefined);
    }
  };

  const severityTone =
    incident.severity === 'critical' ? 'danger' : incident.severity === 'high' ? 'warning' : incident.severity === 'medium' ? 'info' : 'neutral';

  return (
    <div className="space-y-6">
      <PageHeader
        title={incident.title}
        description={`Reported ${formatDateTime(incident.createdAt)} · ${Array.isArray(incident.affectedResources) ? incident.affectedResources.length : 0} affected resources`}
        actions={
          <>
            <Link to="/incidents">
              <Button variant="outline" size="sm">
                <IconChevronLeft width={16} height={16} /> Back
              </Button>
            </Link>
            {canManage && !advanceDisabled && (
              <Button size="sm" onClick={advance} loading={updateStatus.isPending}>
                Mark {nextStatus}
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={incident.status} />
        <Badge tone={severityTone as 'danger' | 'warning' | 'info' | 'neutral'}>severity: {incident.severity}</Badge>
      </div>

      {incident.description && (
        <p className="max-w-3xl text-sm text-muted">{incident.description}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {canManage && (
              <div className="mb-4 flex items-center gap-2">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note to the incident log…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void submitNote();
                  }}
                />
                <Button size="icon" onClick={submitNote} loading={addNote.isPending} disabled={!note.trim()}>
                  <IconSend width={16} height={16} />
                </Button>
              </div>
            )}

            {incident.notes && incident.notes.length > 0 ? (
              <ul className="space-y-4">
                {(incident.notes ?? []).map((n) => (
                  <li key={n.id} className="rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-foreground">
                        {n.author?.name ?? n.author?.email ?? 'Unknown'}
                      </span>
                      <span className="text-xs text-muted">{formatDateTime(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground">{n.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No notes yet" description="Notes from the team will appear here." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {incident.timeline && incident.timeline.length > 0 ? (
              <ol className="space-y-3">
                {(incident.timeline ?? []).map((t, i) => {
                  const entry = t as { status: string; timestamp: string };
                  return (
                    <li key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span className="capitalize text-foreground">{entry.status}</span>
                      <span className="text-xs text-muted">{formatDateTime(entry.timestamp)}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted">No timeline recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}