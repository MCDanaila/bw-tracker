import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileDrawer } from './MobileDrawer';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Track breakpoint: collapsed (icon rail) at md, expanded at lg+
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSidebarCollapsed(!e.matches); // collapsed when < 1024px (lg)
    };

    // Set initial state
    setIsSidebarCollapsed(!mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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
          <Sidebar collapsed={isSidebarCollapsed} />
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
