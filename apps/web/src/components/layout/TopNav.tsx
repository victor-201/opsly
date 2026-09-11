import { NavLink } from 'react-router-dom';
import { navSections } from '../../config/navigation';
import { useRole } from '../../hooks/useSession';
import { hasPermission } from '../../lib/permissions';
import { cn } from '../../lib/cn';

export function TopNav() {
  const role = useRole();
  const items = navSections
    .flatMap((s) => s.items)
    .filter((i) => !i.permission || hasPermission(role, i.permission));

  return (
    <nav className="sticky top-16 z-20 border-b border-border bg-surface-0/90 backdrop-blur supports-[backdrop-filter]:bg-surface-0/70">
      <div className="flex gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-muted hover:border-surface-300 hover:text-foreground',
              )
            }
          >
            <item.icon width={15} height={15} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}