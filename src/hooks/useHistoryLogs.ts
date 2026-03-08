import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { type DailyLog } from '@/types/database';

export const useHistoryLogs = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['historyLogs', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            // Fetch all logs, ordering from newest to oldest
            const { data, error } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) {
                console.error("Error fetching history logs:", error);
                throw error;
            }

            return data as DailyLog[];
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
};
