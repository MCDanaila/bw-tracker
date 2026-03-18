import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Alert {
  id: string;
  athleteId: string;
  athleteName: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface AlertFeedProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  isLoading?: boolean;
}

const severityConfig = {
  critical: {
    border: 'border-l-red-500',
    icon: AlertCircle,
    iconClass: 'text-red-500',
  },
  warning: {
    border: 'border-l-amber-500',
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
  },
  info: {
    border: 'border-l-cyan-500',
    icon: Info,
    iconClass: 'text-cyan-500',
  },
} as const;

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function SkeletonCard() {
  return (
    <div className="border-l-4 border-l-muted rounded-md p-3 space-y-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded-full bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
      <div className="h-3 w-48 rounded bg-muted" />
      <div className="h-3 w-32 rounded bg-muted" />
    </div>
  );
}

export default function AlertFeed({ alerts, onAcknowledge, isLoading }: AlertFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity];
              const SeverityIcon = config.icon;

              return (
                <div
                  key={alert.id}
                  className={`border-l-4 ${config.border} rounded-md p-3 bg-muted/30`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <SeverityIcon className={`h-4 w-4 mt-0.5 shrink-0 ${config.iconClass}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/dashboard/athletes/${alert.athleteId}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {alert.athleteName}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {getRelativeTime(alert.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                    {alert.status === 'active' && onAcknowledge && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => onAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
