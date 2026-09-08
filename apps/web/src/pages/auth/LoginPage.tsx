import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button } from '../../components/ui/Button';
import { Input, Field } from '../../components/ui/fields';
import { Alert } from '../../components/ui/Alert';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { useToast } from '../../lib/toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const setSession = useAuthStore((s) => s.setSession);
  const setOrganizations = useAuthStore((s) => s.setOrganizations);
  const setActiveOrgId = useAuthStore((s) => s.setActiveOrgId);
  const toast = useToast();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      setOrganizations(res.organizations);
      if (res.organizations.length > 0) {
        setActiveOrgId(res.organizations[0].id);
        navigate(location.state?.from ?? '/dashboard', { replace: true });
      } else {
        navigate('/org/setup', { replace: true });
      }
      toast.success('Welcome back', `Signed in as ${res.user.email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-lg border border-border bg-surface-0 p-8 shadow-card">
        <h2 className="text-xl font-semibold text-foreground">Sign in to OPSLY</h2>
        <p className="mt-1 text-sm text-muted">Enter your credentials to continue.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Email address" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}