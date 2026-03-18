import { Activity, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarNav } from './SidebarNav';
import { AthleteSelector } from '../components/AthleteSelector';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex items-center gap-2 border-b border-border px-4 py-4 ${collapsed ? 'justify-center' : ''}`}>
        <Activity size={24} className="text-primary shrink-0" />
        {!collapsed && <span className="text-lg font-bold">BW Tracker</span>}
      </div>

      {/* Athlete Selector (coach only, full sidebar only) */}
      {!collapsed && <AthleteSelector />}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>

      {/* User menu */}
      <div className={`border-t border-border p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed && (
          <p className="mb-2 truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          onClick={signOut}
          className={collapsed ? '' : 'w-full justify-start gap-2'}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
