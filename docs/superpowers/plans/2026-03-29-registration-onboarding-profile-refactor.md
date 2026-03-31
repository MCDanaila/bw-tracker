# Registration → Onboarding → Profile Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant post-registration Onboarding screen and expand ProfileView into four consolidated sections covering all fields from both `profiles` and `athlete_preferences`.

**Architecture:** Delete `Onboarding.tsx` and its gate in `TrackerApp` (race condition disappears with nothing to show). Move `useAthletePreferences` from the dashboard layer to `src/core/hooks/` so the tracker app can use it. Fix the pre-existing mutation type bug. Expand `ProfileView` with a unified form that saves both tables on a single submit. Extract ALLERGENS to a shared constant.

**Tech Stack:** React 19, TypeScript, react-hook-form v7 (Controller for allergies chips), TanStack Query, Supabase, Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/core/lib/constants.ts` | Modify | Add `ALLERGENS` + `AllergenId` export |
| `src/apps/public/RegistrationPage.tsx` | Modify | Import `ALLERGENS` from constants; keep local `ALLERGENS_WITH_NONE` |
| `src/core/hooks/useAthletePreferences.ts` | **Create** | Canonical athlete preferences query + mutation (with fixed types) |
| `src/apps/dashboard/hooks/useAthletePreferences.ts` | **Delete** | Replaced by core hook |
| `src/apps/dashboard/pages/AiPlannerPage.tsx` | Modify | Update import path |
| `src/apps/dashboard/components/ai/AiPlannerControls.tsx` | Modify | Update import path |
| `src/apps/dashboard/pages/AthleteDetailPage.tsx` | Modify | Update import path |
| `supabase/migrations/004_athlete_rls_insert.sql` | **Create** | Athlete INSERT policy on `athlete_preferences` (required for upsert) |
| `src/apps/tracker/TrackerApp.tsx` | Modify | Remove `needsOnboarding` state + `checkProfile` effect + `Onboarding` import |
| `src/apps/tracker/components/Onboarding.tsx` | **Delete** | Dead code — registration handles profile setup |
| `src/apps/tracker/components/ProfileView.tsx` | Modify | 4-section form; saves both `profiles` and `athlete_preferences` |

---

## Task 1: Extract ALLERGENS to shared constants

**Files:**
- Modify: `src/core/lib/constants.ts`
- Modify: `src/apps/public/RegistrationPage.tsx`

- [ ] **Step 1: Add ALLERGENS to constants.ts**

Append to the end of `src/core/lib/constants.ts`:

```typescript
export const ALLERGENS = [
  { id: 'lactose',   label: 'Lactose' },
  { id: 'gluten',    label: 'Gluten' },
  { id: 'nuts',      label: 'Nuts' },
  { id: 'fish',      label: 'Fish' },
  { id: 'eggs',      label: 'Eggs' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'soy',       label: 'Soy' },
] as const;

