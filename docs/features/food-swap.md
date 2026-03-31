# Food Swap

## Problem

An athlete needs to swap a food in their meal plan for something else, but wants to hit the same macro target without manually recalculating portions.

## How It Works

Given a **source food** and a **target food**, the algorithm calculates what weight of the target food matches the primary macro of the source food at its original weight.

```
source: 150g chicken breast  (30g protein)
target: tuna

→ how many grams of tuna = 30g protein?
→ answer: 125g tuna
```

## Implementation

Pure domain logic in `src/core/lib/swapAlgorithm.ts`. No side effects, no API calls — just math.

The same logic is mirrored in the FastAPI backend at `backend/app/lib/domain/` for server-side use.

### Primary Macro Priority

The algorithm targets one macro at a time (configurable). Default priority: **protein → carbs → fat**.

If the target food cannot hit the same macro within a reasonable weight range, the UI surfaces a warning.

## Foods Table

```sql
CREATE TABLE foods (
  id    TEXT PRIMARY KEY,  -- food name (e.g. "Pollo alla griglia")
  kcal  NUMERIC,
  protein NUMERIC,
  carbs   NUMERIC,
  fat     NUMERIC
);
```

`id` is the food name string — intentional design decision. It simplifies swap matching since foods are referenced by name in meal plans, and there's no need for UUID joins.

The table is **public-readable** (no RLS user scoping). Coach manages the food library.

## UI Flow

1. Athlete taps a food item in their meal plan
2. Swap sheet opens — athlete searches the `foods` table
3. Selects a replacement food
4. App calls `swapAlgorithm` and shows the calculated weight
5. Athlete confirms → dispatched to Dexie syncQueue as a meal plan mutation

## Macro Calculation Helper

`src/core/lib/mealMacros.ts` — pure functions for totalling macros across a full meal or day. Used by both the diet viewer and the swap UI.
