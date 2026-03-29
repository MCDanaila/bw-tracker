# Self-Coached Diet Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow self-coached athletes to create, edit, and update their own weekly `meal_plans` from the dashboard Diet Editor page.

**Architecture:** Add a `SelfCoachedDietEditor` component inside `DietEditorPage.tsx` that renders `MealPlanEditor` in edit mode (already fully built) and wires a save handler that deletes + re-inserts `meal_plans` rows for the current user. The default export's branch logic checks `capabilities.canManageOwnDiet` (from `useRole()`) to route self-coached users to this new component instead of the existing read-only `AthleteDietView`.

**Tech Stack:** React 19, TypeScript, TanStack Query (`useQueryClient`), Supabase JS client, sonner (toasts), existing `MealPlanEditor` component.

---

### Task 1: Add `SelfCoachedDietEditor` to `DietEditorPage`

**Files:**
- Modify: `src/apps/dashboard/pages/DietEditorPage.tsx`

**Context — current shape of the file (lines 1-32):**
```typescript
import { useState, useMemo, useCallback } from 'react';
// ...other imports
import type { DietTemplateItem, MealPlan } from '@/core/types/database';

export default function DietEditorPage() {
  const { canManageAthletes, effectiveUserId } = useAthleteContext();

  if (canManageAthletes) {
    return <CoachDietEditor />;
  }

  return <AthleteDietView userId={effectiveUserId} />;
}
```

`AthleteDietView` (lines 196-252) is the current read-only view. It must stay unchanged — regular athletes (role `'athlete'`) still use it.

---

- [ ] **Step 1: Add two new imports to `DietEditorPage.tsx`**

Open `src/apps/dashboard/pages/DietEditorPage.tsx`. The first line is:
```typescript
import { useState, useMemo, useCallback } from 'react';
```

Change it to:
```typescript
import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRole } from '@/core/contexts/RoleContext';
```

---

- [ ] **Step 2: Update `DietEditorPage` default export to add the self-coached branch**

Find this block (lines 24-32):
```typescript
export default function DietEditorPage() {
  const { canManageAthletes, effectiveUserId } = useAthleteContext();

  if (canManageAthletes) {
    return <CoachDietEditor />;
  }

  return <AthleteDietView userId={effectiveUserId} />;
}
```

Replace it with:
```typescript
export default function DietEditorPage() {
  const { canManageAthletes, effectiveUserId } = useAthleteContext();
  const { capabilities } = useRole();

  if (canManageAthletes) {
    return <CoachDietEditor />;
  }

  if (capabilities.canManageOwnDiet) {
    return <SelfCoachedDietEditor userId={effectiveUserId} />;
  }

  return <AthleteDietView userId={effectiveUserId} />;
}
```

---

- [ ] **Step 3: Add the `SelfCoachedDietEditor` component**

Insert this new component between the `// ---------- Coach View ----------` section and the `// ---------- Athlete View ----------` section (i.e., just before line 195 `// ---------- Athlete View ----------`):

```typescript
// ---------- Self-Coached View ----------

function SelfCoachedDietEditor({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data: plans, isLoading } = useDietData(userId);

  const items = useMemo(() => {
    if (!plans || plans.length === 0) return [];
    return plans.map((plan: MealPlan, idx: number) => ({
      id: plan.id,
      template_id: '',
      day_of_week: plan.day_of_week,
      meal_name: plan.meal_name,
      food_id: plan.food_id,
      target_quantity: plan.target_quantity,
      sort_order: idx,
      created_at: plan.created_at,
      foods: plan.foods,
    }));
  }, [plans]);

  const handleSaveItems = useCallback(async (updatedItems: DietTemplateItem[]) => {
    try {
      const { error: delErr } = await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', userId);
      if (delErr) throw delErr;

      if (updatedItems.length > 0) {
        const toInsert = updatedItems.map(({ food_id, target_quantity, day_of_week, meal_name }) => ({
          user_id: userId,
          created_by: userId,
          template_id: null,
          day_of_week,
          meal_name,
          food_id,
          target_quantity,
        }));
        const { error: insErr } = await supabase
          .from('meal_plans')
          .insert(toInsert);
        if (insErr) throw insErr;
      }

      queryClient.invalidateQueries({ queryKey: ['diet-plans', userId] });
      toast.success('Diet plan saved.');
    } catch (err) {
      console.error('Failed to save diet plan:', err);
      toast.error('Failed to save. Please try again.');
    }
  }, [userId, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Diet Plan</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Diet Plan</h1>
      <MealPlanEditor
        templateId=""
        items={items}
        onSave={handleSaveItems}
      />
    </div>
  );
}
```

---

- [ ] **Step 4: Run TypeScript type-check**

```bash
npx tsc -b --noEmit
```

Expected: **zero errors**.

If you see an error about `capabilities.canManageOwnDiet` not existing, open `src/core/contexts/RoleContext.tsx` and check the `Capabilities` type — the field may be named differently. Match whatever name is used there.

If you see an error about the `toInsert` shape not matching `meal_plans` insert type, check `src/core/types/database.ts` for the `MealPlan` interface — ensure the field names (`user_id`, `created_by`, `template_id`, `day_of_week`, `meal_name`, `food_id`, `target_quantity`) are all present and nullable as appropriate.

---

- [ ] **Step 5: Start dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard` as a self-coached user (`role = 'self_coached'`).

Navigate to **Diet** in the dashboard sidebar.

Verify:
1. Page title shows "My Diet Plan" (not "Diet Templates")
2. Day tabs (LUN–DOM) are visible
3. **"Add Meal" button** appears at the bottom of each day tab
4. If existing meal plan rows exist: they are shown with edit controls (rename, delete, add food, quantity inputs)
5. **"Save Changes"** button appears in the top-right of the editor (enabled when dirty)
6. Make a change (add a food to a meal), click **Save Changes** → `toast.success("Diet plan saved.")` appears
7. Reload the page → the change persists (was saved to `meal_plans`)
8. Open the tracker app at `http://localhost:3000` → Diet tab → changes are reflected there too (same `meal_plans` data)

---

- [ ] **Step 6: Commit**

```bash
git add src/apps/dashboard/pages/DietEditorPage.tsx
git commit -m "feat: enable self-coached athletes to edit their diet plan in dashboard"
```

---

## Self-review checklist

- [x] **Spec coverage**: Role branch (`canManageOwnDiet`) ✓, edit mode ✓, save to `meal_plans` ✓, cache invalidation ✓, empty state (editor renders empty with "Add Meal") ✓, coach/athlete views unchanged ✓
- [x] **No placeholders**: All steps have complete code
- [x] **Type consistency**: `DietTemplateItem` type used throughout; destructuring on save correctly picks only `meal_plans`-compatible fields
- [x] **`AthleteDietView` untouched**: Regular athletes still hit the read-only path
