import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button } from '../../components/ui/Button';
import { Input, Field } from '../../components/ui/fields';
import { Alert } from '../../components/ui/Alert';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import type { OrgRef } from '../../lib/types';

/** Landing page for users who just registered and have no organization yet. */
export function OrgSetupPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setOrganizations = useAuthStore((s) => s.setOrganizations);
  const setActiveOrgId = useAuthStore((s) => s.setActiveOrgId);
  const toast = useToast();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!name.trim()) return;
    setLoading(true);
    try {
      const org = await api.post<OrgRef>('/organizations', { name: name.trim() });
      setOrganizations([org]);
      setActiveOrgId(org.id);
      toast.success('Organization created', `Welcome to ${org.name}.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-lg border border-border bg-surface-0 p-8 shadow-card">
        <h2 className="text-xl font-semibold text-foreground">Create your organization</h2>
        <p className="mt-1 text-sm text-muted">
          An organization is a workspace that holds your providers, resources, alerts and team.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Organization name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc"
              autoFocus
              required
            />
          </Field>
          <Button type="submit" className="w-full" loading={loading} disabled={!name.trim()}>
            Create organization
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}