import { Menu } from 'lucide-react';
import { useAuth } from '@/core/contexts/AuthContext';
import { useRole } from '@/core/contexts/RoleContext';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Breadcrumbs } from './Breadcrumbs';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function TopHeader({ onToggleSidebar }: TopHeaderProps) {
  const { user } = useAuth();
  const { capabilities } = useRole();
  const avatarLetter = (user?.email?.[0] ?? '?').toUpperCase();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      {/* Hamburger - mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
      >
        <Menu size={20} />
      </Button>

      {/* Breadcrumbs */}
      <div className="flex-1">
        <Breadcrumbs />
      </div>

      {/* User info */}
      <div className="flex items-center gap-3">
        {capabilities.canManageAthletes && (
          <Badge variant="secondary" className="text-xs">
            Coach
          </Badge>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {avatarLetter}
        </div>
      </div>
    </header>
  );
}
