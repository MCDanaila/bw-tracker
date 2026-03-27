import { apiPost } from '@/core/lib/apiClient';
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
 * Generate a diet suggestion by calling the FastAPI backend endpoint.
 * The backend automatically handles JWT validation via the Authorization header.
 */
export async function generateDietSuggestion(
  req: DietSuggestionRequest
): Promise<AiSuggestion> {
  try {
    const response = await apiPost<AiSuggestion>('/ai/generate-diet-suggestion', req);
    return response;
  } catch (error: any) {
    // Re-throw with retry_after if present
    if (error.retry_after) {
      const newError = new Error(error.message);
      (newError as any).retry_after = error.retry_after;
      throw newError;
    }
    throw error;
  }
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
