import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/contexts/AuthContext';
import { useRole } from '@/core/contexts/RoleContext';

export interface AthleteWithStats {
  id: string;
  username: string | null;
  email: string;
  lastLogDate: string | null;
  currentWeight: number | null;
  weightTrend: number[];
  stepsCompliance: number | null;
  dietAdherence: number | null;
  activeAlerts: number;
  status: 'active' | 'paused' | 'terminated';
}

export function useAthletes() {
  const { user } = useAuth();
  const { capabilities } = useRole();

  return useQuery({
    queryKey: ['athletes', user?.id],
    queryFn: async (): Promise<AthleteWithStats[]> => {
      if (!user?.id) return [];

      // 1. Fetch coach_athletes relationships
      const { data: relationships, error: relErr } = await supabase
        .from('coach_athletes')
        .select('athlete_id, status')
        .eq('coach_id', user.id);

      if (relErr) throw relErr;
      if (!relationships || relationships.length === 0) return [];

      const athleteIds = relationships.map(r => r.athlete_id);
      const statusMap = new Map(relationships.map(r => [r.athlete_id, r.status]));

      // 2. Fetch profiles for those athletes
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, email')
        .in('id', athleteIds);

      if (profErr) throw profErr;

      // 3. Call get_latest_logs_for_athletes RPC
      const { data: latestLogs, error: logsErr } = await supabase
        .rpc('get_latest_logs_for_athletes', { athlete_ids: athleteIds });

      if (logsErr) throw logsErr;

      const latestLogMap = new Map(
        (latestLogs ?? []).map((l: { user_id: string; date: string; weight_fasting: number | null; steps: number | null; diet_adherence: string | null }) => [l.user_id, l])
      );

      // 4. Fetch last 7 daily_logs per athlete for sparkline + compliance
      const { data: recentLogs, error: recentErr } = await supabase
        .from('daily_logs')
        .select('user_id, date, weight_fasting, steps, steps_goal, diet_adherence')
        .in('user_id', athleteIds)
        .order('date', { ascending: false })
        .limit(7 * athleteIds.length);

      if (recentErr) throw recentErr;

      // Group recent logs by athlete
      const logsByAthlete = new Map<string, typeof recentLogs>();
      for (const log of recentLogs ?? []) {
        const existing = logsByAthlete.get(log.user_id) ?? [];
        if (existing.length < 7) {
          existing.push(log);
          logsByAthlete.set(log.user_id, existing);
        }
      }

      // 5. Combine into AthleteWithStats[]
      return (profiles ?? []).map(p => {
        const latest = latestLogMap.get(p.id) as { weight_fasting: number | null; date: string; diet_adherence: string | null } | undefined;
        const recent = logsByAthlete.get(p.id) ?? [];

        // Weight trend (last 7 weights, oldest first)
        const weightTrend = recent
          .map(l => l.weight_fasting)
          .filter((w): w is number => w != null)
          .reverse();

        // Steps compliance: days at goal / total days with data
        const stepsLogs = recent.filter(l => l.steps != null);
        const stepsCompliance = stepsLogs.length > 0
          ? Math.round(
            (stepsLogs.filter(l => l.steps! >= (l.steps_goal ?? 10000)).length / stepsLogs.length) * 100
          )
          : null;

        // Diet adherence: map to numeric and average
        const dietLogs = recent.filter(l => l.diet_adherence != null);
        const dietAdherence = dietLogs.length > 0
          ? Math.round(
            dietLogs.reduce((sum, l) => {
              const score = l.diet_adherence === 'perfect' ? 100
                : l.diet_adherence === 'minor_deviation' ? 70
                  : 30;
              return sum + score;
            }, 0) / dietLogs.length
          )
          : null;

        return {
          id: p.id,
          username: p.username,
          email: p.email ?? '',
          lastLogDate: latest?.date ?? null,
          currentWeight: latest?.weight_fasting ?? null,
          weightTrend,
          stepsCompliance,
          dietAdherence,
          activeAlerts: 0, // placeholder until Phase 4
          status: (statusMap.get(p.id) ?? 'active') as 'active' | 'paused' | 'terminated',
        };
      });
    },
    enabled: !!user?.id && capabilities.canManageAthletes,
    staleTime: 1000 * 60 * 5,
  });
}
