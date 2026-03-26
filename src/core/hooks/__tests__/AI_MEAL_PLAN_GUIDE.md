# AI Meal Plan Creation - Complete Test Guide

## Overview

This test suite covers the complete workflow from AI diet suggestion generation to actual meal plan creation:

```
Coach Request
    ↓
AI Suggestion Generated (Edge Function)
    ↓
Coach Reviews & Edits
    ↓
Food Matching (AI food → DB food_id)
    ↓
Coach Applies Suggestion
    ↓
Meal Plans Created (batch insert)
    ↓
Athlete Views & Edits Meal Plans
    ↓
Weekly Macros Calculated
```

## Test Data Setup

### Replace These IDs

```typescript
// Update in aiMealPlanCreation.test.ts
const athleteId = '78ccb3b9-f2a8-4fc0-8164-4f5541710594';    // ← Update with your test athlete UUID
const coachId = 'f119519c-d96b-496f-89a2-4690406cd2ea';      // ← Update with your test coach UUID
const suggestionId = 'suggestion-uuid-123';                   // ← Can stay as-is (generated on insert)
```

### Get IDs from Supabase

1. **Go to Supabase Dashboard**
2. **Authentication → Users**
3. Copy UUID of test athlete user
4. Copy UUID of test coach user
5. **Update test file** with these IDs

### Verify Coach-Athlete Assignment

```sql
-- Check if coach is assigned to athlete
SELECT * FROM coach_athletes
WHERE coach_id = '<your-coach-uuid>'
  AND athlete_id = '<your-athlete-uuid>'
  AND status = 'active';

-- If not, create the relationship:
INSERT INTO coach_athletes (coach_id, athlete_id, status)
VALUES ('<coach-uuid>', '<athlete-uuid>', 'active');
```

## Running Tests

### Run all AI meal plan tests
```bash
npm test aiMealPlanCreation
```

### Run specific test suite
```bash
npm test -- --grep "Applying Suggestion"
```

### Run with coverage
```bash
npm run test:coverage -- aiMealPlanCreation
```

### Watch mode
```bash
npm test -- --watch aiMealPlanCreation
```

## Test Suites Explained

### 1. AI Suggestion Generation (Edge Function)

Tests the `/functions/v1/generate-diet-suggestion` Edge Function output.

**Input:**
```typescript
{
  athlete_id: "78ccb3b9-f2a8-4fc0-8164-4f5541710594",
  query_text: "Create a 7-day cutting plan with Mediterranean foods",
  coach_id: "f119519c-d96b-496f-89a2-4690406cd2ea"
}
```

**Expected Output:**
```json
{
  "suggestion_id": "uuid-123",
  "suggestion_text": "Generated plan...",
  "suggestion_json": {
    "summary": "A 7-day cutting plan...",
    "weekly_plan": [
      {
        "day": "Monday",
        "meals": [
          {
            "meal_name": "Breakfast",
            "foods": [
              {
                "name": "Eggs",
                "quantity_g": 150
              }
            ],
            "estimated_macros": {
              "kcal": 400,
              "protein": 25,
              "carbs": 35,
              "fats": 15
            }
          }
        ],
        "day_total": {
          "kcal": 1450,
          "protein": 120,
          "carbs": 130,
          "fats": 50
        }
      }
    ],
    "coaching_notes": "Focus on protein intake during cutting phase"
  }
}
```

**Key Tests:**
- ✅ Generates summary
- ✅ All 7 days included
- ✅ Macros for each meal & day total
- ✅ Coaching notes
- ✅ Stores in ai_suggestions table with `status: 'pending'`

---

### 2. Coach Reviews Suggestion

Tests UI/workflow for coach reviewing the AI-generated plan.

**Workflow:**
```
┌─ View suggestion details
├─ Edit foods/quantities
├─ Edit meal names
├─ Review macros
└─ Approve/Reject/Apply buttons
```

