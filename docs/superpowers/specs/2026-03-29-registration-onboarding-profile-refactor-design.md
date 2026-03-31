# Design: Registration → Onboarding → Profile Refactor

**Date:** 2026-03-29
**Status:** Approved

---

## Problem

1. **Redundant onboarding screen.** `TrackerApp` has a `needsOnboarding` gate that shows `Onboarding.tsx` (a second full-screen profile form) if `profiles.height` or `profiles.initial_weight` are missing. The new `RegistrationPage` already collects and saves all this data via the backend `/auth/complete-registration` endpoint, so this screen is dead for new users.

2. **Race condition causing the symptom.** When `supabase.auth.signUp()` succeeds, `AuthContext` fires `onAuthStateChange` and `UnauthenticatedOnly` immediately redirects to `/tracker` — before the backend `/auth/complete-registration` call finishes writing the profile. `TrackerApp` mounts, `checkProfile` finds `height` / `initial_weight` missing, Onboarding appears.

3. **ProfileView is incomplete.** It shows 9 of the ~16 fields registration collects. Missing: `dob`, `goal_rate`, `gym_days_per_week` (all in `profiles`), and `diet_framework`, `meal_frequency`, `allergies` (in `athlete_preferences`).

4. **Pre-existing bug in `useSetAthletePreferences`.** Its mutation type doesn't include `diet_framework` or `meal_frequency`, which were added in migration 003. These fields are silently dropped on any preferences upsert.

5. **`age` inconsistency.** `ProfileView` lets users edit `age` as a raw integer, but the DB has a `BEFORE INSERT OR UPDATE` trigger (`trg_recompute_age`) that overwrites `age` from `dob` whenever `dob` is non-null. So if a user has `dob` set (all new users do), any manual `age` edit is silently discarded by the DB.

---

## Architecture

### What is being changed

| File | Change |
|------|--------|
| `src/apps/tracker/components/Onboarding.tsx` | Delete entirely |
| `src/apps/tracker/TrackerApp.tsx` | Remove `needsOnboarding` state, `checkProfile` effect, `Onboarding` import/render |
| `src/apps/dashboard/hooks/useAthletePreferences.ts` | Fix mutation type to include `diet_framework` and `meal_frequency` |
| `src/core/hooks/useAthletePreferences.ts` | New file — re-exports the hook from the dashboard layer (or moves it here); used by ProfileView |
| `src/apps/tracker/components/ProfileView.tsx` | Add three new form sections; load + save both `profiles` and `athlete_preferences` |

### What is NOT changed

- `RegistrationPage` — already works correctly end-to-end
- `AppRouter` — no route changes
- `useProfile` / `useUpdateProfile` — unchanged
- DB schema — all required columns exist
- `Auth.tsx` — already deprecated, untouched

---

## Data model mapping

### Fields now in ProfileView (after refactor)

**From `profiles` table** (via `useProfile` / `useUpdateProfile`):
| Field | UI control | Notes |
|-------|-----------|-------|
| `username` | text input | optional |
| `gender` | select | male/female/other |
| `dob` | date input | replaces the manual `age` number input |
| `unit_system` | select | metric/imperial |
| `height` | number | cm or inches |
| `initial_weight` | number | kg or lbs |
| `target_weight` | number | kg or lbs |
| `goal` | select | lose_fat/maintain_weight/build_muscle |
| `goal_rate` | select | conservative/moderate/aggressive — **new** |
| `activity_level` | select | sedentary/lightly_active/moderately_active/very_active |
| `gym_days_per_week` | number 0–7 | **new** |
| `steps_goal` | number | existing |
| `water_goal` | number | existing |

> `age` is removed as an editable field. It is auto-computed by the DB trigger from `dob`. No manual age editing.

**From `athlete_preferences` table** (via new `useAthletePreferences` in core):
| Field | UI control | Notes |
|-------|-----------|-------|
| `diet_framework` | select | omnivore/pescatarian/vegetarian/vegan — **new** |
| `meal_frequency` | number 2–6 | **new** |
| `allergies` | multi-select chips | same 7 allergens as registration — **new** |

---

## Why two tables is correct

`athlete_preferences` is intentionally separate from `profiles` for three reasons:

1. **`set_by` column** — a coach can write preferences for their athlete (RLS policies allow it). This can't live in `profiles` which is always athlete-owned.
2. **AI/RAG context boundary** — the AI meal planner consumes `athlete_preferences` as its context snapshot; keeping it separate lets it be versioned and re-embedded independently.
3. **Optional existence** — a self-coached user without AI features may never have an `athlete_preferences` row. `profiles` always has a row.

The UI hides this completely. One view, four sections, one save button.

---

## Component design — ProfileView

Four named sections, two backed by `profiles`, one split, one by `athlete_preferences`:

| Section | Fields | Table |
|---------|--------|-------|
| **Identity & Body** | username, gender, dob, unit\_system, height, initial\_weight, target\_weight | `profiles` |
| **Training** | goal, goal\_rate *(new)*, activity\_level, gym\_days\_per\_week *(new)*, steps\_goal | `profiles` |
| **Daily Targets** | water\_goal, salt\_goal | `profiles` |
| **Diet & Nutrition** | diet\_framework *(new)*, meal\_frequency *(new)*, allergies *(new)* | `athlete_preferences` |

**Form save flow:**
1. `handleSubmit` fires
2. `useUpdateProfile.mutateAsync(profileUpdates)` — saves all `profiles` fields
3. `useSetAthletePreferences.mutateAsync(prefsUpdates)` — always upserts preferences (idempotent, simpler than diffing)
4. Both succeed → `toast.success` + `onBack()`
5. Either fails → `toast.error`, no navigation

**Loading states:** Show spinner until both `useProfile` and `useAthletePreferences` have loaded.

---

## Moving `useAthletePreferences` to core

`useAthletePreferences` and `useSetAthletePreferences` currently live in `src/apps/dashboard/hooks/`. Since ProfileView (in the tracker app) will need them, create `src/core/hooks/useAthletePreferences.ts` as the canonical location and update the dashboard import to point there.

---

## Bug fixes included

1. `useSetAthletePreferences` mutation type: add `diet_framework?: 'omnivore' | 'pescatarian' | 'vegetarian' | 'vegan'` and `meal_frequency?: number`
2. Remove manual `age` editing from ProfileView (would be silently overwritten by DB trigger anyway)

---

## Out of scope

- Changes to RegistrationPage
- Adding `intolerances`, `food_dislikes`, `cooking_skill`, etc. from `AthletePreferences` — too many fields, not collected in registration
- URL-based routing for ProfileView
- Any DB schema changes

---

## Post-implementation

After all changes, run a bug scan across the tracker and dashboard apps to catch any remaining references to `Onboarding`, `needsOnboarding`, stale `age`-edit patterns, or broken preference reads.
