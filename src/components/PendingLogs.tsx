import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, Edit2, AlertCircle } from "lucide-react";
import { localDB, type SyncAction } from "../lib/db";

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
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle size={20} className="text-orange-500" />
                Pending Logs ({pendingLogs.length})
            </h2>

            <div className="space-y-3">
                {pendingLogs.map((log) => {
                    // Extract some display data
                    const displayDate = log.payload?.date || log.created_at.split('T')[0];
                    const weight = log.payload?.weight_fasting ? `${log.payload.weight_fasting} kg` : 'No weight';
                    const steps = log.payload?.steps ? `${log.payload.steps} steps` : 'No steps';

                    return (
                        <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800">{displayDate}</p>
                                <p className="text-xs text-gray-500 mt-1">{weight} • {steps}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(log)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(log.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
