import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/contexts/AuthContext';
import type { AthletePreferences } from '@/core/types/database';

export function useAthletePreferences(athleteId?: string) {
  return useQuery({
    queryKey: ['athletePreferences', athleteId],
    queryFn: async (): Promise<AthletePreferences | null> => {
      if (!athleteId) return null;

      const { data, error } = await supabase
        .from('athlete_preferences')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();

      if (error) throw error;
      return data as AthletePreferences | null;
    },
    enabled: !!athleteId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetAthletePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: {
      athleteId: string;
      allergies?: string[];
      intolerances?: string[];
      dietary_restrictions?: string[];
      food_dislikes?: string[];
      food_preferences?: string[];
      cuisine_preferences?: string[];
      meal_timing_notes?: string | null;
      supplement_use?: string[];
      digestion_issues?: string | null;
      cooking_skill?: 'none' | 'basic' | 'intermediate' | 'advanced' | null;
      meal_prep_time?: 'minimal' | 'moderate' | 'flexible' | null;
      budget_level?: 'budget' | 'moderate' | 'premium' | null;
      additional_notes?: string | null;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { athleteId, ...prefsData } = prefs;

      const { data, error } = await supabase
        .from('athlete_preferences')
        .upsert(
          {
            athlete_id: athleteId,
            set_by: user.id,
            ...prefsData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'athlete_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as AthletePreferences;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['athletePreferences', variables.athleteId] });
    },
  });
}
