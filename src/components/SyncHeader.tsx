import { useLiveQuery } from "dexie-react-hooks";
import { CloudOff, CloudUpload, CheckCircle2, Loader2 } from "lucide-react";
import { localDB } from "../lib/db";
import { useSync } from "../hooks/useSync";

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
                <button
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {syncMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <CloudUpload size={16} />
                    )}
                    Sync Now
                </button>
            )}
        </header>
    );
}