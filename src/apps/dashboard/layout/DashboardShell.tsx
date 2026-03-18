import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileDrawer } from './MobileDrawer';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Mobile drawer - below md */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      <div className="flex h-full">
        {/* Sidebar - hidden below md, icon rail at md, full at lg/xl */}
        <aside className="hidden md:flex flex-col border-r border-border bg-card shrink-0 transition-all duration-300 md:w-16 lg:w-56 xl:w-64">
          <Sidebar collapsed={false} />
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopHeader
            onToggleSidebar={() => setMobileDrawerOpen(true)}
            sidebarOpen={true}
          />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="dashboard-content mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