**Key Tests:**
- ✅ Display all suggestion data
- ✅ Coach can edit before applying
- ✅ Allow reject/approve/apply actions
- ✅ Prevent applying without review

**Example: Coach Editing a Meal**
```typescript
// Original from AI
{
  meal_name: "Breakfast",
  foods: [{ name: "Eggs", quantity_g: 150 }],
  estimated_macros: { kcal: 400, protein: 25, carbs: 35, fats: 15 }
}

// Coach changes to
{
  meal_name: "Breakfast",
  foods: [{ name: "Eggs", quantity_g: 200 }], // ← Changed quantity
  estimated_macros: { kcal: 533, protein: 33, carbs: 47, fats: 20 } // ← Updated macros
}
```

---

### 3. Food Matching & Resolution

Tests matching AI-suggested foods to actual database food IDs.

**Problem:** AI suggests "Chicken Breast" (text), but database has UUID/food IDs

**Solution: Fuzzy Match**
```typescript
AI Food: { name: "Chicken Breast", quantity_g: 200 }

Database: [
  { id: "chicken-breast", name: "Chicken Breast" },
  { id: "chicken-thighs", name: "Chicken Thighs" }
]

Result: Matched to "chicken-breast" ID ✅
```

**Key Tests:**
- ✅ Exact/fuzzy matching of food names
- ✅ Handle foods not in database
- ✅ Coach manual selection if match fails
- ✅ Convert quantities (100g vs portion_size)
- ✅ Handle unit conversions (ml, g, pieces)

**Example with Unit Conversion:**
```typescript
// AI suggests oil in ml
{ name: "Olive Oil", quantity_ml: 10 }

// Database stores in ml
{ id: "olive-oil", unit: "ml", portion_size: 10 }

// Store as-is
{ food_id: "olive-oil", target_quantity: 10 }
```

---

### 4. Applying Suggestion → Creating Meal Plans

Tests the critical workflow of converting suggestion → meal_plans entries.

**Batch Insert Flow:**

```
AI Suggestion:
  Weekly Plan for 7 days
  Each day: 3 meals (Breakfast, Lunch, Dinner)
  Each meal: 1-3 foods

       ↓ CONVERSION ↓

Meal Plans (21-49 rows):
  Day 1, LUN, Breakfast, food_id, quantity
  Day 1, LUN, Lunch, food_id, quantity
  Day 1, LUN, Dinner, food_id, quantity
  Day 2, MAR, Breakfast, food_id, quantity
  ...and so on
```

**Key Tests:**
- ✅ Create meal_plans row per food per meal
- ✅ Map suggestion days to Italian day_of_week (Monday → LUN)
- ✅ Batch insert with transaction (all-or-nothing)
- ✅ Update suggestion status to 'applied'
- ✅ Link meal_plans back to suggestion

**Example Data Transformation:**

```typescript
// Input: Single AI suggestion
const suggestion = {
  id: "suggestion-123",
  status: "pending",
  suggestion_json: {
    weekly_plan: [
      {
        day: "Monday",
        meals: [
          {
            meal_name: "Breakfast",
            foods: [
              { name: "Eggs", quantity_g: 150 },
              { name: "Bread", quantity_g: 50 }
            ]
          }
        ]
      }
    ]
  }
}

// Output: Multiple meal_plans rows
[
  {
    user_id: athleteId,
    day_of_week: "LUN",      // Mapped
    meal_name: "Breakfast",
    food_id: "eggs",         // Matched
    target_quantity: 150,
    created_by: coachId
  },
  {
    user_id: athleteId,
    day_of_week: "LUN",      // Same day
    meal_name: "Breakfast",
    food_id: "whole-grain-bread",  // Matched
    target_quantity: 50,
    created_by: coachId
  }
]
```

---

### 5. Full End-to-End Workflow

Tests the complete flow from request to athlete viewing meal plan.

