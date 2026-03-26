import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Apple,
  Target,
  Settings,
  Users,
  Database,
  FileStack,
  Sparkles,
} from 'lucide-react';
import { useRole } from '@/core/contexts/RoleContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/core/components/ui/tooltip';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  coachOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Overview', to: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Progress', to: '/dashboard/progress', icon: <TrendingUp size={20} /> },
  { label: 'Athletes', to: '/dashboard/athletes', icon: <Users size={20} />, coachOnly: true },
  { label: 'My Diet', to: '/dashboard/diet', icon: <Apple size={20} /> },
  { label: 'Food Database', to: '/dashboard/diet/foods', icon: <Database size={20} />, coachOnly: true },
  { label: 'Templates', to: '/dashboard/diet/templates', icon: <FileStack size={20} />, coachOnly: true },
  { label: 'AI Planner', to: '/dashboard/ai-planner', icon: <Sparkles size={20} /> },
  { label: 'Goals', to: '/dashboard/goals', icon: <Target size={20} /> },
  { label: 'Settings', to: '/dashboard/settings', icon: <Settings size={20} /> },
];

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const { capabilities } = useRole();

  const filteredItems = navItems.filter(
    (item) => !item.coachOnly || capabilities.canManageAthletes
  );

  return (
    <TooltipProvider delay={0}>
      <nav className="flex flex-col gap-2 px-3 py-3">
        {filteredItems.map((item) => {
          const link = (
            <NavLink
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.to}>{link}</div>;
        })}
      </nav>
    </TooltipProvider>
  );
}
