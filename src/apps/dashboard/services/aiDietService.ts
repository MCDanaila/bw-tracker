import { supabase } from '@/core/lib/supabase';
import type { AiSuggestion } from '@/core/types/database';

export interface DietSuggestion {
  summary: string;
  weekly_plan: Array<{
    day: string;
    meals: Array<{
      meal_name: string;
      foods: Array<{
        name: string;
        quantity_g: number;
      }>;
      estimated_macros: {
        kcal: number;
        protein: number;
        carbs: number;
        fats: number;
      };
    }>;
    day_total: {
      kcal: number;
      protein: number;
      carbs: number;
      fats: number;
    };
  }>;
  coaching_notes: string;
}

export interface DietSuggestionRequest {
  athlete_id: string;
  query_text: string;
  coach_id?: string;
}

export interface DietSuggestionResponse {
  suggestion_id?: string;
  suggestion_text?: string;
  suggestion_json?: DietSuggestion;
  error?: string;
  retry_after?: number;
}

/**
 * Generate a diet suggestion using the Gemini-powered Edge Function
 */
export async function generateDietSuggestion(
  req: DietSuggestionRequest
): Promise<AiSuggestion> {
  const { data, error } = await supabase.functions.invoke(
    'generate-diet-suggestion',
    {
      body: req,
    }
  );

  if (error) {
    throw error;
  }

  // The response contains the suggestion_id; you can optionally fetch the full row
  // For now, return what the Edge Function provided
  if (data?.error) {
    const err = new Error(data.error);
    (err as any).retry_after = data.retry_after;
    throw err;
  }

  // Note: In a real implementation, you might want to fetch the full suggestion
  // row from the database to return a complete AiSuggestion object
  return data as AiSuggestion;
}

/**
 * Update the status of an AI suggestion (pending -> approved/rejected/applied)
 */
export async function updateSuggestionStatus(
  suggestionId: string,
  status: 'approved' | 'rejected' | 'applied',
  coachEdits?: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_suggestions')
    .update({
      status,
      coach_edits: coachEdits || null,
      applied_at: status === 'applied' ? new Date().toISOString() : null,
    })
    .eq('id', suggestionId);

  if (error) {
    throw error;
  }
}

/**
 * Submit feedback on an AI suggestion
 */
export async function submitSuggestionFeedback(
  suggestionId: string,
  userId: string,
  rating?: number,
  feedbackText?: string,
  wasFollowed?: boolean
): Promise<void> {
  const { error } = await supabase
    .from('ai_suggestion_feedback')
    .upsert(
      {
        suggestion_id: suggestionId,
        user_id: userId,
        rating: rating || null,
        feedback_text: feedbackText || null,
        was_followed: wasFollowed || null,
      },
      { onConflict: 'suggestion_id,user_id' }
    );

  if (error) {
    throw error;
  }
}
