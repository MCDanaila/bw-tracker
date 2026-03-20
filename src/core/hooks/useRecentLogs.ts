import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/contexts/AuthContext';
import { type DailyLog } from '@/core/types/database';
import { getLocalDateStr } from '@/core/lib/utils';

/**
 * Subset of DailyLog columns needed by metric computation hooks.
 * Keeps the query narrow and bounded — avoids SELECT * with no limit.
 */
export type RecentLog = Pick<DailyLog,
  | 'date'
  | 'sleep_hours' | 'sleep_quality' | 'sleep_score'
  | 'hrv' | 'soreness_level' | 'stress_level'
  | 'daily_energy' | 'mood' | 'hunger_level'
  | 'libido' | 'digestion_rating'
  | 'diet_adherence' | 'workout_session' | 'steps'
>;

const RECENT_LOG_COLUMNS = [
  'date',
  'sleep_hours', 'sleep_quality', 'sleep_score',
  'hrv', 'soreness_level', 'stress_level',
  'daily_energy', 'mood', 'hunger_level',
  'libido', 'digestion_rating',
  'diet_adherence', 'workout_session', 'steps',
].join(', ');

/**
 * Fetches a bounded, narrow set of daily logs for metric computation.
 * Selects only the 15 columns needed by compliance, biofeedback, recovery,
 * and streak hooks — much lighter than the full useHistoryLogs query.
 *
 * @param userId - target user (defaults to current user)
 * @param days   - how many days back to fetch (default 14)
 */
export function useRecentLogs(userId?: string, days = 14) {
    const { user } = useAuth();
    const targetId = userId ?? user?.id;

    return useQuery({
        queryKey: ['recentLogs', targetId, days],
        queryFn: async () => {
            if (!targetId) return [] as RecentLog[];

            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            const cutoffStr = getLocalDateStr(cutoff);

            const { data, error } = await supabase
                .from('daily_logs')
                .select(RECENT_LOG_COLUMNS)
                .eq('user_id', targetId)
                .gte('date', cutoffStr)
                .order('date', { ascending: false })
                .limit(days + 1); // +1 guard for off-by-one at boundary

            if (error) {
                console.error('Error fetching recent logs:', error);
                throw error;
            }

            return (data ?? []) as unknown as RecentLog[];
        },
        enabled: !!targetId,
        staleTime: 1000 * 60 * 5,
    });
}
