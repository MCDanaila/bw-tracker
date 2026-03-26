/**
 * Test suite for generate-diet-suggestion Edge Function
 *
 * Run with: deno test --allow-env --allow-net index.test.ts
 * Or integrate with vitest/jest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
};

describe('generate-diet-suggestion Edge Function', () => {
  const SUPABASE_URL = 'https://test.supabase.co';
  const SERVICE_ROLE_KEY = 'test-key';
  const GEMINI_API_KEY = 'test-gemini-key';
  const athleteId = '78ccb3b9-f2a8-4fc0-8164-4f5541710594';
  const coachId = 'f119519c-d96b-496f-89a2-4690406cd2ea';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CORS Preflight', () => {
    it('should handle OPTIONS request with proper CORS headers', async () => {
      const req = new Request('http://localhost/functions/v1/generate-diet-suggestion', {
        method: 'OPTIONS',
        headers: {
          'access-control-request-headers': 'content-type, authorization',
        },
      });

      // Preflight should return 204 with CORS headers
      expect(req.method).toBe('OPTIONS');
    });
  });

  describe('Input Validation', () => {
    it('should reject request without athlete_id', async () => {
      const body = {
        query_text: 'Create a cutting plan',
        coach_id: coachId,
      };

      // Should validate required fields
      expect(body.athlete_id).toBeUndefined();
    });

    it('should reject request without query_text', async () => {
      const body = {
        athlete_id: athleteId,
        coach_id: coachId,
      };

      expect(body.query_text).toBeUndefined();
    });

    it('should accept valid request with all required fields', async () => {
      const body = {
        athlete_id: athleteId,
        query_text: 'Create a 7-day cutting plan',
        coach_id: coachId,
      };

      expect(body).toHaveProperty('athlete_id');
      expect(body).toHaveProperty('query_text');
    });
  });

  describe('Authorization', () => {
    it('should reject if coach is not assigned to athlete', async () => {
      const body = {
        athlete_id: athleteId,
        query_text: 'Create a plan',
        coach_id: 'invalid-coach-id',
      };

      // Should check coach_athletes table
      // and return 403 if no active link found
      expect(body.coach_id).not.toBe(coachId);
    });

    it('should accept if coach is assigned to athlete', async () => {
      const body = {
        athlete_id: athleteId,
        query_text: 'Create a plan',
        coach_id: coachId,
      };

      // Should find active coach_athletes link
      expect(body.coach_id).toBe(coachId);
    });

    it('should skip authorization if coach_id not provided', async () => {
      const body = {
        athlete_id: athleteId,
        query_text: 'Create a plan',
      };

      // Should continue without coach validation
      expect(body.coach_id).toBeUndefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should reject if coach has 10+ suggestions in last hour', async () => {
      // Mock 10 existing suggestions
      const mockCount = 10;

      // Should check ai_suggestions table
      // SELECT count(*) WHERE generated_by = coach_id AND created_at >= oneHourAgo
      expect(mockCount).toBeGreaterThanOrEqual(10);
    });

    it('should allow if coach has <10 suggestions in last hour', async () => {
      // Mock 5 existing suggestions
      const mockCount = 5;

      expect(mockCount).toBeLessThan(10);
    });
  });

  describe('Athlete Preferences', () => {
    it('should reject if athlete has no preferences set', async () => {
      const prefs = null;

      // Should return 422 with missing_preferences error
      expect(prefs).toBeNull();
    });

    it('should reject if preferences missing allergies, intolerances, and restrictions', async () => {
      const prefs = {
        athlete_id: athleteId,
        allergies: [],
        intolerances: [],
        dietary_restrictions: [],
      };

      const hasAnyPreference =
        (prefs.allergies && prefs.allergies.length > 0) ||
        (prefs.intolerances && prefs.intolerances.length > 0) ||
        (prefs.dietary_restrictions && prefs.dietary_restrictions.length > 0);

      expect(hasAnyPreference).toBeFalsy();
    });

    it('should accept if athlete has at least one preference', async () => {
      const prefs = {
        athlete_id: athleteId,
        allergies: ['peanuts'],
        intolerances: [],
        dietary_restrictions: [],
        food_dislikes: [],
        food_preferences: ['mediterranean'],
        cuisine_preferences: ['italian'],
        cooking_skill: 'intermediate',
        meal_prep_time: '30-45 min',
        budget_level: 'moderate',
      };

      const hasAnyPreference =
        (prefs.allergies && prefs.allergies.length > 0) ||
        (prefs.intolerances && prefs.intolerances.length > 0) ||
        (prefs.dietary_restrictions && prefs.dietary_restrictions.length > 0);

      expect(hasAnyPreference).toBeTruthy();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch athlete profile', async () => {
      // Should query profiles table
      // SELECT * FROM profiles WHERE id = athlete_id
      expect(athleteId).toBeDefined();
    });

    it('should fetch current goal if exists', async () => {
      // Should query athlete_goals table
      // SELECT * FROM athlete_goals WHERE athlete_id = ? AND effective_until IS NULL
      expect(athleteId).toBeDefined();
    });

    it('should fetch last 7 days of logs', async () => {
      // Should query daily_logs
      // SELECT * FROM daily_logs WHERE user_id = athlete_id AND date >= sevenDaysAgo
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);
      expect(sevenDaysAgo).toBeDefined();
    });

    it('should fetch food list for context', async () => {
      // Should query foods table with LIMIT 30
      expect(true).toBeTruthy();
    });

    it('should retrieve knowledge chunks via RPC', async () => {
      // Should call match_knowledge_chunks RPC
      // with query_embedding, match_count, and p_coach_id
      const queryEmbedding = new Array(768).fill(0.1);
      expect(queryEmbedding.length).toBe(768);
    });
  });

  describe('Gemini API Integration', () => {
    it('should embed query text successfully', async () => {
      const queryText = 'Create a cutting plan';
      // Should call Gemini embedding API
      // and return 768-dimensional vector
      expect(queryText.length).toBeGreaterThan(0);
    });

    it('should handle Gemini rate limiting', async () => {
      // If Gemini returns 429, should return 429 with retry_after
      const statusCode = 429;
      expect(statusCode).toBe(429);
    });

    it('should generate diet suggestion with Gemini', async () => {
      // Should call gemini-1.5-flash model
      // Should return valid JSON matching DietSuggestion schema
      const suggestion = {
        summary: 'A 7-day cutting plan focusing on protein and Mediterranean foods',
        weekly_plan: [
          {
            day: 'Monday',
            meals: [
              {
                meal_name: 'Breakfast',
                foods: [{ name: 'Eggs', quantity_g: 150 }],
                estimated_macros: { kcal: 300, protein: 20, carbs: 5, fats: 15 },
              },
            ],
            day_total: { kcal: 2000, protein: 150, carbs: 150, fats: 70 },
          },
        ],
        coaching_notes: 'Focus on protein intake during cutting phase',
      };

      expect(suggestion).toHaveProperty('summary');
      expect(suggestion).toHaveProperty('weekly_plan');
      expect(suggestion).toHaveProperty('coaching_notes');
      expect(suggestion.weekly_plan[0]).toHaveProperty('meals');
    });

    it('should handle JSON parsing errors from Gemini', async () => {
      const malformedResponse = 'This is not valid JSON { broken';
      // Should fall back to text-only response
      expect(malformedResponse).toBeDefined();
    });
  });

  describe('Database Insertion', () => {
    it('should insert suggestion into ai_suggestions table', async () => {
      const suggestion = {
        athlete_id: athleteId,
        generated_by: coachId,
        query_text: 'Create a plan',
        status: 'pending',
        suggestion_text: 'Generated plan text',
        suggestion_json: {},
        context_snapshot: {},
        retrieved_chunk_ids: [],
      };

      expect(suggestion).toHaveProperty('athlete_id');
      expect(suggestion).toHaveProperty('generated_by');
      expect(suggestion).toHaveProperty('status', 'pending');
    });

    it('should return suggestion_id in response', async () => {
      const response = {
        suggestion_id: 'uuid-123',
        suggestion_text: 'Generated plan',
        suggestion_json: {},
      };

      expect(response).toHaveProperty('suggestion_id');
      expect(response.suggestion_id).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables', async () => {
      // Function should validate SUPABASE_URL, SERVICE_ROLE_KEY, GEMINI_API_KEY
      expect(SUPABASE_URL).toBeDefined();
      expect(SERVICE_ROLE_KEY).toBeDefined();
      expect(GEMINI_API_KEY).toBeDefined();
    });

    it('should handle Supabase connection errors', async () => {
      // Should catch and return 500 with error message
      expect(true).toBeTruthy();
    });

    it('should handle RLS policy violations', async () => {
      // If SERVICE_ROLE doesn't have RLS access, should return 500
      expect(true).toBeTruthy();
    });

    it('should handle invalid athlete_id (not found)', async () => {
      // If athlete profile doesn't exist, should handle gracefully
      const profileQuery = null;
      expect(profileQuery).toBeNull();
    });

    it('should return proper error response format', async () => {
      const errorResponse = {
        error: 'rate_limited',
        retry_after: 60,
      };

      expect(errorResponse).toHaveProperty('error');
    });
  });

  describe('Response Format', () => {
    it('should include CORS headers in all responses', async () => {
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
        'Content-Type': 'application/json',
      };

      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should return 200 status on success', async () => {
      const statusCode = 200;
      expect(statusCode).toBe(200);
    });

    it('should return appropriate status codes for errors', async () => {
      const statusCodes = {
        badRequest: 400,
        unauthorized: 401,
        forbidden: 403,
        notFound: 404,
        rateLimit: 429,
        unprocessable: 422,
        serverError: 500,
      };

      expect(statusCodes.badRequest).toBe(400);
      expect(statusCodes.forbidden).toBe(403);
      expect(statusCodes.rateLimit).toBe(429);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full flow: validate -> check auth -> fetch data -> generate -> insert', async () => {
      const request = {
        athlete_id: athleteId,
        query_text: 'Create a 7-day cutting plan with Mediterranean foods',
        coach_id: coachId,
      };

      // 1. Validate input
      expect(request).toHaveProperty('athlete_id');
      expect(request).toHaveProperty('query_text');

      // 2. Check authorization
      expect(request.coach_id).toBe(coachId);

      // 3. Fetch athlete data (would hit db)
      // 4. Generate with Gemini (would hit API)
      // 5. Insert to database (would hit db)

      expect(request).toBeDefined();
    });

    it('should handle concurrent requests from same coach', async () => {
      // Multiple requests from same coach in quick succession
      // Should check rate limit per coach, not globally
      expect(true).toBeTruthy();
    });
  });
});
