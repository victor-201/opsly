import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button } from '../../components/ui/Button';
import { Input, Field } from '../../components/ui/fields';
import { Alert } from '../../components/ui/Alert';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { useToast } from '../../lib/toast';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const toast = useToast();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(name, email, password);
      setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
      navigate('/org/setup', { replace: true });
      toast.success('Account created', 'Now create your first organization.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-lg border border-border bg-surface-0 p-8 shadow-card">
        <h2 className="text-xl font-semibold text-foreground">Create your account</h2>
        <p className="mt-1 text-sm text-muted">Start monitoring your infrastructure in minutes.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Full name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" required />
          </Field>
          <Field label="Email address" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </Field>
          <Field label="Password" hint="Minimum 8 characters" required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </Field>
          <Field label="Confirm password" required>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}