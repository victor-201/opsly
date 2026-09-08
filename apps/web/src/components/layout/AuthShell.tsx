import type { ReactNode } from 'react';
import { ToastViewport } from '../ui/ToastViewport';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <>
    <div className="flex min-h-screen bg-background">
      <div className="hidden flex-1 flex-col justify-between bg-surface-900 p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
            O
          </div>
          <div>
            <p className="text-lg font-semibold text-white">OPSLY</p>
            <p className="text-xs text-surface-400">AI-Powered Infrastructure Operations</p>
          </div>
        </div>
        <div>
          <h1 className="max-w-md text-2xl font-semibold leading-snug text-white">
            Discover, monitor, and operate your cloud infrastructure from one place.
          </h1>
          <ul className="mt-6 space-y-2 text-sm text-surface-300">
            <li>• Multi-provider discovery (Render, Cloudflare, Neon, Upstash, MongoDB Atlas)</li>
            <li>• Resource & application graph with dependency mapping</li>
            <li>• Alerting, incidents, and a deterministic AI assistant</li>
            <li>• Role-based access control & full audit trail</li>
          </ul>
        </div>
        <p className="text-xs text-surface-500">
          © {new Date().getFullYear()} OPSLY. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
    <ToastViewport />
    </>
  );
}