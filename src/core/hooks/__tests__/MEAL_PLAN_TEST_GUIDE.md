# Meal Plan Test Guide

## Overview

This test suite covers all aspects of meal plan creation, management, and macro calculation for the bw-tracker app.

## Test IDs to Replace

Replace these placeholder IDs with your actual test data:

```typescript
// Replace with actual user IDs from your Supabase auth.users
const athleteId = '78ccb3b9-f2a8-4fc0-8164-4f5541710594';
const coachId = 'f119519c-d96b-496f-89a2-4690406cd2ea';
```

### How to get actual IDs:

1. **Go to Supabase Dashboard** → Authentication → Users
2. **Find your test users** and copy their UUIDs
3. **Update the test file** with real IDs
4. **Or use environment variables**:

```typescript
const athleteId = process.env.TEST_ATHLETE_ID || '78ccb3b9-...';
const coachId = process.env.TEST_COACH_ID || 'f119519c-...';
```

Then set in `.env.test`:
```
TEST_ATHLETE_ID=<your-athlete-uuid>
TEST_COACH_ID=<your-coach-uuid>
```

## Food IDs to Add

Create test food items in your `foods` table:

```sql
INSERT INTO foods (id, name, portion_size, unit, calories, protein, carbs, fats, state)
VALUES
  ('eggs', 'Eggs', 100, 'g', 155, 13, 1.1, 11, 'active'),
  ('chicken-breast', 'Chicken Breast', 100, 'g', 165, 31, 0, 3.6, 'active'),
  ('white-rice', 'White Rice (cooked)', 100, 'g', 130, 2.7, 28, 0.3, 'active'),
  ('olive-oil', 'Olive Oil', 10, 'ml', 88, 0, 0, 10, 'active');
```

Or replace food IDs in tests with your actual food database IDs:

```typescript
const foods: Record<string, Food> = {
  eggs: {
    id: 'YOUR_ACTUAL_EGGS_ID', // Get from foods table
    name: 'Eggs',
    // ...
  },
};
```

## Running Tests

### Run all meal plan tests
```bash
npm test mealPlan
```

### Run specific test suite
```bash
npm test -- --grep "Macro Calculation"
```

### Run with coverage
```bash
npm run test:coverage -- src/core/hooks/__tests__/mealPlan.test.ts
```

### Watch mode (auto-rerun on changes)
```bash
npm test -- --watch mealPlan
```

## Test Suites

### 1. Macro Calculation (calculateItemMacros)
Tests the core math function for calculating macros from food portions.

**Key tests:**
- Exact portion (100g → same as food macros)
- Half portion (50g → half macros)
- Double portion (200g → double macros)
- Different units (ml for oil)
- Null/undefined foods (return zeros)
- Zero quantity (return zeros)

**Example:**
```typescript
const result = calculateItemMacros(foods.eggs, 150);
// Input: 150g of eggs
// Returns: { kcal: 232.5, p: 19.5, c: 1.65, g: 16.5 }
```

### 2. Creating Meal Plans
Tests meal plan creation and structure validation.

**Key tests:**
- Single meal for a day
- Multiple meals per day
- Full week meal plans (7 days × 3 meals)
- Day validation (LUN, MAR, MER, GIO, VEN, SAB, DOM - Italian)
- Required fields

**Example data:**
```typescript
const mealPlan = {
  user_id: athleteId,
  day_of_week: 'LUN',        // Italian: lunedi
  meal_name: 'Breakfast',
  food_id: 'eggs',
  target_quantity: 150,      // grams
  created_by: coachId,
};
```

### 3. Daily Macros Calculation
Tests aggregating macros from multiple meals into daily totals.

**Key tests:**
- Sum macros from breakfast, lunch, dinner, oils
- Carbs-to-Fats ratio (cgRatio = carbs / fats)
- Handle zero fats (avoid division by zero)

**Example:**
```
Breakfast: 232.5 kcal, 19.5g protein
Lunch:     330 kcal, 62g protein
Dinner:    195 kcal, 4.1g protein
Oil:       88 kcal, 0g protein
---
Total:     845.5 kcal, 85.6g protein
```

### 4. Weekly Overview Calculation
Tests aggregating daily macros into weekly patterns.

**Key tests:**
- Per-day totals (LUN: 2500 kcal, MAR: 2400 kcal, etc.)
- Weekly average (only from active days with meals)
- Empty days (0 macros)

**Example:**
```
Weekly average from 5 active days:
- 2450 kcal/day
- 177 g protein/day
- 245 g carbs/day
- 79 g fats/day
- 3.1 carbs:fats ratio
```

### 5. Authorization (RLS Policies)
Tests meal plan access control.

**Policies:**
- ✅ Athletes can view/edit their own meal plans
- ❌ Athletes cannot view other athletes' meal plans
- ✅ Coaches can create meal plans for assigned athletes
- ✅ Coaches can update meal plans they created
- ❌ Coaches cannot update meal plans created by athletes
- ❌ Coaches can only access assigned athletes

