import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localDB } from '@/core/lib/db';
import { supabase } from '@/core/lib/supabase';
import { toast } from 'sonner';

export function useSync() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                console.warn("Sync skipped: No active user session.");
                return 0;
            }

            const pendingActions = await localDB.syncQueue.where('status').equals('pending').toArray();

            if (pendingActions.length === 0) return 0;

            let syncedCount = 0;

            for (const action of pendingActions) {
                try {
                    if (action.mutation_type === 'UPSERT_DAILY_LOG') {
                        const { error } = await supabase
                            .from('daily_logs')
                            .upsert(action.payload, { onConflict: 'user_id, date' });

                        if (error) throw error;
                    }

                    if (action.id) {
                        await localDB.syncQueue.delete(action.id);
                    }
                    syncedCount++;

                } catch (error) {
                    console.error('Failed to sync action:', action, error);
                    const retryCount = (action.retryCount || 0) + 1;
                    if (retryCount >= 3) {
                        console.error('Max retries reached, removing action:', action.id);
                        if (action.id) {
                            await localDB.syncQueue.delete(action.id);
                        }
                        toast.error('A log entry failed to sync and was removed.');
                    } else if (action.id) {
                        await localDB.syncQueue.update(action.id, { retryCount });
                    }
                }
            }

            return syncedCount;
        },
        onSuccess: (syncedCount) => {
            if (syncedCount && syncedCount > 0) {
                toast.success('All logs synced');
                queryClient.invalidateQueries({ queryKey: ['historyLogs'] });
                queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
            }
        },
    });
}
