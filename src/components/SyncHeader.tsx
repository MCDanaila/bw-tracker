import { useLiveQuery } from "dexie-react-hooks";
import { CloudOff, CheckCircle2, RefreshCw } from "lucide-react";
import { localDB } from "@/lib/db";
import { useSync } from "@/hooks/useSync";
import { Button } from '@/components/ui/Button';

export default function SyncHeader() {
    // Watch Dexie for how many items are pending
    const pendingCount = useLiveQuery(
        () => localDB.syncQueue.where('status').equals('pending').count(),
        [] // dependency array
    ) || 0;

    // Bring in our Sync Mutation
    const syncMutation = useSync();

    return (
        <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold text-gray-900">BW Tracker</h1>

                {/* Dynamic Status Text */}
                {pendingCount === 0 ? (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 size={12} /> Synced
                    </p>
                ) : (
                    <p className="text-xs text-orange-500 font-medium flex items-center gap-1 mt-1">
                        <CloudOff size={12} /> {pendingCount} Pending
                    </p>
                )}
            </div>

            {/* Sync Button */}
            {pendingCount > 0 && (
                <Button
                    onClick={() => syncMutation.mutate()}
                    isLoading={syncMutation.isPending}
                    variant="primary"
                    size="sm"
                >
                    {!syncMutation.isPending && <RefreshCw size={16} />}
                    Sync Now
                </Button>
            )}
        </header>
    );
}