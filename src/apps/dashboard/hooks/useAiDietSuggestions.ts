import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/contexts/AuthContext';
import type { AiSuggestion } from '@/core/types/database';
import {
  generateDietSuggestion,
  updateSuggestionStatus,
  submitSuggestionFeedback,
  type DietSuggestionRequest,
} from '../services/aiDietService';

/**
 * Fetch all AI suggestions for an athlete
 */
export function useAiSuggestions(athleteId?: string) {
  return useQuery({
    queryKey: ['ai-suggestions', athleteId],
    queryFn: async (): Promise<AiSuggestion[]> => {
      if (!athleteId) return [];

      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as AiSuggestion[];
    },
    enabled: !!athleteId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Generate a new diet suggestion for an athlete
 */
export function useGenerateDietSuggestion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: DietSuggestionRequest) => {
      return generateDietSuggestion({
        ...req,
        coach_id: user?.id,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions', variables.athlete_id] });
    },
  });
}

/**
 * Update the status of an AI suggestion
 */
export function useUpdateSuggestionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      suggestionId,
      status,
      coachEdits,
    }: {
      suggestionId: string;
      status: 'approved' | 'rejected' | 'applied';
      coachEdits?: string;
    }) => {
      return updateSuggestionStatus(suggestionId, status, coachEdits);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
    },
  });
}

/**
 * Submit feedback on an AI suggestion
 */
export function useSubmitSuggestionFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      suggestionId,
      rating,
      feedbackText,
      wasFollowed,
    }: {
      suggestionId: string;
      rating?: number;
      feedbackText?: string;
      wasFollowed?: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      return submitSuggestionFeedback(
        suggestionId,
        user.id,
        rating,
        feedbackText,
        wasFollowed
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
    },
  });
}