**Steps:**
1. Coach submits query to Edge Function
2. Edge Function calls Gemini API
3. Suggestion stored in ai_suggestions table
4. Coach reviews suggestion
5. Coach clicks "Apply"
6. System matches foods
7. Meal plans batch inserted
8. Status updated to 'applied'
9. Athlete logs in and sees meal plan
10. Weekly macros calculated from meal plans

---

### 6. Validation During Application

Tests preventing invalid applications.

**Checks:**
- ✅ All foods can be resolved (no unknowns)
- ✅ No existing meal plan for same day (optional check)
- ✅ Macro variance < 10% after food matching
- ✅ Coach authorization (is_coach_of)

**Example: Validation Failure**
```typescript
// Suggestion has unresolved food
foods: [
  { name: "Eggs", quantity_g: 150 },           // ✅ Can match
  { name: "Unknown Exotic Fruit", qty: 100 }  // ❌ Cannot match
]

// Block application until resolved
can_apply = false
warning = "1 food cannot be matched. Please resolve manually."
```

---

### 7. Error Handling

Tests failure scenarios.

**Scenarios:**
- ❌ Suggestion not found (deleted/wrong ID)
- ❌ Food matching fails for all foods
- ❌ Database insert fails (rollback)
- ❌ Coach not authorized (not assigned to athlete)
- ❌ RLS policy blocks access

---

### 8. Post-Application

Tests what happens after successful application.

**Athlete Workflow:**
```
1. Opens "Diet" tab
2. Sees meal plan for current week
3. Views daily macros
4. Can edit quantities
5. Tracks adherence (meals eaten)
```

**Coach Workflow:**
```
1. Opens "AI Suggestions" history
2. Sees list of applied suggestions
3. Can track which suggestions applied to which athletes
4. Can generate new suggestions
```

---

## Real-World Example: Creating a Cutting Plan

### Step 1: Coach Generates Suggestion

**Frontend:**
```typescript
// src/apps/dashboard/components/ai/AiPlannerControls.tsx
const result = await generateSuggestion.mutateAsync({
  athlete_id: '78ccb3b9-f2a8-4fc0-8164-4f5541710594',
  query_text: 'Create a 7-day cutting plan with Mediterranean foods, target 1800 kcal/day',
  coach_id: 'f119519c-d96b-496f-89a2-4690406cd2ea',
});
```

**Edge Function:** `/functions/v1/generate-diet-suggestion`

Returns: AI-generated 7-day meal plan

### Step 2: Coach Reviews

**UI Shows:**
```
Title: "Cutting Plan - Mediterranean Diet"
Macros:
  - Monday: 1850 kcal, 180g protein, 180g carbs, 60g fat
  - Tuesday: 1820 kcal, 185g protein, 175g carbs, 59g fat
  - ...
```

**Coach Can:**
- View all meals
- Edit quantities
- Change foods
- Add/remove meals

### Step 3: Apply Suggestion

**On Click "Apply":**

```typescript
// 1. Validate foods
const unresolvedFoods = validateFoods(suggestion);
if (unresolvedFoods.length > 0) {
  showError("Resolve these foods first");
  return;
}

// 2. Convert to meal_plans
const mealPlans = convertSuggestionToMealPlans(suggestion, athleteId, coachId);
// Output: ~21 meal_plans rows (7 days × 3 meals, some with multiple foods)

// 3. Insert
const { error } = await supabase
  .from('meal_plans')
  .insert(mealPlans);

if (error) {
  // Rollback - don't update suggestion status
  showError("Failed to create meal plans");
  return;
}

// 4. Update suggestion
await supabase
  .from('ai_suggestions')
  .update({
    status: 'applied',
    applied_at: new Date().toISOString(),
    created_meal_plan_ids: mealPlans.map(mp => mp.id)
  })
  .eq('id', suggestionId);

showSuccess("Meal plan created for athlete!");
```

### Step 4: Athlete Views Meal Plan