export type AllergenId = typeof ALLERGENS[number]['id'];
```

- [ ] **Step 2: Update RegistrationPage imports**

In `src/apps/public/RegistrationPage.tsx`, add to the imports:

```typescript
import { ALLERGENS } from '@/core/lib/constants';
```

- [ ] **Step 3: Replace local ALLERGENS in RegistrationPage**

Find and remove the local `ALLERGENS` constant (the one with `{ id: 'none', label: 'NONE ✓' }`).

Directly below the imports, add a local extension for the registration-only "clear all" entry:

```typescript
const ALLERGENS_WITH_NONE = [
  ...ALLERGENS,
  { id: 'none' as const, label: 'NONE ✓' },
] as const;
```

Replace every usage of `ALLERGENS` in RegistrationPage's JSX with `ALLERGENS_WITH_NONE` (the allergen chip grid in step 2 of the wizard).

- [ ] **Step 4: TypeScript check**

```bash
npx tsc -b --noEmit
```

Expected: no errors. If `AllergenId` or `ALLERGENS_WITH_NONE` cause type issues, ensure the `.filter(x => x !== 'none')` call in `handleFinish` still compiles — `hardNos` is typed as `string[]` so narrowing isn't required.

- [ ] **Step 5: Commit**

```bash
git add src/core/lib/constants.ts src/apps/public/RegistrationPage.tsx
git commit -m "refactor: extract ALLERGENS constant to core/lib/constants"
```

---

## Task 2: Move useAthletePreferences to core and fix mutation type

**Files:**
- Create: `src/core/hooks/useAthletePreferences.ts`
- Delete: `src/apps/dashboard/hooks/useAthletePreferences.ts`
- Modify: `src/apps/dashboard/pages/AiPlannerPage.tsx`
- Modify: `src/apps/dashboard/components/ai/AiPlannerControls.tsx`
- Modify: `src/apps/dashboard/pages/AthleteDetailPage.tsx`

**Bug being fixed:** `useSetAthletePreferences` in the old file was missing `diet_framework` and `meal_frequency` from its mutation payload type — both columns added in migration 003. These fields were silently dropped on every upsert.

- [ ] **Step 1: Create `src/core/hooks/useAthletePreferences.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/contexts/AuthContext';
import type { AthletePreferences } from '@/core/types/database';

