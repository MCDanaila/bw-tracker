import { useLiveQuery } from "dexie-react-hooks";
import { CloudOff, CheckCircle2, RefreshCw } from "lucide-react";
import { localDB } from "@/lib/db";
import { useSync } from "@/hooks/useSync";
import { Button } from '@/components/ui/button';

export default function SyncHeader() {
    // Watch Dexie for how many items are pending
    const pendingCount = useLiveQuery(
        () => localDB.syncQueue.where('status').equals('pending').count(),
        [] // dependency array
    ) || 0;

    // Bring in our Sync Mutation
    const syncMutation = useSync();

    return (
        <header className="bg-card/95 backdrop-blur border-b border-border/50 p-4 sticky top-0 z-10 flex justify-between items-center text-card-foreground">
            <div>
                <h1 className="text-xl font-bold text-foreground">BW Tracker</h1>

                {/* Dynamic Status Text */}
                {pendingCount === 0 ? (
                    <p className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 size={12} /> Synced
                    </p>
                ) : (
                    <p className="text-xs text-secondary font-medium flex items-center gap-1 mt-1">
                        <CloudOff size={12} /> {pendingCount} Pending
                    </p>
                )}
            </div>

            {/* Sync Button */}
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