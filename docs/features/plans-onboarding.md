# Plans, Registration & Onboarding

## Overview

This spec covers:
1. Public landing page with plan selection
2. Registration flow (direct + invite-based) with duplicate-email guard
3. Coaching relationship constraints
4. Onboarding data collection — BODY / FUEL / DRIVE framework
5. Routing model post-login

---

## 1. Plans

### Plan Matrix

| Plan | Role | Max athletes | AI enabled | Price |
|------|------|:---:|:---:|-------|
| `self_coached` | `self_coached` | — | No | Free |
| `self_coached_ai` | `self_coached` | — | Yes | Free (for now) |
| `coach` | `coach` | 5 | No | Free (for now) |
| `coach_pro` | `coach` | 25 | Yes | Free (for now) |

**AI features** = AI diet suggestion, AI workout planning, RAG knowledge base access.

### Schema changes — profiles

```sql
ALTER TABLE profiles
  ADD COLUMN plan TEXT NOT NULL DEFAULT 'self_coached'
    CHECK (plan IN ('self_coached', 'self_coached_ai', 'coach', 'coach_pro')),
  ADD COLUMN ai_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN dob DATE,
  ADD COLUMN goal_rate TEXT NOT NULL DEFAULT 'moderate'
    CHECK (goal_rate IN ('conservative', 'moderate', 'aggressive')),
  ADD COLUMN gym_days_per_week INTEGER
    CHECK (gym_days_per_week BETWEEN 0 AND 7);
```

`plan` and `role` are set server-side only (FastAPI service role) — never client-writeable.
`ai_enabled` is derived from plan on registration; can be toggled by admin independently later.

**plan → role + ai_enabled mapping** (set by FastAPI on `/auth/complete-registration`):

| plan | role | ai_enabled |
|------|------|:---:|
| `self_coached` | `self_coached` | false |
| `self_coached_ai` | `self_coached` | true |
| `coach` | `coach` | false |
| `coach_pro` | `coach` | true |

### Schema changes — athlete_preferences

```sql
ALTER TABLE athlete_preferences
  ADD COLUMN diet_framework TEXT NOT NULL DEFAULT 'omnivore'
    CHECK (diet_framework IN ('omnivore', 'pescatarian', 'vegetarian', 'vegan')),
  ADD COLUMN meal_frequency INTEGER NOT NULL DEFAULT 3
    CHECK (meal_frequency BETWEEN 2 AND 6);
```

`hard_no's` at registration maps to existing `allergies TEXT[]` and `intolerances TEXT[]` columns:

| Selection | Maps to |
|-----------|---------|
| Nuts, Fish, Eggs, Shellfish, Soy | `allergies` |
| Lactose, Gluten, Fructose | `intolerances` |

No new column needed.

### Age — stored as DOB, computed

`profiles.dob DATE` is the source of truth. `profiles.age INTEGER` is kept for legacy but recomputed on every profile write:

```sql
-- Add to handle_new_user trigger and profile update trigger:
NEW.age := EXTRACT(year FROM age(NEW.dob))::integer;
```

Anywhere age is displayed or used for TDEE: compute from `dob` directly. Never rely on the cached `age` field for precision.

### Athlete cap enforcement

Enforced in FastAPI when a coach adds an athlete (not at DB level, for clear error messages):

```python
PLAN_ATHLETE_LIMITS = {"coach": 5, "coach_pro": 25}

active_count = count coach_athletes where coach_id = user.id and status = 'active'
if active_count >= PLAN_ATHLETE_LIMITS[coach.plan]:
    raise HTTP 403 "Athlete limit reached for your plan"
```

### AI feature gate

```python
if not current_user.ai_enabled:
    raise HTTP 403 "AI features are not available on your plan"
```

---

## 2. Routing Model

### Entry logic

| Condition | Destination |
|-----------|-------------|
| No session | `/` → LandingPage |
| Session, `role = athlete` | `/` → redirect `/tracker` |
| Session, `role = self_coached` | `/` → redirect `/tracker` |
| Session, `role = coach` | `/` → redirect `/dashboard` |

### Route table