**Example:**
```typescript
// Coach creates meal plan for assigned athlete ✅
const mealPlan = {
  user_id: athleteId,      // Assigned to this coach
  created_by: coachId,     // Coach created it
};

// Athlete edits meal plan ✅
const updated = {
  ...mealPlan,
  target_quantity: 200,    // Athlete's own change
};

// Different coach edits ❌
// RLS denies: is_coach_of(athleteId) fails
```

### 6. Meal Plan Validation
Tests input validation.

**Requirements:**
- `user_id` required (UUID)
- `day_of_week` required (LUN|MAR|MER|GIO|VEN|SAB|DOM)
- `meal_name` required (string)
- `food_id` optional but must exist in foods table
- `target_quantity` required (> 0)
- `created_by` optional (filled by auth.uid())

### 7. Meal Plan Queries
Tests fetching and filtering.

**Queries:**
- Fetch all meals for athlete
- Group by day of week
- Include related food data
- Handle deleted foods (food_id = NULL)

### 8. Edge Cases
Tests unusual but valid scenarios.

**Scenarios:**
- Very large quantities (1000g)
- Decimal quantities (7.5ml)
- Very small quantities (0.1g)
- Missing macro data in food
- Duplicate meals (same meal twice per day - stacking servings)

### 9. Meal Plan Updates
Tests modification and authorization.

**Operations:**
- Update quantity (150g → 200g)
- Change food (eggs → chicken)
- Authorization checks

### 10. Meal Adherence Tracking
Tests tracking which meals were actually eaten.

**Features:**
- Per-day adherence data (true/false per meal)
- Adherence percentage calculation
- Track completion rate per week

## Integration with Actual Database

To run integration tests against your real Supabase:

### 1. Create a test database role
```sql
CREATE ROLE test_coach WITH LOGIN PASSWORD 'test_coach_password';
CREATE ROLE test_athlete WITH LOGIN PASSWORD 'test_athlete_password';

GRANT USAGE ON SCHEMA public TO test_coach, test_athlete;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_coach, test_athlete;
```

### 2. Create test fixture script
```typescript
// scripts/setup-test-fixtures.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Create test users
const { data: athlete } = await supabase.auth.admin.createUser({
  email: 'test-athlete@example.com',
  password: 'test-password',
});

const { data: coach } = await supabase.auth.admin.createUser({
  email: 'test-coach@example.com',
  password: 'test-password',
});

// Create coach-athlete relationship
await supabase.from('coach_athletes').insert({
  coach_id: coach.user.id,
  athlete_id: athlete.user.id,
  status: 'active',
});

console.log('Test fixtures created');
console.log(`Athlete ID: ${athlete.user.id}`);
console.log(`Coach ID: ${coach.user.id}`);
```

### 3. Run setup before tests
```bash
npm run setup-test-fixtures
npm test mealPlan
```

## Common Test Patterns

### Testing macro calculations
```typescript
it('should calculate correct macros', () => {
  const result = calculateItemMacros(food, quantity);

  expect(result.kcal).toBeCloseTo(expectedKcal, 1);
  expect(result.p).toBeCloseTo(expectedProtein, 1);
  expect(result.c).toBeCloseTo(expectedCarbs, 1);
  expect(result.g).toBeCloseTo(expectedFats, 1);
});
```

### Testing authorization
```typescript
it('should deny unauthorized access', () => {
  const currentUser = athleteId;
  const createdBy = coachId;
  const canModify = currentUser === createdBy;

  expect(canModify).toBe(false);
});
```

### Testing data validation
```typescript
it('should reject invalid day_of_week', () => {
  const invalidDay = 'MON'; // English
  const validDays = ['LUN', 'MAR', ...];

  expect(validDays).not.toContain(invalidDay);
});
```

## Debugging Tips

### See detailed logs
```bash
npm test -- --reporter=verbose mealPlan
```

### Run single test
```bash
npm test -- --grep "should calculate macros for half portion"
```

### Print test values
```typescript
it('debug test', () => {
  const result = calculateItemMacros(foods.eggs, 150);
  console.log('Result:', result);  // View output
  expect(result).toBeDefined();
});
```

### Check Supabase logs
1. Go to Supabase Dashboard
2. Logs → Database → View queries and errors
3. Look for RLS policy denials

## Next Steps

1. **Replace test IDs** with your actual Supabase user IDs
2. **Add test food items** or update food IDs in tests
3. **Run tests** with `npm test mealPlan`
4. **Fix any failures** (likely authorization or data issues)
5. **Integrate with CI/CD** to run on every push

## Example: Creating a Real Meal Plan

Once tests pass, create a production meal plan:

```typescript
// 1. Fetch athlete profile
const { data: athlete } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', athleteId)
  .single();

// 2. Fetch available foods
const { data: foods } = await supabase
  .from('foods')
  .select('*')
  .eq('state', 'active');

// 3. Create meal plan
const mealPlan = {
  user_id: athleteId,
  day_of_week: 'LUN',
  meal_name: 'Breakfast',
  food_id: foods[0].id,
  target_quantity: 150,
  created_by: coachId,
};

const { data: created } = await supabase
  .from('meal_plans')
  .insert(mealPlan)
  .select();

// 4. Calculate macros
const macros = calculateItemMacros(foods[0], 150);
console.log('Daily macros:', macros);
```
