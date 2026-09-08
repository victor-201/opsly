import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ items, defaultTab }: { items: TabItem[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? items[0]?.value);
  const current = items.find((t) => t.value === active) ?? items[0];

  return (
    <div>
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1" aria-label="Tabs">
          {items.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                active === tab.value
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-muted hover:border-surface-300 hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="pt-4">{current?.content}</div>
    </div>
  );
}