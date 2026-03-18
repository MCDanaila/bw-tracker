import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/contexts/AuthContext';
import { getLocalDateStr } from '@/core/lib/utils';

export interface CoachStats {
  totalAthletes: number;
  logsTodayCount: number;
  activeAlertsCount: number;
  isLoading: boolean;
}

export function useCoachStats(): CoachStats {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['coachStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalAthletes: 0, logsTodayCount: 0, activeAlertsCount: 0 };

      // 1. Count active athletes
      const { count: totalAthletes, error: countErr } = await supabase
        .from('coach_athletes')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .eq('status', 'active');

      if (countErr) throw countErr;

      // 2. Get athlete IDs for today's log count
      const { data: relationships, error: relErr } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', user.id)
        .eq('status', 'active');

      if (relErr) throw relErr;

      let logsTodayCount = 0;
      if (relationships && relationships.length > 0) {
        const athleteIds = relationships.map(r => r.athlete_id);
        const today = getLocalDateStr();

        const { count: logsCount, error: logsErr } = await supabase
          .from('daily_logs')
          .select('*', { count: 'exact', head: true })
          .in('user_id', athleteIds)
          .eq('date', today);

        if (logsErr) throw logsErr;
        logsTodayCount = logsCount ?? 0;
      }

      return {
        totalAthletes: totalAthletes ?? 0,
        logsTodayCount,
        activeAlertsCount: 0, // placeholder until Phase 4
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  return {
    totalAthletes: data?.totalAthletes ?? 0,
    logsTodayCount: data?.logsTodayCount ?? 0,
    activeAlertsCount: data?.activeAlertsCount ?? 0,
    isLoading,
  };
}
