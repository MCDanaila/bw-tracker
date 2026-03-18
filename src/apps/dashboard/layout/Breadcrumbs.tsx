import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  progress: 'Progress',
  athletes: 'Athletes',
  diet: 'Diet',
  foods: 'Food Database',
  templates: 'Templates',
  goals: 'Goals',
  settings: 'Settings',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname
    .replace(/^\/dashboard\/?/, '')
    .split('/')
    .filter(Boolean);

  const crumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    ...pathSegments.map((segment, index) => {
      const path = '/dashboard/' + pathSegments.slice(0, index + 1).join('/');
      const label = labelMap[segment] ?? segment;
      return { label, path };
    }),
  ];

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, index) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {index > 0 && <ChevronRight size={14} className="shrink-0" />}
          {index === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