**Athlete App:**
```
Tab: Diet
This Week's Plan:

Monday (LUN):
  Breakfast:
    - Eggs (2) - 150g
    - Whole Grain Toast - 50g
    → Total: 400 kcal, 25g protein

  Lunch:
    - Chicken Breast - 200g
    - White Rice - 150g
    → Total: 550 kcal, 55g protein

  Dinner:
    - Salmon - 180g
    - Sweet Potato - 150g
    → Total: 500 kcal, 40g protein

Day Total: 1450 kcal, 120g protein, 130g carbs, 50g fat
```

---

## Integration with Your App

### Database Tables

**ai_suggestions**
```sql
SELECT * FROM ai_suggestions
WHERE athlete_id = '<athlete-uuid>'
AND status IN ('applied', 'pending')
ORDER BY created_at DESC;
```

**meal_plans (after application)**
```sql
SELECT * FROM meal_plans
WHERE user_id = '<athlete-uuid>'
AND day_of_week IN ('LUN', 'MAR', 'MER')
ORDER BY day_of_week;
```

### Frontend Components

**Generate Suggestion:**
- `src/apps/dashboard/components/ai/AiPlannerControls.tsx`
- `src/apps/dashboard/hooks/useAiDietSuggestions.ts`

**Apply Suggestion:**
- Create `src/apps/dashboard/components/ai/ApplySuggestionDialog.tsx`
- Implement food matching UI

**View Meal Plan (Athlete):**
- `src/apps/tracker/components/diet/DietView.tsx`
- Uses `useDietData` hook

### Services

**Suggestion Service:**
- `src/apps/dashboard/services/aiDietService.ts`

**Meal Plan Creation:**
- Create `src/apps/dashboard/services/mealPlanService.ts`
```typescript
export async function applyAiSuggestion(
  suggestionId: string,
  athleteId: string,
  coachId: string,
  suggestion: DietSuggestion
): Promise<MealPlan[]> {
  // Validate
  // Match foods
  // Convert to meal_plans
  // Batch insert
  // Update suggestion
  // Return created meal_plans
}
```

---

## Testing Checklist

- [ ] Replace athlete/coach IDs with real UUIDs
- [ ] Verify coach-athlete relationship exists
- [ ] Run `npm test aiMealPlanCreation`
- [ ] Check all test suites pass
- [ ] Test end-to-end in UI (generate → apply)
- [ ] Verify meal plans created in database
- [ ] Check athlete can view meal plan
- [ ] Verify weekly macros calculated
- [ ] Test coach can edit meal plan
- [ ] Test athlete can edit meal plan
- [ ] Verify RLS policies working (only assigned athletes visible)

---

## Debugging

### Suggestion not applying?

Check logs:
```sql
-- View latest suggestion
SELECT id, status, athlete_id, created_at, suggestion_json
FROM ai_suggestions
WHERE athlete_id = '<athlete-uuid>'
ORDER BY created_at DESC
LIMIT 1;

-- Check meal_plans created
SELECT COUNT(*), day_of_week
FROM meal_plans
WHERE user_id = '<athlete-uuid>'
GROUP BY day_of_week;
```

### Food matching failing?

Check foods table:
```sql
-- Find foods similar to AI suggestion
SELECT id, name, portion_size, calories
FROM foods
WHERE name ILIKE '%chicken%'
AND state = 'active';
```

### RLS blocking access?

Verify coach-athlete relationship:
```sql
SELECT *
FROM coach_athletes
WHERE coach_id = '<coach-uuid>'
AND athlete_id = '<athlete-uuid>'
AND status = 'active';
```

---

## Next Steps

1. **Update test IDs** with actual athlete/coach UUIDs
2. **Create test food items** or update food IDs
3. **Run tests** with `npm test aiMealPlanCreation`
4. **Implement `applyAiSuggestion` service function**
5. **Create "Apply" dialog component**
6. **Test end-to-end in UI**
7. **Deploy when confident**
