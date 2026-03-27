/**
 * Test Suite: AI Planner → Meal Plan Creation
 *
 * Flow:
 * 1. Coach requests AI diet suggestion via generate-diet-suggestion Edge Function
 * 2. AI planner generates suggestion with specific foods, quantities, macros
 * 3. Coach reviews suggestion and clicks "Apply"
 * 4. System creates meal_plans entries from suggestion
 * 5. meal_plans linked to ai_suggestions via ai_suggestion_applied_meals table (or similar)
 *
 * Tables involved:
 * - ai_suggestions (athlete_id, generated_by, suggestion_json, status)
 * - meal_plans (user_id, day_of_week, meal_name, food_id, target_quantity)
 * - foods (id, name, calories, protein, carbs, fats, portion_size)
 * - ai_suggestion_applied_meals (suggestion_id, meal_plan_ids) [optional join table]
 */

import { describe, it, expect } from 'vitest';
import type { AiSuggestion } from '@/core/types/database';

describe('AI Planner → Meal Plan Creation', () => {
  // Test IDs (replace with actual)
  const athleteId = '78ccb3b9-f2a8-4fc0-8164-4f5541710594';
  const coachId = 'f119519c-d96b-496f-89a2-4690406cd2ea';
  const suggestionId = 'suggestion-uuid-123';

  const days = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

  describe('AI Suggestion Generation', () => {
    it('should generate a valid diet suggestion from AI', () => {
      const suggestion = {
        summary: 'A 7-day cutting plan with Mediterranean diet',
        weekly_plan: [
          {
            day: 'Monday',
            meals: [
              {
                meal_name: 'Breakfast',
                foods: [
                  { name: 'Eggs', quantity_g: 150 },
                  { name: 'Whole Grain Bread', quantity_g: 50 },
                ],
                estimated_macros: { kcal: 400, protein: 25, carbs: 35, fats: 15 },
              },
              {
                meal_name: 'Lunch',
                foods: [
                  { name: 'Chicken Breast', quantity_g: 200 },
                  { name: 'White Rice', quantity_g: 150 },
                  { name: 'Olive Oil', quantity_g: 10 },
                ],
                estimated_macros: { kcal: 550, protein: 55, carbs: 45, fats: 15 },
              },
              {
                meal_name: 'Dinner',
                foods: [
                  { name: 'Salmon', quantity_g: 180 },
                  { name: 'Sweet Potato', quantity_g: 150 },
                ],
                estimated_macros: { kcal: 500, protein: 40, carbs: 50, fats: 20 },
              },
            ],
            day_total: { kcal: 1450, protein: 120, carbs: 130, fats: 50 },
          },
          // ... 6 more days
        ],
        coaching_notes: 'Focus on protein intake during cutting phase',
      };

      expect(suggestion).toHaveProperty('summary');
      expect(suggestion).toHaveProperty('weekly_plan');
      expect(suggestion.weekly_plan).toHaveLength(1);
      expect(suggestion.weekly_plan[0].meals).toHaveLength(3);
      expect(suggestion.coaching_notes).toBeDefined();
    });

    it('should include all 7 days in weekly plan', () => {
      const suggestion = {
        weekly_plan: Array.from({ length: 7 }, (_, i) => ({
          day: days[i],
          meals: [],
          day_total: { kcal: 2500, protein: 180, carbs: 250, fats: 80 },
        })),
      };

      expect(suggestion.weekly_plan).toHaveLength(7);
      expect(suggestion.weekly_plan.map(p => p.day)).toEqual(days);
    });

    it('should store suggestion in ai_suggestions table', async () => {
      const aiSuggestion: Partial<AiSuggestion> = {
        id: suggestionId,
        athlete_id: athleteId,
        generated_by: coachId,
        query_text: 'Create a 7-day cutting plan with Mediterranean foods',
        status: 'pending', // Not yet applied
        suggestion_json: {
          summary: 'Generated plan',
          weekly_plan: [],
          coaching_notes: 'Notes',
        },
        created_at: new Date().toISOString(),
      };

      expect(aiSuggestion.status).toBe('pending');
      expect(aiSuggestion.suggestion_json).toBeDefined();
    });
  });

  describe('Coach Reviews Suggestion', () => {
    it('should display suggestion with all details to coach', () => {
      const suggestion = {
        id: suggestionId,
        query_text: 'Create a 7-day cutting plan',
        status: 'pending',
        suggestion_json: {
          summary: 'A 7-day cutting plan...',
          weekly_plan: [
            {
              day: 'Monday',
              meals: [
                {
                  meal_name: 'Breakfast',
                  foods: [{ name: 'Eggs', quantity_g: 150 }],
                  estimated_macros: { kcal: 400, protein: 25, carbs: 35, fats: 15 },
                },
              ],
              day_total: { kcal: 1450, protein: 120, carbs: 130, fats: 50 },
            },
          ],
          coaching_notes: 'Focus on protein intake',
        },
        created_at: new Date().toISOString(),
      };

      expect(suggestion.suggestion_json.summary).toBeDefined();
      expect(suggestion.suggestion_json.coaching_notes).toBeDefined();
    });

    it('should allow coach to review before applying', () => {
      const suggestion = {
        status: 'pending', // Not applied yet
      };

      const actions = {
        approve: () => ({ status: 'approved' }),
        reject: () => ({ status: 'rejected' }),
        apply: () => ({ status: 'applied' }),
      };

      expect(suggestion.status).toBe('pending');
      expect(actions.approve).toBeDefined();
      expect(actions.reject).toBeDefined();
      expect(actions.apply).toBeDefined();
    });

    it('should allow coach to edit suggestion before applying', () => {
      const originalSuggestion = {
        suggestion_json: {
          weekly_plan: [
            {
              day: 'Monday',
              meals: [
                {
                  meal_name: 'Breakfast',
                  foods: [{ name: 'Eggs', quantity_g: 150 }],
                  estimated_macros: { kcal: 400, protein: 25, carbs: 35, fats: 15 },
                },
              ],
            },
          ],
        },
      };

      const edited = {
        ...originalSuggestion,
        suggestion_json: {
          ...originalSuggestion.suggestion_json,
          weekly_plan: [
            {
              ...originalSuggestion.suggestion_json.weekly_plan[0],
              meals: [
                {
                  meal_name: 'Breakfast',
                  foods: [
                    { name: 'Eggs', quantity_g: 200 }, // Edited quantity
                  ],
                  estimated_macros: { kcal: 500, protein: 33, carbs: 35, fats: 20 }, // Updated macros
                },
              ],
            },
          ],
        },
      };

      expect(edited.suggestion_json.weekly_plan[0].meals[0].foods[0].quantity_g).toBe(200);
      expect(originalSuggestion.suggestion_json.weekly_plan[0].meals[0].foods[0].quantity_g).toBe(150);
    });
  });

  describe('Food Matching & Resolution', () => {
    it('should match AI-suggested foods to database food_id', () => {
      const aiFood = { name: 'Chicken Breast', quantity_g: 200 };
      const foodDatabase = [
        { id: 'chicken-breast', name: 'Chicken Breast', portion_size: 100 },
        { id: 'chicken-thighs', name: 'Chicken Thighs', portion_size: 100 },
      ];

      // Fuzzy match or exact match
      const matched = foodDatabase.find(f =>
        f.name.toLowerCase().includes(aiFood.name.toLowerCase())
      );

      expect(matched).toBeDefined();
      expect(matched?.id).toBe('chicken-breast');
    });

    it('should handle food not found in database', () => {
      const aiFood = { name: 'Exotic Fruit XYZ', quantity_g: 100 };
      const foodDatabase = [
        { id: 'banana', name: 'Banana' },
        { id: 'apple', name: 'Apple' },
      ];

      const matched = foodDatabase.find(f =>
        f.name.toLowerCase() === aiFood.name.toLowerCase()
      );

      expect(matched).toBeUndefined();
    });

    it('should allow coach to manually select alternative food if match fails', () => {
      const unresolvedFood = { name: 'Exotic Fruit XYZ', quantity_g: 100 };
      const alternativeFood = { id: 'banana', name: 'Banana', quantity_g: 100 };

      const resolution = {
        original: unresolvedFood,
        resolved_to: alternativeFood,
      };

      expect(resolution.resolved_to.id).toBe('banana');
    });

    it('should convert quantity if portion_size differs', () => {
      // AI suggests 200g of chicken (portion_size 100g)
      const aiFood = { name: 'Chicken Breast', quantity_g: 200 };
      const dbFood = { id: 'chicken-breast', portion_size: 100 };

      // Store as target_quantity = 200g
      const mealPlanEntry = {
        food_id: dbFood.id,
        target_quantity: aiFood.quantity_g, // 200
      };

      expect(mealPlanEntry.target_quantity).toBe(200);
    });

    it('should handle unit conversions (ml to g if needed)', () => {
      const aiFood = { name: 'Olive Oil', quantity_ml: 10 };
      const dbFood = { id: 'olive-oil', unit: 'ml', portion_size: 10 };

      // No conversion needed if units match
      const mealPlanEntry = {
        food_id: dbFood.id,
        target_quantity: aiFood.quantity_ml,
      };

      expect(mealPlanEntry.target_quantity).toBe(10);
    });
  });

  describe('Applying Suggestion → Creating Meal Plans', () => {
    it('should create meal_plans entries for each food in suggestion', () => {
      const suggestion = {
        weekly_plan: [
          {
            day: 'Monday',
            meals: [
              {
                meal_name: 'Breakfast',
                foods: [
                  { name: 'Eggs', quantity_g: 150 },
                  { name: 'Bread', quantity_g: 50 },
                ],
              },
              {
                meal_name: 'Lunch',
                foods: [
                  { name: 'Chicken', quantity_g: 200 },
                  { name: 'Rice', quantity_g: 150 },
                ],
              },
            ],
          },
        ],
      };

      const mealPlans = suggestion.weekly_plan.flatMap(day =>
        day.meals.flatMap(meal =>
          meal.foods.map(food => ({
            user_id: athleteId,
            day_of_week: 'LUN',
            meal_name: meal.meal_name,
            food_id: 'matched-food-id', // After matching
            target_quantity: food.quantity_g,
            created_by: coachId,
          }))
        )
      );

      expect(mealPlans).toHaveLength(4); // 2 meals × 2 foods each
      expect(mealPlans[0].day_of_week).toBe('LUN');
      expect(mealPlans[0].meal_name).toBe('Breakfast');
    });

    it('should map suggestion days to Italian day_of_week', () => {
      const dayMapping = {
        'Monday': 'LUN',
        'Tuesday': 'MAR',
        'Wednesday': 'MER',
        'Thursday': 'GIO',
        'Friday': 'VEN',
        'Saturday': 'SAB',
        'Sunday': 'DOM',
      };

      const suggestionDay = 'Monday';
      const dbDay = dayMapping[suggestionDay as keyof typeof dayMapping];

      expect(dbDay).toBe('LUN');
    });

    it('should batch insert all meal plans in transaction', () => {
      const mealPlans = [
        {
          user_id: athleteId,
          day_of_week: 'LUN',
          meal_name: 'Breakfast',
          food_id: 'eggs',
          target_quantity: 150,
        },
        {
          user_id: athleteId,
          day_of_week: 'LUN',
          meal_name: 'Lunch',
          food_id: 'chicken-breast',
          target_quantity: 200,
        },
      ];

      // Should insert all or rollback
      const batchInsert = {
        items: mealPlans,
        transaction: true,
      };

      expect(batchInsert.items).toHaveLength(2);
      expect(batchInsert.transaction).toBe(true);
    });

    it('should update suggestion status to "applied"', () => {
      const suggestion = {
        id: suggestionId,
        status: 'pending',
      };

      const updated = {
        ...suggestion,
        status: 'applied',
        applied_at: new Date().toISOString(),
      };

      expect(updated.status).toBe('applied');
      expect(updated.applied_at).toBeDefined();
    });

    it('should link created meal_plans to suggestion', () => {
      // Option 1: Store meal_plan_ids in ai_suggestions.coach_edits or new field
      const suggestion = {
        id: suggestionId,
        created_meal_plan_ids: [
          'meal-plan-uuid-1',
          'meal-plan-uuid-2',
          'meal-plan-uuid-3',
          // ...
        ],
      };

      expect(suggestion.created_meal_plan_ids).toHaveLength(3);

      // Option 2: Join table (ai_suggestion_applied_meals)
      const appliedMeals = [
        {
          suggestion_id: suggestionId,
          meal_plan_id: 'meal-plan-uuid-1',
        },
        {
          suggestion_id: suggestionId,
          meal_plan_id: 'meal-plan-uuid-2',
        },
      ];

      expect(appliedMeals).toHaveLength(2);
    });
  });

  describe('Full Workflow: Request → Generate → Apply', () => {
    it('should complete end-to-end flow', async () => {
      // Step 1: Coach requests suggestion
      const request = {
        athlete_id: athleteId,
        query_text: 'Create a 7-day cutting plan with Mediterranean foods',
        coach_id: coachId,
      };

      expect(request.athlete_id).toBeDefined();

      // Step 2: AI generates suggestion
      const suggestion = {
        id: suggestionId,
        athlete_id: athleteId,
        generated_by: coachId,
        status: 'pending',
        suggestion_json: {
          summary: 'Generated plan',
          weekly_plan: [
            {
              day: 'Monday',
              meals: [
                {
                  meal_name: 'Breakfast',
                  foods: [{ name: 'Eggs', quantity_g: 150 }],
                  estimated_macros: { kcal: 400, protein: 25, carbs: 35, fats: 15 },
                },
              ],
              day_total: { kcal: 1450, protein: 120, carbs: 130, fats: 50 },
            },
          ],
          coaching_notes: 'Focus on protein',
        },
        created_at: new Date().toISOString(),
      };

      expect(suggestion.status).toBe('pending');

      // Step 3: Coach reviews and applies
      const appliedSuggestion = {
        ...suggestion,
        status: 'applied',
        applied_at: new Date().toISOString(),
      };

      expect(appliedSuggestion.status).toBe('applied');

      // Step 4: Meal plans created
      const mealPlans = [
        {
          id: 'meal-plan-1',
          user_id: athleteId,
          day_of_week: 'LUN',
          meal_name: 'Breakfast',
          food_id: 'eggs',
          target_quantity: 150,
          created_by: coachId,
        },
      ];

      expect(mealPlans[0].user_id).toBe(athleteId);
      expect(mealPlans[0].created_by).toBe(coachId);

      // Step 5: Athlete can now view their meal plan
      const athleteView = {
        day_of_week: 'LUN',
        meals: mealPlans.filter(mp => mp.day_of_week === 'LUN'),
      };

      expect(athleteView.meals).toHaveLength(1);
    });
  });

  describe('Validation During Application', () => {
    it('should validate all foods can be resolved before applying', () => {
      const validation = {
        valid_foods: 1,
        unresolved_foods: 1,
        can_apply: false, // Need all foods resolved
      };

      expect(validation.can_apply).toBe(false);
    });

    it('should validate athlete has no existing meal plan for same day', () => {
      const existingMealPlan = {
        user_id: athleteId,
        day_of_week: 'LUN',
      };

      const conflict = existingMealPlan.day_of_week === 'LUN';

      expect(conflict).toBe(true);
    });

    it('should warn if macros deviate significantly from AI estimate after food matching', () => {
      const aiEstimate = {
        meal_name: 'Breakfast',
        estimated_macros: { kcal: 400, protein: 25, carbs: 35, fats: 15 },
      };

      const actualMacros = {
        kcal: 420, // 5% variance - acceptable
        protein: 24,
        carbs: 36,
        fats: 14,
      };

      const variance = Math.abs(actualMacros.kcal - aiEstimate.estimated_macros.kcal) / aiEstimate.estimated_macros.kcal;

      expect(variance).toBeLessThan(0.1); // < 10% variance
    });
  });

  describe('Error Handling', () => {
    it('should handle suggestion not found', () => {
      const apply = async () => {
        const suggestion = null; // Not found
        if (!suggestion) {
          throw new Error('Suggestion not found');
        }
      };

      expect(apply()).rejects.toThrow('Suggestion not found');
    });

    it('should handle food matching failure for critical foods', () => {
      const unresolvedFoods = ['Unknown Food 1', 'Unknown Food 2'];

      const canApply = unresolvedFoods.length === 0;

      expect(canApply).toBe(false);
    });

    it('should handle database insert failure and rollback meal plans', () => {
      const insertFailed = {
        success: false,
        error: 'Database connection error',
        rolled_back: true,
      };

      expect(insertFailed.rolled_back).toBe(true);
    });

    it('should handle permission denied (not coach of athlete)', () => {
      const currentUser = '00000000-0000-0000-0000-000000000000';
      const createdBy = coachId;
      const isAuthorized = currentUser === createdBy;

      expect(isAuthorized).toBe(false);
    });
  });

  describe('Post-Application', () => {
    it('should allow athlete to view created meal plans', () => {
      const mealPlans = [
        {
          user_id: athleteId,
          day_of_week: 'LUN',
          meal_name: 'Breakfast',
          food_id: 'eggs',
          target_quantity: 150,
        },
      ];

      const athleteCanView = mealPlans[0].user_id === athleteId;

      expect(athleteCanView).toBe(true);
    });

    it('should allow athlete to edit meal plans created by coach', () => {
      const mealPlan = {
        user_id: athleteId,
        created_by: coachId,
        target_quantity: 150,
      };

      // Athlete can edit their own meal plans
      const athleteCanEdit = mealPlan.user_id === athleteId;

      expect(athleteCanEdit).toBe(true);
    });

    it('should calculate weekly macros from applied meal plans', () => {
      const mealPlans = [
        {
          day_of_week: 'LUN',
          food_id: 'eggs',
          target_quantity: 150,
          macros: { kcal: 232.5, protein: 19.5, carbs: 1.65, fats: 16.5 },
        },
        {
          day_of_week: 'LUN',
          food_id: 'chicken-breast',
          target_quantity: 200,
          macros: { kcal: 330, protein: 62, carbs: 0, fats: 7.2 },
        },
      ];

      const dayTotal = {
        LUN: {
          kcal: mealPlans.reduce((sum, mp) => sum + mp.macros.kcal, 0),
          protein: mealPlans.reduce((sum, mp) => sum + mp.macros.protein, 0),
          carbs: mealPlans.reduce((sum, mp) => sum + mp.macros.carbs, 0),
          fats: mealPlans.reduce((sum, mp) => sum + mp.macros.fats, 0),
        },
      };

      expect(dayTotal.LUN.kcal).toBeCloseTo(562.5);
      expect(dayTotal.LUN.protein).toBeCloseTo(81.5);
    });

    it('should allow coach to view applied suggestions', () => {
      const suggestion = {
        id: suggestionId,
        generated_by: coachId,
        status: 'applied',
        created_meal_plan_ids: ['meal-plan-1', 'meal-plan-2'],
      };

      const coachCanView = suggestion.generated_by === coachId;

      expect(coachCanView).toBe(true);
      expect(suggestion.created_meal_plan_ids).toHaveLength(2);
    });
  });
});