export function useAthletePreferences(athleteId?: string) {
  return useQuery({
    queryKey: ['athletePreferences', athleteId],
    queryFn: async (): Promise<AthletePreferences | null> => {
      if (!athleteId) return null;
      const { data, error } = await supabase
        .from('athlete_preferences')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();
      if (error) throw error;
      return data as AthletePreferences | null;
    },
    enabled: !!athleteId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetAthletePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: {
      athleteId: string;
      diet_framework?: 'omnivore' | 'pescatarian' | 'vegetarian' | 'vegan';
      meal_frequency?: number;
      allergies?: string[];
      intolerances?: string[];
      dietary_restrictions?: string[];
      food_dislikes?: string[];
      food_preferences?: string[];
      cuisine_preferences?: string[];
      meal_timing_notes?: string | null;
      supplement_use?: string[];
      digestion_issues?: string | null;
      cooking_skill?: 'none' | 'basic' | 'intermediate' | 'advanced' | null;
      meal_prep_time?: 'minimal' | 'moderate' | 'flexible' | null;
      budget_level?: 'budget' | 'moderate' | 'premium' | null;
      additional_notes?: string | null;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { athleteId, ...prefsData } = prefs;
      const { data, error } = await supabase
        .from('athlete_preferences')
        .upsert(
          {
            athlete_id: athleteId,
            set_by: user.id,
            ...prefsData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'athlete_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as AthletePreferences;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['athletePreferences', variables.athleteId] });
    },
  });
}
```

- [ ] **Step 2: Delete the old dashboard hook**

```bash
rm src/apps/dashboard/hooks/useAthletePreferences.ts
```

- [ ] **Step 3: Update dashboard imports**

In each of the three files below, replace any import from `../hooks/useAthletePreferences` or `@/apps/dashboard/hooks/useAthletePreferences` with:

```typescript
import { useAthletePreferences, useSetAthletePreferences } from '@/core/hooks/useAthletePreferences';
```

Files to update:
- `src/apps/dashboard/pages/AiPlannerPage.tsx`
- `src/apps/dashboard/components/ai/AiPlannerControls.tsx`
- `src/apps/dashboard/pages/AthleteDetailPage.tsx`

- [ ] **Step 4: TypeScript check**

```bash
npx tsc -b --noEmit
```

Expected: no import errors. If any dashboard file was using `useSetAthletePreferences` with the old narrower type, it will now compile cleanly since the new type is a superset.

- [ ] **Step 5: Commit**

```bash
git add src/core/hooks/useAthletePreferences.ts \
  src/apps/dashboard/pages/AiPlannerPage.tsx \
  src/apps/dashboard/components/ai/AiPlannerControls.tsx \
  src/apps/dashboard/pages/AthleteDetailPage.tsx
git commit -m "refactor: move useAthletePreferences to core/hooks, fix diet_framework/meal_frequency in mutation type"
```

(The deleted `src/apps/dashboard/hooks/useAthletePreferences.ts` is staged by git automatically.)

---

## Task 3: Add athlete INSERT RLS policy for athlete_preferences

**Files:**
- Create: `supabase/migrations/004_athlete_rls_insert.sql`

**Why this is needed:** `useSetAthletePreferences` uses `upsert`, which fires an INSERT when no row exists. The existing RLS policies only allow athletes to SELECT and UPDATE — not INSERT. Pre-existing users (registered before the new flow) have no `athlete_preferences` row yet. Without this policy, their first save from ProfileView will fail with a permissions error.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/004_athlete_rls_insert.sql`:

```sql
-- Migration: 004_athlete_rls_insert.sql
-- Allows athletes to create their own athlete_preferences row.
-- Required for ProfileView upsert when no preferences row exists yet
-- (affects users created before the new registration flow).

DROP POLICY IF EXISTS "Athletes insert own preferences" ON athlete_preferences;
CREATE POLICY "Athletes insert own preferences"
  ON athlete_preferences FOR INSERT
  WITH CHECK (athlete_id = auth.uid() AND set_by = auth.uid());
```

- [ ] **Step 2: Apply in Supabase dashboard**

Go to **Supabase dashboard → SQL Editor**, paste and run the contents of `004_athlete_rls_insert.sql`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/004_athlete_rls_insert.sql
git commit -m "fix: add athlete INSERT RLS policy for athlete_preferences"
```

---

## Task 4: Remove Onboarding gate from TrackerApp and delete Onboarding.tsx

**Files:**
- Modify: `src/apps/tracker/TrackerApp.tsx`
- Delete: `src/apps/tracker/components/Onboarding.tsx`

- [ ] **Step 1: Remove Onboarding import**

In `src/apps/tracker/TrackerApp.tsx`, remove:

```typescript
import Onboarding from "./components/Onboarding";
```

- [ ] **Step 2: Remove needsOnboarding state**

Remove:

```typescript
const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
```

- [ ] **Step 3: Remove checkProfile effect**

Remove the entire `useEffect` block that starts with:

```typescript
useEffect(() => {
  async function checkProfile() {
    if (!session?.user) {
```

This block ends with `}, [session, loading]);` — remove the whole thing (~33 lines).

- [ ] **Step 4: Fix the today's-log effect**

The remaining `useEffect` for auto-switching to History tab has this guard:

```typescript
if (!session?.user?.id || needsOnboarding !== false) return;
```

Replace it with:

```typescript
if (!session?.user?.id) return;
```

- [ ] **Step 5: Replace the loading/onboarding render guards**

Remove:

```typescript
if (loading || needsOnboarding === null) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}

if (needsOnboarding) {
  return <Onboarding onComplete={() => setNeedsOnboarding(false)} />;
}
```

Replace with:

```typescript
if (loading) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}
```

- [ ] **Step 6: Delete Onboarding.tsx**

```bash
rm src/apps/tracker/components/Onboarding.tsx
```

- [ ] **Step 7: TypeScript check**

```bash
npx tsc -b --noEmit
```

Expected: no errors. Verify there are no remaining references to `Onboarding` or `needsOnboarding`:

```bash
grep -r "needsOnboarding\|Onboarding\|checkProfile" src/ --include="*.tsx" --include="*.ts"
```

Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add src/apps/tracker/TrackerApp.tsx
git commit -m "feat: remove Onboarding gate — registration now handles full profile setup"
```

---

## Task 5: Expand ProfileView with four sections

**Files:**
- Modify: `src/apps/tracker/components/ProfileView.tsx`

This rewrites ProfileView in full. The form type is extended to include both `profiles` and `athlete_preferences` fields. `age` is removed as an editable field (auto-computed by DB trigger from `dob`). `dob`, `goal_rate`, `gym_days_per_week`, `salt_goal` are added to the profiles section. `diet_framework`, `meal_frequency`, and `allergies` are added as a new Diet & Nutrition section.

- [ ] **Step 1: Replace the full contents of ProfileView.tsx**

```typescript
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ChevronLeft, UserCircle, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { toast } from 'sonner';
import {
  useProfile,
  useUpdateProfile,
  STEPS_GOAL_DEFAULT,
  WATER_GOAL_DEFAULT,
  SALT_GOAL_DEFAULT,
} from '@/core/hooks/useProfile';
import { useAthletePreferences, useSetAthletePreferences } from '@/core/hooks/useAthletePreferences';
import { ALLERGENS } from '@/core/lib/constants';
import type { UserProfile, AthletePreferences } from '@/core/types/database';
import { useAuth } from '@/core/contexts/AuthContext';

interface ProfileViewProps {
  onBack: () => void;
}

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

// age is omitted — auto-computed by DB trigger from dob, not editable
// id is omitted — never sent as an update
type ProfileFormValues = Omit<UserProfile, 'id' | 'age'> & {
  diet_framework: AthletePreferences['diet_framework'] | '';
  meal_frequency: number | null;
  allergies: string[];
};

export default function ProfileView({ onBack }: ProfileViewProps) {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: prefs, isLoading: prefsLoading } = useAthletePreferences(user?.id);
  const { mutateAsync: updateProfile, isPending: profilePending } = useUpdateProfile();
  const { mutateAsync: setPreferences, isPending: prefsPending } = useSetAthletePreferences();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { isDirty },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      username: '',
      gender: '',
      dob: null,
      unit_system: 'metric',
      height: null,
      initial_weight: null,
      target_weight: null,
      goal: '',
      goal_rate: 'moderate',
      activity_level: '',
      gym_days_per_week: null,
      steps_goal: STEPS_GOAL_DEFAULT,
      water_goal: WATER_GOAL_DEFAULT,
      salt_goal: SALT_GOAL_DEFAULT,
      email: null,
      role: 'athlete',
      plan: 'self_coached',
      ai_enabled: false,
      diet_framework: '',
      meal_frequency: null,
      allergies: [],
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username ?? '',
        gender: profile.gender ?? '',
        dob: profile.dob ?? null,
        unit_system: profile.unit_system ?? 'metric',
        height: profile.height,
        initial_weight: profile.initial_weight,
        target_weight: profile.target_weight,
        goal: profile.goal ?? '',
        goal_rate: profile.goal_rate ?? 'moderate',
        activity_level: profile.activity_level ?? '',
        gym_days_per_week: profile.gym_days_per_week,
        steps_goal: profile.steps_goal ?? STEPS_GOAL_DEFAULT,
        water_goal: profile.water_goal ?? WATER_GOAL_DEFAULT,
        salt_goal: profile.salt_goal ?? SALT_GOAL_DEFAULT,
        email: profile.email,
        role: profile.role,
        plan: profile.plan,
        ai_enabled: profile.ai_enabled,
        diet_framework: prefs?.diet_framework ?? '',
        meal_frequency: prefs?.meal_frequency ?? null,
        allergies: prefs?.allergies ?? [],
      });
    }
  }, [profile, prefs, reset]);

  const isMetric = watch('unit_system') === 'metric';
  const isPending = profilePending || prefsPending;

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) return;
    try {
      await updateProfile({
        username: data.username || null,
        gender: data.gender || null,
        dob: data.dob || null,
        unit_system: data.unit_system,
        height: data.height ? Number(data.height) : null,
        initial_weight: data.initial_weight ? Number(data.initial_weight) : null,
        target_weight: data.target_weight ? Number(data.target_weight) : null,
        goal: data.goal || null,
        goal_rate: data.goal_rate ?? 'moderate',
        activity_level: data.activity_level || null,
        gym_days_per_week: data.gym_days_per_week ? Number(data.gym_days_per_week) : null,
        steps_goal: data.steps_goal ? Number(data.steps_goal) : STEPS_GOAL_DEFAULT,
        water_goal: data.water_goal ? Number(data.water_goal) : WATER_GOAL_DEFAULT,
        salt_goal: data.salt_goal ? Number(data.salt_goal) : SALT_GOAL_DEFAULT,
      });

      await setPreferences({
        athleteId: user.id,
        diet_framework: (data.diet_framework as AthletePreferences['diet_framework']) || undefined,
        meal_frequency: data.meal_frequency ? Number(data.meal_frequency) : undefined,
        allergies: data.allergies,
      });

      toast.success('Profile saved.');
      onBack();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile.';
      toast.error(message);
    }
  };

  if (profileLoading || prefsLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto p-4 pb-24 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 mt-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/20 text-primary rounded-xl">
            <UserCircle size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Edit Profile</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Identity & Body */}
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Identity & Body</h2>

          <Input
            label="Username (Optional)"
            type="text"
            placeholder="e.g., fitness_buff99"
            {...register('username')}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="profile-gender" className="text-sm font-medium text-muted-foreground">Gender</label>
              <select id="profile-gender" {...register('gender')} className={SELECT_CLASS}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Date of Birth" type="date" {...register('dob')} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-unit" className="text-sm font-medium text-muted-foreground">Unit System</label>
            <select id="profile-unit" {...register('unit_system')} className={SELECT_CLASS}>
              <option value="metric">Metric (kg, cm)</option>
              <option value="imperial">Imperial (lbs, inches)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label={`Height (${isMetric ? 'cm' : 'in'})`}
              type="number" step="0.1"
              placeholder={isMetric ? '175' : '68'}
              {...register('height')}
            />
            <Input
              label={`Current (${isMetric ? 'kg' : 'lbs'})`}
              type="number" step="0.1"
              placeholder={isMetric ? '70.5' : '155'}
              {...register('initial_weight')}
            />
            <Input
              label={`Target (${isMetric ? 'kg' : 'lbs'})`}
              type="number" step="0.1"
              placeholder={isMetric ? '68' : '150'}
              {...register('target_weight')}
            />
          </div>
        </section>

        {/* Training */}
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Training</h2>

          <div className="space-y-1.5">
            <label htmlFor="profile-goal" className="text-sm font-medium text-muted-foreground">Primary Goal</label>
            <select id="profile-goal" {...register('goal')} className={SELECT_CLASS}>
              <option value="">Select Goal</option>
              <option value="lose_fat">Lose Fat</option>
              <option value="maintain_weight">Maintain Weight</option>
              <option value="build_muscle">Build Muscle</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-goal-rate" className="text-sm font-medium text-muted-foreground">Goal Rate</label>
            <select id="profile-goal-rate" {...register('goal_rate')} className={SELECT_CLASS}>
              <option value="conservative">Conservative — slow, sustainable</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive — fast, demanding</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-activity" className="text-sm font-medium text-muted-foreground">Activity Level</label>
            <select id="profile-activity" {...register('activity_level')} className={SELECT_CLASS}>
              <option value="">Select Activity Level</option>
              <option value="sedentary">Sedentary (office job, no exercise)</option>
              <option value="lightly_active">Lightly Active (1–3 days/week)</option>
              <option value="moderately_active">Moderately Active (3–5 days/week)</option>
              <option value="very_active">Very Active (6–7 days/week)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gym Days / Week"
              type="number" min="0" max="7" step="1"
              placeholder="4"
              {...register('gym_days_per_week')}
            />
            <Input
              label="Steps Goal (steps/day)"
              type="number" min="1000" max="100000" step="500"
              placeholder="10000"
              {...register('steps_goal')}
            />
          </div>
        </section>

        {/* Daily Targets */}
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Daily Targets</h2>
          <p className="text-xs text-muted-foreground -mt-2">Shown in your daily dashboard progress bars.</p>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Water Goal (liters/day)"
              type="number" min="0.5" max="15" step="0.5"
              placeholder="4.0"
              {...register('water_goal')}
            />
            <Input
              label="Salt Goal (g/day)"
              type="number" min="0" max="30" step="0.5"
              placeholder="6.0"
              {...register('salt_goal')}
            />
          </div>
        </section>

        {/* Diet & Nutrition */}
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Diet & Nutrition</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="profile-diet-fw" className="text-sm font-medium text-muted-foreground">Diet Framework</label>
              <select id="profile-diet-fw" {...register('diet_framework')} className={SELECT_CLASS}>
                <option value="">Select Diet</option>
                <option value="omnivore">Omnivore</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>
            <Input
              label="Meals per Day"
              type="number" min="2" max="6" step="1"
              placeholder="3"
              {...register('meal_frequency')}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground block">Allergens</span>
            <Controller
              name="allergies"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map((a) => {
                    const selected = field.value.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? field.value.filter((v) => v !== a.id)
                            : [...field.value, a.id];
                          field.onChange(next);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-transparent text-muted-foreground border-border hover:border-primary'
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>
        </section>

        <Button
          type="submit"
          size="lg"
          disabled={isPending || !isDirty}
          className="w-full h-14 text-lg font-bold rounded-2xl"
        >
          {isPending ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify SALT_GOAL_DEFAULT is exported from useProfile**

Open `src/core/hooks/useProfile.ts` and confirm it already exports `SALT_GOAL_DEFAULT`. If it does not, add it:

```typescript
export const SALT_GOAL_DEFAULT = 6.0;
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc -b --noEmit
```

Common issues to look for and fix:
- `dob: null` in defaultValues — `UserProfile.dob` is `string | null`, `null` is valid
- `goal_rate` select binding — the `register` return type narrows correctly as long as the `UserProfile.goal_rate` union type is satisfied
- `diet_framework` cast in `onSubmit` — the `as AthletePreferences['diet_framework']` cast is safe because the select only allows valid values; the empty string case is handled by `|| undefined`

- [ ] **Step 4: Commit**

```bash
git add src/apps/tracker/components/ProfileView.tsx
git commit -m "feat: expand ProfileView into 4 sections — Identity/Body, Training, Daily Targets, Diet & Nutrition"
```

---

## Task 6: Final verification and bug scan

- [ ] **Step 1: Full TypeScript build**

```bash
npx tsc -b --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Fix any errors, then:

```bash
git add -p
git commit -m "fix: lint errors from profile refactor"
```

- [ ] **Step 3: Grep for stale references**

```bash
grep -r "needsOnboarding\|from.*Onboarding\|checkProfile" src/ --include="*.tsx" --include="*.ts"
```

Expected: no output.

```bash
grep -r "dashboard/hooks/useAthletePreferences" src/ --include="*.tsx" --include="*.ts"
```

Expected: no output.

- [ ] **Step 4: Run bug-auditor agent**

Use the `bug-auditor` agent on the four key changed files:

```
Run bug-auditor on:
- src/apps/tracker/TrackerApp.tsx
- src/apps/tracker/components/ProfileView.tsx
- src/core/hooks/useAthletePreferences.ts
- src/core/lib/constants.ts
```

Focus areas: null-safety in ProfileView (both `profile` and `prefs` can be null before data loads), missing error handling, type coercions in `onSubmit`.

- [ ] **Step 5: Fix any bugs found and commit**

```bash
git add <changed-files>
git commit -m "fix: bugs found in post-refactor scan"
```
