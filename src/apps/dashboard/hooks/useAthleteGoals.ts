import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/contexts/AuthContext';
import type { AthleteGoal } from '@/core/types/database';

export function useCurrentGoal(athleteId?: string) {
  return useQuery({
    queryKey: ['athleteGoal', 'current', athleteId],
    queryFn: async (): Promise<AthleteGoal | null> => {
      if (!athleteId) return null;

      const { data, error } = await supabase
        .from('athlete_goals')
        .select('*')
        .eq('athlete_id', athleteId)
        .is('effective_until', null)
        .maybeSingle();

      if (error) throw error;
      return data as AthleteGoal | null;
    },
    enabled: !!athleteId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGoalHistory(athleteId?: string) {
  return useQuery({
    queryKey: ['athleteGoal', 'history', athleteId],
    queryFn: async (): Promise<AthleteGoal[]> => {
      if (!athleteId) return [];

      const { data, error } = await supabase
        .from('athlete_goals')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('effective_from', { ascending: false });

      if (error) throw error;
      return (data ?? []) as AthleteGoal[];
    },
    enabled: !!athleteId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: {
      athleteId: string;
      target_weight?: number | null;
      steps_goal?: number | null;
      water_goal?: number | null;
      target_calories?: number | null;
      target_protein?: number | null;
      target_carbs?: number | null;
      target_fats?: number | null;
      phase?: 'bulk' | 'cut' | 'maintenance' | 'reverse_diet' | null;
      notes?: string | null;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // 1. Close previous current goal
      const { error: updateErr } = await supabase
        .from('athlete_goals')
        .update({ effective_until: new Date().toISOString().split('T')[0] })
        .eq('athlete_id', goal.athleteId)
        .is('effective_until', null);

      if (updateErr) throw updateErr;

      // 2. Insert new goal
      const { athleteId, ...goalData } = goal;
      const { data, error: insertErr } = await supabase
        .from('athlete_goals')
        .insert({
          athlete_id: athleteId,
          set_by: user.id,
          ...goalData,
          effective_from: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      return data as AthleteGoal;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['athleteGoal', 'current', variables.athleteId] });
      queryClient.invalidateQueries({ queryKey: ['athleteGoal', 'history', variables.athleteId] });
    },
  });
}
