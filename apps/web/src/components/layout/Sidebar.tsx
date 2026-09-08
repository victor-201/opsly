import { NavLink } from 'react-router-dom';
import { navSections, type NavItem } from '../../config/navigation';
import { useRole } from '../../hooks/useSession';
import { hasPermission } from '../../lib/permissions';
import { cn } from '../../lib/cn';
import { IconX } from '../ui/icons';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function NavLinkItem({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const role = useRole();
  if (item.permission && !hasPermission(role, item.permission)) {
    return null;
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-surface-300 hover:bg-surface-800 hover:text-white',
        )
      }
    >
      <item.icon width={18} height={18} />
      {item.label}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-surface-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-surface-900 transition-transform',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-surface-800 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              O
            </div>
            <div>
              <p className="text-sm font-semibold text-white">OPSLY</p>
              <p className="text-[11px] text-surface-400">Infrastructure Ops</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-surface-400 hover:text-white lg:hidden">
            <IconX width={18} height={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLinkItem key={item.to} item={item} onClose={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-surface-800 px-5 py-4">
          <p className="text-[11px] text-surface-500">v0.1.0</p>
        </div>
      </aside>
    </>
  );
}