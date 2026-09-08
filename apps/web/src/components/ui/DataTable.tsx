import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => ReactNode;
  empty?: ReactNode;
  loading?: boolean;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, actions, empty, loading }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted',
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
            {actions && (
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface-0">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-surface-50')}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-sm text-foreground', col.className)}>
                  {col.render(row)}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
          {!loading && rows.length === 0 && empty && (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}