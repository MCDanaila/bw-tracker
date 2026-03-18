import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
    isPositive?: boolean;
  };
  color?: string;
  isLoading?: boolean;
}

export function StatCard({ label, value, icon, trend, color, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendIcon = trend ? (
    trend.direction === 'up' ? <TrendingUp size={14} /> :
    trend.direction === 'down' ? <TrendingDown size={14} /> :
    <Minus size={14} />
  ) : null;

  const trendColor = trend ? (
    trend.isPositive ? 'text-status-excellent' : 'text-status-danger'
  ) : '';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {icon && (
            <div className={`${color ?? 'text-muted-foreground'}`}>
              {icon}
            </div>
          )}
        </div>
        <p className="mt-1 text-3xl font-bold">{value}</p>
        {trend && (
          <div className={`mt-1 flex items-center gap-1 text-xs ${trendColor}`}>
            {trendIcon}
            <span>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
