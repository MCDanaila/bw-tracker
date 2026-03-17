import { useMutation } from '@tanstack/react-query';
import { localDB } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export function useSync() {
    return useMutation({
        mutationFn: async () => {
            // Get current session directly from Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                console.warn("Sync skipped: No active user session.");
                return 0; // Don't try to sync if logged out
            }

            // 1. Get all pending items from Dexie
            const pendingActions = await localDB.syncQueue.where('status').equals('pending').toArray();

            if (pendingActions.length === 0) return 0;

            let syncedCount = 0;

            // 2. Process each item in the queue
            for (const action of pendingActions) {
                try {
                    if (action.mutation_type === 'UPSERT_DAILY_LOG') {
                        // Push to Supabase! 
                        // The unique constraint (user_id, date) means this will safely UPSERT
                        const { error } = await supabase
                            .from('daily_logs')
                            .upsert(action.payload, { onConflict: 'user_id, date' });

                        if (error) throw error;
                    }

                    // 3. If successful, delete it from the local queue
                    if (action.id) {
                        await localDB.syncQueue.delete(action.id);
                    }
                    syncedCount++;

                } catch (error) {
                    console.error('Failed to sync action:', action, error);
                    // Mark as failed after 3 attempts to prevent infinite queue buildup
                    const retryCount = (action.retryCount || 0) + 1;
                    if (retryCount >= 3) {
                        console.error('Max retries reached, removing action:', action.id);
                        if (action.id) {
                            await localDB.syncQueue.delete(action.id);
                        }
                    } else if (action.id) {
                        await localDB.syncQueue.update(action.id, { retryCount });
                    }
                }
            }

            return syncedCount;
        }
    });
}