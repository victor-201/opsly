import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../lib/auth';
import { IconChevronDown, IconBuilding, IconPlus, IconCheck } from '../ui/icons';
import { ROLE_LABELS } from '../../lib/permissions';
import { api } from '../../lib/api';
import type { OrgRef } from '../../lib/types';
import { useToast } from '../../lib/toast';
import { useQueryClient } from '@tanstack/react-query';

export function OrgSwitcher() {
  const organizations = useAuthStore((s) => s.organizations);
  const setOrganizations = useAuthStore((s) => s.setOrganizations);
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const setActiveOrgId = useAuthStore((s) => s.setActiveOrgId);
  const activeOrg = organizations.find((o) => o.id === activeOrgId) ?? organizations[0] ?? null;

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const org = await api.post<OrgRef>('/organizations', { name: newName.trim() });
      setOrganizations([...(organizations ?? []), org]);
      setActiveOrgId(org.id);
      setOpen(false);
      setNewName('');
      toast.success('Organization created', `Switched to ${org.name}`);
      queryClient.clear();
    } catch (err) {
      toast.error('Failed to create organization', err instanceof Error ? err.message : undefined);
    } finally {
      setCreating(false);
    }
  };

  if (!activeOrg) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface-0 px-3 py-1.5 text-sm hover:bg-surface-50"
      >
        <IconBuilding className="text-muted" />
        <span className="max-w-[140px] truncate font-medium">{activeOrg.name}</span>
        {activeOrg.role && (
          <span className="hidden rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-surface-500 sm:inline">
            {ROLE_LABELS[activeOrg.role]}
          </span>
        )}
        <IconChevronDown width={14} height={14} className="text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-72 rounded-lg border border-border bg-surface-0 p-2 shadow-panel">
          {organizations.map((org: OrgRef) => (
            <button
              key={org.id}
              onClick={() => {
                setActiveOrgId(org.id);
                setOpen(false);
                queryClient.clear();
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-50"
            >
              <span className="truncate font-medium">{org.name}</span>
              <span className="flex items-center gap-2">
                <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-surface-500">
                  {ROLE_LABELS[org.role]}
                </span>
                {org.id === activeOrg.id && <IconCheck width={16} height={16} className="text-brand-600" />}
              </span>
            </button>
          ))}

          <div className="mt-2 border-t border-border pt-2">
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="New organization name"
                className="h-8 flex-1 rounded-md border border-input px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-brand-600 px-2.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <IconPlus width={12} height={12} /> Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}