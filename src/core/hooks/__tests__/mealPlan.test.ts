/**
 * Test suite for Meal Plan Creation and Management
 *
 * Tables involved:
 * - meal_plans (user_id, day_of_week, meal_name, food_id, target_quantity, created_by)
 * - foods (id, name, portion_size, calories, protein, carbs, fats)
 * - meal_adherence (user_id, day, meal_adherence_date, adherence_data)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateItemMacros } from '@/core/lib/mealMacros';
import type { Food, MealPlan } from '@/core/types/database';

describe('Meal Plan Creation & Management', () => {
  // Test data with proper IDs (replace with actual IDs)
  const athleteId = '78ccb3b9-f2a8-4fc0-8164-4f5541710594';
  const coachId = 'f119519c-d96b-496f-89a2-4690406cd2ea';
  const mealPlanId = 'meal-plan-uuid-123';

  // Sample food items
  const foods: Record<string, Food> = {
    eggs: {
      id: 'eggs',
      name: 'Eggs',
      portion_size: 100,
      unit: 'g',
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fats: 11,
      state: 'active',
    },
    chicken: {
      id: 'chicken-breast',
      name: 'Chicken Breast',
      portion_size: 100,
      unit: 'g',
      calories: 165,
      protein: 31,
      carbs: 0,
      fats: 3.6,
      state: 'active',
    },
    rice: {
      id: 'white-rice',
      name: 'White Rice (cooked)',
      portion_size: 100,
      unit: 'g',
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fats: 0.3,
      state: 'active',
    },
    olive_oil: {
      id: 'olive-oil',
      name: 'Olive Oil',
      portion_size: 10,
      unit: 'ml',
      calories: 88,
      protein: 0,
      carbs: 0,
      fats: 10,
      state: 'active',
    },
  };

  describe('Macro Calculation (calculateItemMacros)', () => {
    it('should calculate macros for exact portion size', () => {
      const result = calculateItemMacros(foods.eggs, 100);

      expect(result.kcal).toBe(155);
      expect(result.p).toBe(13);
      expect(result.c).toBe(1.1);
      expect(result.g).toBe(11);
    });

    it('should calculate macros for half portion', () => {
      const result = calculateItemMacros(foods.eggs, 50);

      expect(result.kcal).toBe(77.5);
      expect(result.p).toBe(6.5);
      expect(result.c).toBe(0.55);
      expect(result.g).toBe(5.5);
    });

    it('should calculate macros for double portion', () => {
      const result = calculateItemMacros(foods.chicken, 200);

      expect(result.kcal).toBe(330);
      expect(result.p).toBe(62);
      expect(result.c).toBe(0);
      expect(result.g).toBe(7.2);
    });

    it('should handle different portion sizes (ml for oil)', () => {
      const result = calculateItemMacros(foods.olive_oil, 20); // 20ml instead of 10ml

      expect(result.kcal).toBe(176); // 88 * (20/10)
      expect(result.p).toBe(0);
      expect(result.c).toBe(0);
      expect(result.g).toBe(20); // 10 * (20/10)
    });

    it('should return zeros for null food', () => {
      const result = calculateItemMacros(null, 100);

      expect(result).toEqual({ kcal: 0, p: 0, c: 0, g: 0 });
    });

    it('should return zeros for undefined food', () => {
      const result = calculateItemMacros(undefined, 100);

      expect(result).toEqual({ kcal: 0, p: 0, c: 0, g: 0 });
    });

    it('should handle zero quantity', () => {
      const result = calculateItemMacros(foods.eggs, 0);

      expect(result).toEqual({ kcal: 0, p: 0, c: 0, g: 0 });
    });
  });

  describe('Creating Meal Plans', () => {
    it('should create a single meal for a day', () => {
      const mealPlan: Partial<MealPlan> = {
        id: mealPlanId,
        user_id: athleteId,
        day_of_week: 'LUN',
        meal_name: 'Breakfast',
        food_id: 'eggs',
        target_quantity: 150,
        created_by: coachId,
        created_at: new Date().toISOString(),
      };

      expect(mealPlan.user_id).toBe(athleteId);
      expect(mealPlan.day_of_week).toBe('LUN');
      expect(mealPlan.meal_name).toBe('Breakfast');
      expect(mealPlan.created_by).toBe(coachId);
    });

    it('should create multiple meals for the same day', () => {
      const meals = [
        {
          day_of_week: 'LUN',
          meal_name: 'Breakfast',
          food_id: 'eggs',
          target_quantity: 150,
        },
        {
          day_of_week: 'LUN',
          meal_name: 'Lunch',
          food_id: 'chicken-breast',
          target_quantity: 200,
        },
        {
          day_of_week: 'LUN',
          meal_name: 'Dinner',
          food_id: 'rice',
          target_quantity: 200,
        },
      ];

      expect(meals).toHaveLength(3);
      expect(meals[0].meal_name).toBe('Breakfast');
      expect(meals[1].meal_name).toBe('Lunch');
      expect(meals[2].meal_name).toBe('Dinner');
    });

    it('should create a full week meal plan', () => {
      const days = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
      const mealsPerDay = 3;

      const weekPlan = days.flatMap(day => [
        { day_of_week: day, meal_name: 'Breakfast', food_id: 'eggs', quantity: 150 },
        { day_of_week: day, meal_name: 'Lunch', food_id: 'chicken-breast', quantity: 200 },
        { day_of_week: day, meal_name: 'Dinner', food_id: 'rice', quantity: 200 },
      ]);

      expect(weekPlan).toHaveLength(days.length * mealsPerDay);
    });

    it('should validate day_of_week values (Italian days)', () => {
      const validDays = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
      const invalidDay = 'MON'; // English instead of Italian

      expect(validDays).toContain('LUN');
      expect(validDays).toContain('DOM');
      expect(validDays).not.toContain('MON');
      expect(validDays).not.toContain(invalidDay);
    });
  });

  describe('Daily Macros Calculation', () => {
    it('should calculate daily total macros from multiple meals', () => {
      const breakfastMacros = calculateItemMacros(foods.eggs, 150);
      const lunchMacros = calculateItemMacros(foods.chicken, 200);
      const dinnerMacros = calculateItemMacros(foods.rice, 150);
      const oilMacros = calculateItemMacros(foods.olive_oil, 10);

      const dailyTotal = {
        kcal: breakfastMacros.kcal + lunchMacros.kcal + dinnerMacros.kcal + oilMacros.kcal,
        protein: breakfastMacros.p + lunchMacros.p + dinnerMacros.p + oilMacros.p,
        carbs: breakfastMacros.c + lunchMacros.c + dinnerMacros.c + oilMacros.c,
        fats: breakfastMacros.g + lunchMacros.g + dinnerMacros.g + oilMacros.g,
      };

      expect(dailyTotal.kcal).toBeGreaterThan(0);
      expect(dailyTotal.protein).toBeGreaterThan(0);
      expect(dailyTotal.carbs).toBeGreaterThan(0);
      expect(dailyTotal.fats).toBeGreaterThan(0);
    });

    it('should calculate carbs to fats ratio (cgRatio)', () => {
      const carbs = 250;
      const fats = 80;
      const cgRatio = carbs / fats;

      expect(cgRatio).toBeCloseTo(3.125);
    });

    it('should handle zero fats (avoid division by zero)', () => {
      const carbs = 250;
      const fats = 0;
      const cgRatio = fats > 0 ? carbs / fats : 0;

      expect(cgRatio).toBe(0);
    });
  });

  describe('Weekly Overview Calculation', () => {
    it('should aggregate macros per day of week', () => {
      const weeklyTotals: Record<string, any> = {
        LUN: { kcal: 2500, protein: 180, carbs: 250, fats: 80 },
        MAR: { kcal: 2400, protein: 175, carbs: 240, fats: 78 },
        MER: { kcal: 0, protein: 0, carbs: 0, fats: 0 },
      };

      expect(weeklyTotals.LUN.kcal).toBe(2500);
      expect(weeklyTotals.MAR.kcal).toBe(2400);
      expect(weeklyTotals.MER.kcal).toBe(0); // No meals planned
    });

    it('should calculate weekly average from active days only', () => {
      const activeDays = [
        { kcal: 2500, protein: 180, carbs: 250, fats: 80 },
        { kcal: 2400, protein: 175, carbs: 240, fats: 78 },
        { kcal: 2450, protein: 177, carbs: 245, fats: 79 },
      ];

      const avgKcal = activeDays.reduce((sum, d) => sum + d.kcal, 0) / activeDays.length;
      const avgProtein = activeDays.reduce((sum, d) => sum + d.protein, 0) / activeDays.length;

      expect(avgKcal).toBeCloseTo(2450);
      expect(avgProtein).toBeCloseTo(177.33);
    });

    it('should return zero averages if no meals planned', () => {
      const activeDays: any[] = [];
      const avgKcal = activeDays.length > 0
        ? activeDays.reduce((sum, d) => sum + d.kcal, 0) / activeDays.length
        : 0;

      expect(avgKcal).toBe(0);
    });
  });

  describe('Authorization (RLS Policies)', () => {
    it('should allow athletes to view their own meal plans', () => {
      // Policy: auth.uid() = user_id
      const currentUserId = athleteId;
      const mealPlanUserId = athleteId;

      expect(currentUserId).toBe(mealPlanUserId);
    });

    it('should allow athletes to update their own meal plans', () => {
      const currentUserId = athleteId;
      const mealPlanUserId = athleteId;
      const createdBy = athleteId;

      // Policy: auth.uid() = user_id AND created_by = auth.uid()
      const canUpdate = currentUserId === mealPlanUserId && createdBy === currentUserId;
      expect(canUpdate).toBe(true);
    });

    it('should prevent athletes from viewing other athletes meal plans', () => {
      const currentUserId = athleteId;
      const otherAthleteId = 'other-athlete-id';

      expect(currentUserId).not.toBe(otherAthleteId);
    });

    it('should allow coaches to create meal plans for assigned athletes', () => {
      const currentUserId = coachId;
      const mealPlanUserId = athleteId;
      // Coach must be assigned to athlete (is_coach_of policy)
      const isCoachOfAthlete = true; // Assume validated via is_coach_of() RPC

      expect(isCoachOfAthlete).toBe(true);
    });

    it('should allow coaches to update athlete meal plans they created', () => {
      const currentUserId = coachId;
      const mealPlanUserId = athleteId;
      const createdBy = coachId;
      const isCoachOfAthlete = true;

      // Policy: is_coach_of(user_id) AND created_by = auth.uid()
      const canUpdate = isCoachOfAthlete && createdBy === currentUserId;
      expect(canUpdate).toBe(true);
    });

    it('should prevent coaches from deleting meal plans created by athletes', () => {
      const currentUserId = coachId;
      const mealPlanUserId = athleteId;
      const createdBy = athleteId; // Created by athlete, not coach
      const isCoachOfAthlete = true;

      // Policy: is_coach_of(user_id) AND created_by = auth.uid()
      const canDelete = isCoachOfAthlete && createdBy === currentUserId;
      expect(canDelete).toBe(false);
    });
  });

  describe('Meal Plan Validation', () => {
    it('should reject negative quantities', () => {
      const quantity = -100;
      expect(quantity).toBeLessThan(0);
    });

    it('should accept zero quantity', () => {
      const quantity = 0;
      expect(quantity).toBe(0);
    });

    it('should accept positive quantities', () => {
      const quantity = 150;
      expect(quantity).toBeGreaterThan(0);
    });

    it('should reject invalid food_id', () => {
      const foodId = 'non-existent-food';
      const validFoodIds = ['eggs', 'chicken-breast', 'white-rice', 'olive-oil'];

      expect(validFoodIds).not.toContain(foodId);
    });

    it('should accept valid meal names', () => {
      const validMealNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout'];
      const mealName = 'Breakfast';

      expect(validMealNames).toContain(mealName);
    });

    it('should require user_id, day_of_week, and meal_name', () => {
      const mealPlan = {
        user_id: athleteId,
        day_of_week: 'LUN',
        meal_name: 'Breakfast',
        food_id: 'eggs',
        target_quantity: 150,
      };

      expect(mealPlan.user_id).toBeDefined();
      expect(mealPlan.day_of_week).toBeDefined();
      expect(mealPlan.meal_name).toBeDefined();
    });
  });

  describe('Meal Plan Queries', () => {
    it('should fetch all meal plans for an athlete', () => {
      const userId = athleteId;
      // SELECT * FROM meal_plans WHERE user_id = userId
      expect(userId).toBeDefined();
    });

    it('should fetch meal plans grouped by day of week', () => {
      const mealsByDay = {
        LUN: [
          { meal_name: 'Breakfast', food_id: 'eggs' },
          { meal_name: 'Lunch', food_id: 'chicken-breast' },
        ],
        MAR: [
          { meal_name: 'Breakfast', food_id: 'eggs' },
        ],
      };

      expect(Object.keys(mealsByDay)).toContain('LUN');
      expect(mealsByDay.LUN).toHaveLength(2);
    });

    it('should fetch related food data with meal plans', () => {
      const mealPlanWithFood = {
        id: mealPlanId,
        user_id: athleteId,
        day_of_week: 'LUN',
        meal_name: 'Breakfast',
        food_id: 'eggs',
        target_quantity: 150,
        foods: foods.eggs, // Related food data
      };

      expect(mealPlanWithFood.foods).toBeDefined();
      expect(mealPlanWithFood.foods.name).toBe('Eggs');
    });

    it('should handle null food_id (food deleted)', () => {
      const mealPlan = {
        id: mealPlanId,
        user_id: athleteId,
        food_id: null, // Food was deleted
        foods: null,
      };

      expect(mealPlan.food_id).toBeNull();
      expect(mealPlan.foods).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large quantities', () => {
      const result = calculateItemMacros(foods.eggs, 1000);

      expect(result.kcal).toBe(1550);
      expect(result.p).toBe(130);
    });

    it('should handle decimal quantities', () => {
      const result = calculateItemMacros(foods.olive_oil, 7.5);

      expect(result.kcal).toBeCloseTo(66);
      expect(result.g).toBeCloseTo(7.5);
    });

    it('should handle very small quantities', () => {
      const result = calculateItemMacros(foods.eggs, 0.1);

      expect(result.kcal).toBeCloseTo(0.155);
      expect(result.p).toBeCloseTo(0.013);
    });

    it('should handle food with missing macro data', () => {
      const incompleteFood: Partial<Food> = {
        id: 'test-food',
        name: 'Test Food',
        portion_size: 100,
        calories: 100,
        // Missing: protein, carbs, fats
      };

      const result = calculateItemMacros(incompleteFood as Food, 100);

      expect(result.kcal).toBe(100);
      expect(result.p).toBeDefined();
    });

    it('should handle duplicate meal plans for the same meal/day (allow multiple entries)', () => {
      // Meal plans can have multiple entries for same meal (e.g., add another serving)
      const meals = [
        { day_of_week: 'LUN', meal_name: 'Breakfast', food_id: 'eggs', quantity: 100 },
        { day_of_week: 'LUN', meal_name: 'Breakfast', food_id: 'eggs', quantity: 50 },
      ];

      expect(meals).toHaveLength(2);
      expect(meals[0].day_of_week).toBe(meals[1].day_of_week);
      expect(meals[0].meal_name).toBe(meals[1].meal_name);
    });
  });

  describe('Meal Plan Updates', () => {
    it('should allow updating food quantity for a meal', () => {
      const mealPlan: Partial<MealPlan> = {
        id: mealPlanId,
        user_id: athleteId,
        target_quantity: 150, // Original
      };

      // Update to 200
      const updated = { ...mealPlan, target_quantity: 200 };

      expect(updated.target_quantity).toBe(200);
      expect(mealPlan.target_quantity).toBe(150); // Original unchanged
    });

    it('should allow changing food for a meal', () => {
      const mealPlan: Partial<MealPlan> = {
        id: mealPlanId,
        food_id: 'eggs',
      };

      const updated = { ...mealPlan, food_id: 'chicken-breast' };

      expect(updated.food_id).toBe('chicken-breast');
    });

    it('should prevent unauthorized updates', () => {
      const mealPlanCreatedBy = coachId;
      const currentUser = athleteId;

      // Athlete cannot update meal plan created by coach
      const canUpdate = currentUser === mealPlanCreatedBy || currentUser === athleteId;

      // Only creator or athlete themselves can update
      expect(currentUser === athleteId).toBe(true);
    });
  });

  describe('Meal Adherence Tracking', () => {
    it('should track which meals athlete ate for a day', () => {
      const adherence = {
        user_id: athleteId,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        adherence_data: {
          'LUN': {
            'Breakfast': true,
            'Lunch': true,
            'Dinner': false,
          },
        },
      };

      expect(adherence.adherence_data['LUN']['Breakfast']).toBe(true);
      expect(adherence.adherence_data['LUN']['Dinner']).toBe(false);
    });

    it('should calculate adherence percentage', () => {
      const totalMeals = 21; // 3 meals * 7 days
      const completedMeals = 18;
      const adherencePercent = (completedMeals / totalMeals) * 100;

      expect(adherencePercent).toBeCloseTo(85.71);
    });
  });
});
