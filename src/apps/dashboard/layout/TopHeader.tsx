import { Menu } from 'lucide-react';
import { useRole } from '@/core/contexts/RoleContext';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Breadcrumbs } from './Breadcrumbs';
import { AvatarMenu } from '@/core/components/AvatarMenu';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function TopHeader({ onToggleSidebar }: TopHeaderProps) {
  const { capabilities } = useRole();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      {/* Hamburger - mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar menu"
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
        <AvatarMenu />
      </div>
    </header>
  );
}
