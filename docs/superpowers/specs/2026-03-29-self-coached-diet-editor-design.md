# Design: Self-Coached Athlete Diet Editor

**Date:** 2026-03-29
**Status:** Approved

---

## Problem

A self-coached athlete (`role = 'self_coached'`) can access the dashboard (`canViewDashboard: true`) and has the capability `canManageOwnDiet: true`. However, the **Diet Editor** page in the dashboard currently renders their meal plan in **read-only mode**, with an empty `onSave` handler and the message "Your coach hasn't assigned a diet plan yet" — both wrong for a self-coached user.

Self-coached athletes need to be able to **create, edit, and update** their own weekly `meal_plans` directly from the dashboard.

---

## Scope

### In scope
- Unlock `MealPlanEditor` in full edit mode for self-coached athletes on `DietEditorPage`
- Implement a working save handler that persists to the `meal_plans` table
- Fix the empty state message for self-coached users (no plan yet → actionable prompt)
- Invalidate TanStack Query cache after save so the tracker's Diet tab stays in sync

### Out of scope
- Diet template creation/management for self-coached users (no template system needed)
- Food creation/addition to the food library (user picks from existing foods only)
- AI diet planner (coach-only feature, unchanged)
- Any changes to the tracker app's Diet tab or food swap flow

---

## Architecture

### Role detection

`DietEditorPage` currently checks `canManageAthletes` from `useAthleteContext()`.
To detect self-coached users, it also imports `useRole()` from `RoleContext`:

```typescript
const { canManageAthletes, effectiveUserId } = useAthleteContext();
const { capabilities } = useRole();

if (canManageAthletes) return <CoachDietEditor />;
if (capabilities.canManageOwnDiet) return <SelfCoachedDietEditor userId={effectiveUserId} />;
return <AthleteDietView userId={effectiveUserId} />;
```

### New component: `SelfCoachedDietEditor`

A new private function component inside `DietEditorPage.tsx`. Approximately 50 lines.

**Data loading:**
Uses `useDietData(userId)` — the same hook already used by `AthleteDietView`. Returns `MealPlan[]` from the `meal_plans` table joined with `foods`.

**Item conversion:**
`MealPlan[]` rows are converted to `DietTemplateItem[]` format (same shape `MealPlanEditor` expects), identical to how `AthleteDietView` does it today. `templateId` is passed as `""` (meal_plans.template_id is nullable and unused here).

**Save handler:**
Full replace pattern — same as `CoachDietEditor.handleSaveItems` but targets `meal_plans`:

1. `DELETE FROM meal_plans WHERE user_id = userId`
2. `INSERT INTO meal_plans` the updated rows, mapping `DietTemplateItem` fields to `meal_plans` columns:
   - `user_id` ← `userId`
   - `day_of_week` ← `item.day_of_week`
   - `meal_name` ← `item.meal_name`
   - `food_id` ← `item.food_id`
   - `target_quantity` ← `item.target_quantity`
   - `created_by` ← `userId`
   - `template_id` ← `null`
3. On success: `toast.success` + invalidate `['diet-plans', userId]` query via `useQueryClient()`
4. On error: `toast.error`

**Empty state:**
If no meal_plans exist yet, `MealPlanEditor` renders with an empty item list. The "Add Meal" button is present on each day tab. No special empty state overlay needed — the editor itself is the CTA.

The `AthleteDietView` empty state message ("Your coach hasn't assigned a diet plan yet") is **not** shown to self-coached users since they never reach that component.

### `MealPlanEditor` — no changes

`MealPlanEditor` already supports:
- Full edit mode (add/remove meals, rename meals, reorder items, copy day to other days)
- Food picker via `FoodSearchModal` (reads from existing `foods` table)
- Save button enabled when dirty
- Unsaved changes warning on page unload

No changes needed to this component.

---

## Files changed

| File | Change |
|------|--------|
| `src/apps/dashboard/pages/DietEditorPage.tsx` | Add `SelfCoachedDietEditor` component (~50 lines); update top-level branch to check `canManageOwnDiet`; import `useRole`, `useQueryClient` |

---

## RLS note

`meal_plans` already has RLS policies allowing athletes to read and write their own rows (`user_id = auth.uid()`). No schema or policy changes required.

---

## Data flow summary

```
SelfCoachedDietEditor
  ├── useDietData(userId)          → reads meal_plans + foods
  ├── MealPlanEditor (edit mode)   → local state edits
  └── handleSaveItems              → DELETE + INSERT meal_plans
                                   → invalidate ['diet-plans', userId]
```

The tracker app's Diet tab (`DietView`) reads from the same `['diet-plans', userId]` query key, so it automatically reflects any changes made in the dashboard after the cache is invalidated.
