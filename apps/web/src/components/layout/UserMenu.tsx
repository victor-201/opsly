import { useState } from 'react';
import { useAuthStore } from '../../lib/auth';
import { authApi } from '../../lib/api';
import { IconChevronDown, IconLogout, IconSettings } from '../ui/icons';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    queryClient.clear();
    clear();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 text-sm hover:bg-surface-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[120px] truncate text-sm font-medium leading-tight">{user.name}</span>
          <span className="block text-xs text-muted leading-tight">{user.email}</span>
        </span>
        <IconChevronDown width={14} height={14} className="text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface-0 py-1 shadow-panel">
          <button
            onClick={() => {
              setOpen(false);
              navigate('/settings');
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-surface-50"
          >
            <IconSettings width={16} height={16} className="text-muted" /> Settings
          </button>
          <div className="my-1 border-t border-border" />
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
          >
            <IconLogout width={16} height={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}