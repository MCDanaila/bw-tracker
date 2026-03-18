import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getLocalDateStr } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export type TimeRange = '7d' | '14d' | '1m' | '3m' | 'all';

export interface DailyLogChartData {
    date: string;
    shortDate: string; // e.g., 'Lun 12' or '12/03'
    weight_fasting: number | null;
    steps: number | null;
}

export const useDashboardData = (range: TimeRange, userId?: string) => {
    const { user } = useAuth();
    const targetId = userId ?? user?.id;

    return useQuery({
        queryKey: ['dashboardData', targetId, range],
        queryFn: async () => {
            if (!targetId) return [];

            let query = supabase
                .from('daily_logs')
                .select('date, weight_fasting, steps')
                .eq('user_id', targetId)
                .order('date', { ascending: true });

            // Apply time range filter if not 'all'
            if (range !== 'all') {
                const limitDate = new Date();

                switch (range) {
                    case '7d': limitDate.setDate(limitDate.getDate() - 7); break;
                    case '14d': limitDate.setDate(limitDate.getDate() - 14); break;
                    case '1m': limitDate.setMonth(limitDate.getMonth() - 1); break;
                    case '3m': limitDate.setMonth(limitDate.getMonth() - 3); break;
                }

                limitDate.setHours(0, 0, 0, 0); // Start of that day
                const dateString = getLocalDateStr(limitDate);
                query = query.gte('date', dateString);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching dashboard data:", error);
                throw error;
            }

            // Format dates for charts
            const formattedData: DailyLogChartData[] = (data || []).map(log => {
                const d = new Date(log.date);
                const dayStr = d.toLocaleDateString('it-IT', { weekday: 'short' });
                const dayNum = d.getDate();
                const monthNum = d.getMonth() + 1; // 0-indexed

                // For shorter ranges (7d, 14d), showing 'Lun 12' is nice. 
                // For longer ranges, '12/03' might be better to save space
                const shortDate = ['7d', '14d'].includes(range)
                    ? `${dayStr.charAt(0).toUpperCase()}${dayStr.slice(1)} ${dayNum}`
                    : `${dayNum.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}`;

                return {
                    date: log.date,
                    shortDate,
                    weight_fasting: log.weight_fasting,
                    steps: log.steps
                };
            });

            return formattedData;
        },
        enabled: !!targetId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
