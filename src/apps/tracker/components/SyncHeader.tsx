import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { localDB } from "@/core/lib/db";
import { useSync } from "@/core/hooks/useSync";
import { Button } from '@/core/components/ui/button';

export default function SyncHeader() {
    const pendingCount = useLiveQuery(
        () => localDB.syncQueue.where('status').equals('pending').count(),
        []
    ) || 0;

    const syncMutation = useSync();

    // Auto-sync when the browser regains connectivity
    useEffect(() => {
        const handleOnline = () => {
            syncMutation.mutate();
        };
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [syncMutation]);

    return (
        <header className="bg-card/95 backdrop-blur border-b border-border/50 p-4 sticky top-0 z-20 flex justify-between items-center text-card-foreground">
            <div>
                <h1 className="text-xl font-bold text-foreground">Leonida</h1>

                {pendingCount === 0 ? (
                    <p className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 size={12} /> Synced
                    </p>
                ) : (
                    <div className="text-xs text-status-warning font-medium flex items-center gap-1 mt-1">
                        <RefreshCw size={12} className="animate-spin" />
                        <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
                        <span>{pendingCount} pending</span>
                    </div>
                )}
            </div>

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
        </header>
    );
}
