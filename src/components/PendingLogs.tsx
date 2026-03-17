import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, Edit2, AlertCircle } from "lucide-react";
import { localDB } from "@/lib/db";
import { Button } from '@/components/ui/button';
import EditLogModal from "@/components/history/EditLogModal";
import { type DailyLog } from "@/types/database";

export default function PendingLogs() {
    const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const pendingLogs = useLiveQuery(
        () => localDB.syncQueue.where('status').equals('pending').toArray(),
        []
    );

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
                                {confirmDeleteId === log.id ? (
                                    <>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={async () => {
                                                await localDB.syncQueue.delete(log.id!);
                                                setConfirmDeleteId(null);
                                            }}
                                        >
                                            Confirm Delete
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setConfirmDeleteId(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const date = log.payload?.date;
                                                if (date && pendingLogs) {
                                                    // Merge all entries for this date (oldest→newest) so form shows complete data
                                                    const merged = pendingLogs
                                                        .filter(l => l.payload?.date === date)
                                                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                                        .reduce((acc, l) => ({ ...acc, ...l.payload }), {} as DailyLog);
                                                    setEditingLog(merged);
                                                } else {
                                                    setEditingLog(log.payload as DailyLog);
                                                }
                                            }}
                                        >
                                            <Edit2 size={16} /> Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setConfirmDeleteId(log.id!)}
                                        >
                                            <Trash2 size={16} /> Delete
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <EditLogModal
                log={editingLog}
                onClose={() => setEditingLog(null)}
            />
        </div>
    );
}