| Route | Component | Access |
|-------|-----------|--------|
| `/` | `LandingPage` / redirect | — |
| `/login` | `LoginPage` | Unauthenticated only |
| `/register` | `RegistrationPage` | Unauthenticated only |
| `/tracker` | `TrackerApp` | `athlete`, `self_coached` |
| `/dashboard/*` | `DashboardApp` | `coach` |
| `/workout/*` | `WorkoutApp` | All authenticated |

`AppRouter.tsx` changes:
- `/` checks session: null → `LandingPage`, present → role-based redirect
- Add `/tracker` route (TrackerApp was previously at `/`)
- Add `/login` and `/register` routes (unauthenticated guard)

---

## 3. Coaching Relationship Constraints

### Rules

| Rule | Enforcement |
|------|-------------|
| An athlete can have at most **one** active coach | DB partial unique index |
| A **coach** cannot be an athlete (under any other coach) | FastAPI validation |
| A **self_coached** user cannot be coached | FastAPI validation |
| Only `role = 'athlete'` can be added as an athlete | FastAPI validation |

### DB constraint — one active coach per athlete

```sql
CREATE UNIQUE INDEX idx_one_active_coach_per_athlete
  ON coach_athletes (athlete_id)
  WHERE status = 'active';
```

This replaces the previous unconstrained model. Attempting to add a second active coach for the same athlete will fail at DB level with a unique violation.

### FastAPI validation — role check before insert

```python
athlete_profile = fetch profiles where id = athlete_id
if athlete_profile.role != 'athlete':
    raise HTTP 400 "Only users with role 'athlete' can be added as athletes"
```

This also implicitly blocks coaches from being coached and self-coached users from being coached.

---

## 4. Registration Flow

### 4a. Email duplicate check (both flows)

Before showing the registration form, check if the email already exists:

```
User enters email in Step 0
  → POST /auth/check-email { email }
  → If exists: show "You already have an account. Sign in instead." with /login link
  → If not: proceed to password step
```

Supabase `signUp` also returns an error if the email exists — treat it as a fallback catch.

### 4b. Direct registration (from landing page)

```
1. Landing page → "Choose Plan" → /register?plan=coach_pro
2. Step 0 — email + duplicate check + password
3. Steps 1–3 — onboarding (BODY / FUEL / DRIVE, see Section 5)
4. Submit:
   a. Supabase signUp(email, password)
      → DB trigger creates bare profiles row (id, email)
   b. POST /auth/complete-registration (service role):
        - sets plan, role, ai_enabled (derived from plan param)
        - sets all profile fields from BODY step
        - inserts/updates athlete_preferences row (FUEL step)
   c. Redirect: /tracker (athlete/self_coached) or /dashboard (coach)
```

### 4c. Invite-based registration

```
1. Coach sends invite → athlete receives email
2. Athlete opens /register?invite=<token>
3. Frontend: GET /invitations/:token
   → If expired/invalid: show error, link to /register for fresh signup
   → If valid: pre-fill email (readonly), show "Invited by {coach_name}"
4. No plan selection — plan = 'self_coached', role = 'athlete' (forced server-side)
5. Steps 0–3 — same as direct (email readonly, no plan badge)
6. Submit:
   a. Supabase signUp
   b. POST /auth/complete-registration:
        - plan = 'self_coached', role = 'athlete', ai_enabled = false
        - profile + preferences from onboarding
        - INSERT coach_athletes { coach_id: invite.coach_id, athlete_id: new_user.id, status: 'active' }
        - UPDATE invitations SET status = 'accepted' WHERE token = :token
   c. Redirect to /tracker
```

### 4d. Existing user receiving an invite

If the user visiting `/register?invite=<token>` is already logged in:

```
→ Skip registration form entirely
→ Show: "Accept coaching invitation from {coach_name}?"  [Accept] [Decline]
→ Accept: POST /invitations/accept { token }
    - validates token not expired, invitee_email matches current user
    - validates current user.role == 'athlete' (rejects coaches and self_coached)
    - INSERT coach_athletes row
    - marks invitation accepted
→ Redirect to /tracker
```

---

## 5. Onboarding Form — BODY / FUEL / DRIVE

### Design constraints

