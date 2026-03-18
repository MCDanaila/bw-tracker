import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { type DailyLog } from '@/types/database';

export const useHistoryLogs = (userId?: string) => {
    const { user } = useAuth();
    const targetId = userId ?? user?.id;

    return useQuery({
        queryKey: ['historyLogs', targetId],
        queryFn: async () => {
            if (!targetId) return [];

            // Fetch all logs, ordering from newest to oldest
            const { data, error } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', targetId)
                .order('date', { ascending: false });

            if (error) {
                console.error("Error fetching history logs:", error);
                throw error;
            }

            return data as DailyLog[];
        },
        enabled: !!targetId,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
};
