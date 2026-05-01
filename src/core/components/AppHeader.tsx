import { type ReactNode, useEffect } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '@/core/lib/db';
import { useSync } from '@/core/hooks/useSync';
import { Button } from '@/core/components/ui/button';
import { AvatarMenu } from './AvatarMenu';

interface AppHeaderProps {
  title: string;
  showSync?: boolean;
  extraMenuItems?: ReactNode;
}

function SyncStatus() {
  const pendingCount = useLiveQuery(
    () => localDB.syncQueue.where('status').equals('pending').count(),
    []
  ) ?? 0;

  const syncMutation = useSync();

  useEffect(() => {
    const handleOnline = () => syncMutation.mutate();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncMutation]);

  return (
    <div className="flex items-center gap-3">
      {pendingCount === 0 ? (
        <p className="text-xs text-primary font-medium flex items-center gap-1">
          <CheckCircle2 size={12} /> Synced
        </p>
      ) : (
        <div className="text-xs text-status-warning font-medium flex items-center gap-1">
          <RefreshCw size={12} className="animate-spin" />
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
          <span>{pendingCount} pending</span>
        </div>
      )}
      {pendingCount > 0 && (
        <Button
          onClick={() => syncMutation.mutate()}
          isLoading={syncMutation.isPending}
          variant="default"
          size="sm"
        >
          {!syncMutation.isPending && <RefreshCw size={16} />}
          Sync Now
        </Button>
      )}
    </div>
  );
}

export function AppHeader({ title, showSync, extraMenuItems }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-4 py-2">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {showSync && <SyncStatus />}
      </div>
      <AvatarMenu extraMenuItems={extraMenuItems} />
    </header>
  );
}
