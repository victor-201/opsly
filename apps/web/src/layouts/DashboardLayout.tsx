import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { TopNav } from '../components/layout/TopNav';
import { OrgSwitcher } from '../components/layout/OrgSwitcher';
import { UserMenu } from '../components/layout/UserMenu';
import { ToastViewport } from '../components/ui/ToastViewport';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface-0/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface-0/60 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-surface-500 hover:bg-surface-100 lg:hidden"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <OrgSwitcher />
          </div>
          <UserMenu />
        </header>

        <TopNav />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <ToastViewport />
    </div>
  );
}