- Target: **< 60 seconds** to complete all 3 steps
- **No typing** except email and password — sliders, segmented buttons, chip multi-selects only
- Progress indicator: 3 steps (not counting account step)
- Each step fits one screen without scrolling on mobile (375px)
- Unit system auto-detected from height/weight toggle — no separate question

---

### Step 0 — Account

```
Email            [text input]  → duplicate check on blur
Password         [password input, min 8 chars]
```

---

### Step 1 — BODY *(baseline math)*

> Feeds: TDEE calculation, macro target generation, initial weight baseline

```
Sex              [Male] [Female] [Other]           — segmented button, required
Date of birth    [DD/MM/YYYY]  or  [Age: __ years]  — single field, tap to toggle format
Height           [slider + numeric display]  [cm | ft]  — unit toggle auto-sets unit_system
Current weight   [slider + numeric display]  [kg | lbs]

Primary goal     [Lose fat] [Recomp] [Build muscle] [Maintain]  — segmented, required

Goal rate        [●————] Conservative → Moderate → Aggressive   — optional slider
                 (hidden by default, tap "Set intensity" to reveal)
                 Default: moderate
```

**Goal rate** maps to caloric deficit/surplus:
- Conservative: −10% / +5% TDEE
- Moderate: −20% / +10% TDEE
- Aggressive: −30% / +20% TDEE

Recomp and Maintain ignore goal rate (TDEE = maintenance).

**Schema fields populated:**
`profiles.gender`, `profiles.dob` (→ `age` computed), `profiles.height`,
`profiles.initial_weight`, `profiles.unit_system`, `profiles.goal`, `profiles.goal_rate`

---

### Step 2 — FUEL *(plan adherence)*

> Feeds: meal plan generation, food swap safety, AI diet constraints

```
Diet framework   [Omnivore] [Pescatarian] [Vegetarian] [Vegan]  — segmented, required

Meals per day    [3] [4] [5+]  — segmented buttons, required

Hard no's        Multi-select chips (tap to toggle):
                 [Lactose] [Gluten] [Nuts] [Fish] [Eggs] [Shellfish] [Soy] [None]
                 — required (must tap at least one, including "None")
```

**Schema fields populated:**
`athlete_preferences.diet_framework`, `athlete_preferences.meal_frequency`,
`athlete_preferences.allergies[]`, `athlete_preferences.intolerances[]`

---

### Step 3 — DRIVE *(activity & volume)*

> Feeds: TDEE activity multiplier, initial training volume, weekly plan structure

```
Lifestyle activity   [Desk job / light movement]
(NEAT level)         [Light: walks, errands]
                     [Moderate: physical job or regular sport]
                     [Very active: manual labour or 2× training/day]
                     — segmented with one-line descriptions, required

Gym days / week      [2] [3] [4] [5] [6]  — segmented buttons, required
                     (0/1 not offered — minimum viable training plan)
```

**TDEE multipliers** (Mifflin-St Jeor, standard factors):
- Desk: ×1.2
- Light: ×1.375
- Moderate: ×1.55
- Very active: ×1.725

**Schema fields populated:**
`profiles.activity_level`, `profiles.gym_days_per_week`

---

### What day-1 output this enables

With BODY + FUEL + DRIVE collected, the backend can immediately compute:
- **Baseline TDEE** (Mifflin-St Jeor × activity multiplier)
- **Macro targets** (protein: 2.0–2.4g/kg, fat: 25–30% kcal, carbs: remainder)
- **Initial daily_log defaults** (calorie target, macro split, steps goal)
- **AI diet suggestion context** (goal direction, deficit size, excluded foods, meal count)
- **Initial training volume** (gym days/week × experience-appropriate sets)

---

## 6. Deferred Data Collection

Collected progressively — never at registration. Each field has a specific trigger in the app.

### BODY — refinement

| Field | When prompted | Table |
|-------|--------------|-------|
| Body fat % | Stats tab, after 2 weeks of weight logs | `profiles` (add column) |
| Waist / chest / arms measurements | Dedicated measurements log (new feature) | new table |
| Metabolic adaptation | Inferred from 14-day weight trend vs calorie logs | Computed, not stored directly |

### FUEL — personalisation

