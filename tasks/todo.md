# Onboarding Feature — Task List

Spec: `docs/features/plans-onboarding.md` | Design: `docs/features/DESIGN.md`

---

## Phase 1 — Foundation

- [ ] **1.1** Install fonts: `@fontsource/newsreader`, `@fontsource-variable/source-serif-4`, `@fontsource/jetbrains-mono`
- [ ] **1.2** Extend Tailwind theme — `fontFamily` for `display`, `body`, `mono` (manifesto fonts, public pages only)
- [ ] **1.3** Add `AuthContext` session check + role-based redirect logic to `AppRouter.tsx`
  - No session → render `LandingPage`
  - `athlete` / `self_coached` → redirect `/tracker`
  - `coach` → redirect `/dashboard`
- [ ] **1.4** Add routes: `/login` → `LoginPage`, `/register` → `RegistrationPage`, `/tracker` explicit route (TrackerApp moves off `/*`)
- [ ] **1.5** Add `UnauthenticatedOnly` guard (redirect to role-based home if session exists)

---

## Phase 2 — Landing Page (`/`)

- [ ] **2.1** Create `src/apps/public/LandingPage.tsx` skeleton (section stubs + sticky nav)
- [ ] **2.2** Sticky Nav — transparent → glassmorphism on 80px scroll, `[SIGN IN]` ghost + `[GET STARTED]` primary
- [ ] **2.3** Section 1 — Hero: black gradient, oversized right-aligned LEONIDA, asymmetric 60/40 grid, manifesto lines, two CTAs, 4px white rules
- [ ] **2.4** Section 2 — The Method: 3-column editorial (01/02/03 with Leonida Red accent rule)
- [ ] **2.5** Section 3 — Plans: 4 plan cards with tonal stacking, feature rows (✓/✗), top accent rule per plan
- [ ] **2.6** Section 4 — Pull Quote: full-bleed black, right-aligned display text, last line in Leonida Red
- [ ] **2.7** Section 5 — Footer: LEONIDA wordmark, SIGN IN link, minimal nav links

---

## Phase 3 — Registration (`/register`)

- [ ] **3.1** Create `src/apps/public/RegistrationPage.tsx` — layout, wordmark, 4px rule, step state machine
- [ ] **3.2** Step indicator — horizontal rule (filled / active dot / upcoming dots) with ACCOUNT / BODY / FUEL / DRIVE labels
- [ ] **3.3** Plan badge (`?plan=` param) and invite badge (`?invite=` param) — shown below wordmark
- [ ] **3.4** Step 0 — Account: email input + `/auth/check-email` duplicate check on blur, password input, `[CONTINUE →]`
- [ ] **3.5** Step 1 — BODY: sex segmented buttons, DOB bottom-rule input (age auto-display), height/weight sliders (black square thumb, unit toggle), goal segmented, intensity slider (collapsed by default)
- [ ] **3.6** Step 2 — FUEL: diet framework segmented, meals/day segmented, hard no's chip multi-select (NONE pre-selected, auto-deselects on allergen tap)
- [ ] **3.7** Step 3 — DRIVE: lifestyle activity full-width selectable rows, gym days/week segmented, `[FINISH →]` in Leonida Red
- [ ] **3.8** Completion state — animated scanning rule (Leonida Red, left→right), `BUILDING YOUR PLAN` headline, redirect on done
- [ ] **3.9** Invite flow: `GET /invitations/:token` on mount when `?invite=` present — prefill email (readonly), show "INVITED BY {name}", handle expired/invalid token
- [ ] **3.10** Existing user invite acceptance: if session exists + `?invite=` param → skip form, show Accept/Decline UI → `POST /invitations/accept`

---

## Phase 4 — Login (`/login`)

- [ ] **4.1** Create `src/apps/public/LoginPage.tsx` — wordmark, 4px rule, `WELCOME BACK`, email + password bottom-rule inputs, `[SIGN IN →]`, link to `/`
- [ ] **4.2** Wire Supabase `signInWithPassword` + error state (Leonida Red bottom rule on input)

---

## Phase 5 — Backend (FastAPI)

- [ ] **5.1** Schema migration SQL — run via Supabase dashboard:
  - `profiles`: add `plan`, `ai_enabled`, `dob`, `goal_rate`, `gym_days_per_week`
  - `athlete_preferences`: add `diet_framework`, `meal_frequency`
  - `coach_athletes`: add partial unique index `WHERE status='active'`
  - Create `invitations` table (full DDL in spec)
  - Add DOB→age recompute trigger
- [ ] **5.2** `POST /auth/check-email` — returns `{ exists: bool }`
- [ ] **5.3** `POST /auth/complete-registration` — sets plan/role/ai_enabled, writes profile + athlete_preferences, handles invite linking
- [ ] **5.4** `POST /invitations/send` — coach only, creates invitation row, sends email via Supabase SMTP
- [ ] **5.5** `GET /invitations/:token` — public, returns coach name + status, auto-expires
- [ ] **5.6** `GET /invitations` — coach only, returns all coach's invitations
- [ ] **5.7** `DELETE /invitations/:id` — coach only, sets status = 'cancelled'
- [ ] **5.8** `POST /invitations/accept` — authenticated, validates token + role, inserts coach_athletes row

---

## Phase 6 — Wiring & Cleanup

- [ ] **6.1** Update `src/core/types/database.ts` — add new profile columns, invitations table type
- [ ] **6.2** Remove auth gate from `TrackerApp.tsx` (auth is now handled at router level)
- [ ] **6.3** Remove `src/apps/tracker/components/Auth.tsx` (replaced by `LoginPage`)
- [ ] **6.4** Verify existing `Onboarding.tsx` — deprecate or repurpose (new onboarding is in RegistrationPage)
- [ ] **6.5** Smoke test full flow: landing → plan select → register → BODY/FUEL/DRIVE → redirect to /tracker

---

## Review Section

_To be filled after implementation._
