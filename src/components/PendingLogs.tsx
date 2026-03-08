import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, Edit2, AlertCircle } from "lucide-react";
import { localDB, type SyncAction } from "@/lib/db";
import { Button } from '@/components/ui/button';

interface PendingLogsProps {
    onEdit: (action: SyncAction) => void;
}

export default function PendingLogs({ onEdit }: PendingLogsProps) {
    const pendingLogs = useLiveQuery(
        () => localDB.syncQueue.where('status').equals('pending').toArray(),
        []
    );

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (window.confirm("Are you sure you want to delete this log?")) {
            await localDB.syncQueue.delete(id);
        }
    };

    if (!pendingLogs || pendingLogs.length === 0) return null;

    return (
        <div className="mt-8 mb-24 space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
                <AlertCircle size={20} className="text-secondary" />
                Pending Logs ({pendingLogs.length})
            </h2>

            <div className="space-y-3">
                {pendingLogs.map((log) => {
                    // Extract some display data
                    const displayDate = log.payload?.date || log.created_at.split('T')[0];
                    const weight = log.payload?.weight_fasting ? `${log.payload.weight_fasting} kg` : 'No weight';
                    const steps = log.payload?.steps ? `${log.payload.steps} steps` : 'No steps';

                    return (
                        <div key={log.id} className="bg-card p-4 rounded-xl shadow-sm border border-border/50 flex justify-between items-center text-card-foreground">
                            <div>
                                <p className="font-medium text-foreground">{displayDate}</p>
                                <p className="text-xs text-muted-foreground mt-1">{weight} • {steps}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(log)}
                                >
                                    <Edit2 size={16} /> Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(log.id!)}
                                >
                                    <Trash2 size={16} /> Delete
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