| Field | When prompted | Table |
|-------|--------------|-------|
| Food preferences / dislikes | Diet tab, first meal plan view | `athlete_preferences` |
| Cuisine preferences | Diet tab, first meal plan view | `athlete_preferences` |
| Cooking skill | Diet settings | `athlete_preferences` |
| Meal prep time | Diet settings | `athlete_preferences` |
| Budget level | Diet settings | `athlete_preferences` |
| Fasting windows | Settings → Nutrition | `athlete_preferences` |
| Digestion triggers | Learned from EOD log "digestion" field over time | Inferred |

### DRIVE — programme quality

| Field | When prompted | Table |
|-------|--------------|-------|
| Training experience level | Workout app, first session | new `athlete_training_profile` |
| Equipment access | Workout app, programme selection | new `athlete_training_profile` |
| Training split preference | Workout app, programme setup | new `athlete_training_profile` |
| Weak points / focus areas | Workout app, programme setup | new `athlete_training_profile` |
| Strength baseline (1RM-ish) | Dedicated "Training Setup" module | new table |
| Injury / movement restrictions | Workout app, programme selection | new `athlete_training_profile` |
| Competition dates | Goals tab | `athlete_goals` |

---

## 7. Invitation System

### New table

```sql
CREATE TABLE public.invitations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  token         UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own invitations"
  ON invitations FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_coach ON invitations(coach_id, status);
```

### API endpoints

```
POST /invitations/send
  auth: coach only
  body: { athlete_email: string }
  - validates coach has not exceeded athlete limit (active + pending count)
  - creates invitation row
  - sends email via Supabase Auth built-in SMTP
  - returns { invitation_id, expires_at }

GET /invitations/:token
  auth: none (token is the credential)
  - auto-expires if expires_at < NOW() (sets status = 'expired')
  - returns { coach_name, invitee_email, status, expires_at }
  - 404 if not found, 410 if expired/cancelled/accepted

GET /invitations
  auth: coach only
  - returns coach's invitations (all statuses)
  - used in dashboard "Pending Invites" panel

DELETE /invitations/:id
  auth: coach only (must own invitation)
  - sets status = 'cancelled'

POST /invitations/accept
  auth: authenticated user (existing account path)
  body: { token: string }
  - validates token not expired
  - validates invitee_email matches current user's email
  - validates current user.role == 'athlete'
  - INSERT coach_athletes row
  - marks invitation accepted
```

### Email (Supabase built-in SMTP)

Subject: `{coach_name} invited you to Leonida`

```
Hi,

{coach_name} has invited you to join Leonida as their athlete.

[Accept Invitation]
https://app.leonida.com/register?invite={token}

This link expires in 7 days.
If you already have an account, open the link while signed in to accept directly.
```

### Expiry cron

```sql
-- Run daily via Supabase pg_cron:
UPDATE invitations
SET status = 'expired'
WHERE status = 'pending' AND expires_at < NOW();
```

---

## 8. Schema Summary

| Change | Type | Migration |
|--------|------|-----------|
| `profiles.plan` | New column | Add with default `'self_coached'` |
| `profiles.ai_enabled` | New column | Add with default `false` |
| `profiles.dob` | New column | Add nullable; backfill not possible for existing rows |
| `profiles.goal_rate` | New column | Add with default `'moderate'` |
| `profiles.gym_days_per_week` | New column | Add nullable |
| `profiles.age` | Keep, computed from dob | Add trigger to recompute on profile write |
| `athlete_preferences.diet_framework` | New column | Add with default `'omnivore'` |
| `athlete_preferences.meal_frequency` | New column | Add with default `3` |
| `coach_athletes` — one-coach index | New partial unique index | `CREATE UNIQUE INDEX ... WHERE status='active'` |
| `invitations` | New table | Create fresh |

---

## 9. Open Questions

- **Landing page copy and design:** Design spec pending (separate MD file incoming).
- **`dob` backfill:** Existing users have `age INTEGER` but no `dob`. On first login after migration, prompt them to confirm date of birth (one-time in-app prompt, not a blocker).
- **Invite for coach-role user:** Currently rejected (`role != 'athlete'`). Decide whether a coach ever needs to accept a coaching relationship in future (e.g., for accountability purposes) — out of scope for now.
