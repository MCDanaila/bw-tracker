# Diet Planner Feature Brainstorm
**bw-tracker** — Comprehensive Research & Design

**Date:** March 25, 2026
**Scope:** Research phase — concept development, NOT implementation

---

## 1. FEATURE SCOPE & CAPABILITIES

### 1.1 Core Functionality

The diet planner should intelligently **suggest, generate, and optimize** meal plans based on athlete data and coach preferences.

#### What Should It Suggest?

**Level 1: Macro-Level Suggestions**
- Daily calorie/macro targets (protein, carbs, fats)
- Weekly macro distribution across all 7 days
- Macro cycling (high-carb training days, lower-carb rest days)
- Phase-specific guidance (bulk: +500 kcal surplus, cut: -500 kcal deficit, maintenance, reverse diet)

**Level 2: Meal Structure**
- Number of meals per day (e.g., 4–6 smaller meals vs. 3 large meals)
- Meal timing (relative to training)
- Approximate quantity per meal to hit daily totals

**Level 3: Individual Meal Suggestions**
- Specific foods to include (breakfast, snacks, post-workout meals, etc.)
- Portion sizes (in grams/ml, calculated to match macros)
- Food variety (avoid repetition; suggest seasonal/available options)
- Cultural/cuisine preferences (Italian athlete: focus on pasta, Italian ingredients, seasonality)

**Level 4: Advanced Suggestions**
- Food swaps (given current meal, suggest alternatives that fit the same macros)
- Grocery lists (aggregated foods from planned meals, organized by store section)
- Recipe scaffolding (meal name + foods + portions → suggest simple prep method or timing notes)

**Level 5: Adherence & Learning**
- Feedback loop: athlete logs actual adherence → planner learns what they'll actually eat
- Identify "high-adherence" vs. "low-adherence" foods per athlete
- Suggest only foods with proven adherence history

---

### 1.2 Integration with Existing Diet Tab

**Current State:**
- Tracker app: `DietView` displays weekly meal plan (read-only), daily meal selection, weekly overview with macro summaries
- Dashboard: `DietEditorPage` allows coaches to manage diet templates (reusable meal structures)
- Database: `meal_plans` table (1 row per meal per day), `diet_templates` + `diet_template_items` (coach-managed blueprints)
- Existing meal adherence tracking: `meal_adherence` table (which meals eaten, optional swaps)

**How Planner Fits:**
1. **Generation Flow:** Planner suggests → coach reviews → applies as template or direct meal plan
2. **Edit Flow:** After planner suggests, coach can manually tweak macros, foods, portions
3. **Suggestion History:** Track which suggestions were used vs. ignored → improve future suggestions
4. **Version Control:** Old meal plans remain visible in history; new ones replace them when applied

---

### 1.3 Personalization Factors

The planner needs to understand each athlete's unique profile:

**Demographic & Anthropometric:**
- Gender, age, height, weight, body composition (if available)
- Activity level (sedentary, light, moderate, very active, athlete)
- Target weight and timeframe to reach it

**Nutritional Goals:**
- Primary goal (`goal` field in `profiles` table)
  - Muscle gain (bulk): +200–500 kcal surplus, high protein
  - Fat loss (cut): −300–500 kcal deficit, preserve protein
  - Performance: sport-specific periodization (e.g., carb-loading before competition)
  - Maintenance: balance
  - General health: moderate calorie control
- Phase from `athlete_goals` table: `bulk`, `cut`, `maintenance`, `reverse_diet`
- Macro targets from `athlete_goals` (target_calories, target_protein, target_carbs, target_fats)

**Dietary Restrictions & Preferences:**
- Allergies/intolerances (e.g., lactose, gluten, shellfish, tree nuts)
- Dietary restrictions (vegetarian, vegan, kosher, halal, religious fasting)
- Food dislikes (foods the athlete refuses or avoids)
- Food likes (preferred foods, cuisines, textures)
- Eating schedule preferences (e.g., "no breakfast, snack-based", "3 meals + 1 snack", "pre-cooked meal prep")

**Training-Related:**
- Training schedule (workout days, rest days, low-activity days)
- Sport/modality (strength training, endurance, mixed sport, team sport)
- Workout timing (morning fasted, mid-day, evening)
- Session intensity/duration (HIIT, LISS, heavy strength, conditioning)
- Peak competition dates (need for peaking nutrition strategies)

**Biofeedback & Performance History:**
- Recent weight trend (gaining/losing/stable)
- Sleep quality/duration (affects recovery and appetite)
- Stress level (affects hunger and digestion)
- Subjective energy and hunger (guides calorie sufficiency)
- Digestion quality (some foods may cause bloating, issues)
- Training performance trends (strength gains, speed, endurance)

**Food Database Context:**
- Foods already in database (limited to available foods)
- Food macro accuracy/reliability (some sources more trustworthy)
- Food availability by season (Italian athlete: focus on seasonal produce)
- Food cost/accessibility (e.g., expensive vs. budget-friendly)

---

### 1.4 Time Horizons

**Micro-Level (Daily):**
- Daily calorie/macro targets
- Single-day meal plan (breakfast, lunch, dinner, snacks)
- Estimated adherence difficulty (rate it 1–5 stars, "Will this athlete actually eat this?")

**Week-Level (7 days):**
- Weekly meal plan (7 × meal_plans rows, one per day-of-week slot)
- Weekly macro distribution (some days high-carb, some lower-carb)
- Grocery list for the week (all foods needed)
- Periodization notes (e.g., "Higher carbs Mon/Wed/Fri training days")

**Cycle-Level (4 weeks / 28 days):**
- Progressive calorie/macro adjustments (e.g., "Week 1: 2500 kcal, Week 4: 2400 kcal" for a cut)
- Food rotation (vary meals every week or two; avoid monotony)
- Adaptation strategy (if not losing weight after 2 weeks, reduce calories by 100)
- Periodization with training block (e.g., high-volume phase needs more carbs)

**Seasonal / Long-Term:**
- Phase-based nutrition (bulk season Oct–Feb, cut Feb–June, maintenance June–Sept for typical bodybuilder)
- Life events (vacation, holidays, competitions)
- Macro progression (as athlete gains muscle, needs increase)

---

## 2. ATHLETE INPUTS NEEDED

### 2.1 Goal & Preference Questionnaire

**Primary Goal** (required)
- [ ] Build muscle (bulk)
- [ ] Lose fat (cut)
- [ ] Improve performance
- [ ] Maintain (no change)
- [ ] General health

**Current Metrics** (required)
- Weight (kg)
- Height (cm)
- Gender (for calorie estimation formulas)
- Age
- Activity level (sedentary / light / moderate / active / very active / athlete)

**Target Metrics** (required)
- Target weight (kg)
- Target timeframe (e.g., "3 months")
- Desired body composition change (muscle gain, fat loss, or combination)

---

### 2.2 Dietary Restrictions & Preferences

**Hard Constraints (show as filters in food selection):**
- Allergies: checkboxes for common (peanuts, tree nuts, shellfish, eggs, dairy, gluten, soy, etc.) + free-text
- Intolerances: checkboxes (lactose, FODMAP, histamine) + free-text
- Dietary philosophy: buttons (omnivore / vegetarian / vegan / pescatarian / other)
- Religious/cultural: checkboxes (kosher, halal, Hindu, etc.)

**Soft Preferences (guide but don't block):**
- Dislikes: text input or tag list (e.g., "liver, Brussels sprouts, fish oil")
- Likes: text input or tag list (e.g., "chicken, rice, pasta, olive oil, berries")
- Cuisines preferred: checkboxes (Italian, Asian, Mediterranean, etc.)
- Meal prep style: single-choice (full-cooked, quick raw, snack-based, pre-made)

**Eating Behavior:**
- Meal frequency preference: radio (3 meals, 4 meals, 5+ meals per day)
- Breakfast? Yes/No (or "light breakfast only")
- Pre-sleep snack? Yes/No
- Eating window (e.g., "7 AM – 8 PM only", "no fasting")

---

### 2.3 Training & Performance

**Training Schedule:**
- Days per week training
- Primary modality (strength/hypertrophy, endurance, mixed, sport-specific)
- Typical session duration (minutes)
- Intensity (RPE scale 1–10)
- Peak performance dates or competition schedule

**Recent Performance:**
- Subjective energy levels (1–10)
- Subjective hunger (1–10)
- Sleep quality & quantity
- Training performance trend (PRs, fatigue)

---

### 2.3 Optional Medical/Specialized**

- GI sensitivity (bloating, digestion issues)
- Blood glucose management (for diabetic/pre-diabetic athletes)
- Food cost constraints ("budget: $X/week")
- Cooking equipment available (microwave only, full kitchen, etc.)

---

## 3. COACH INPUTS & CONTROLS

### 3.1 Macro Targets & Periodization

**Set Per-Athlete Macro Targets:**
- Season or phase start date (e.g., "Bulk Phase: Jan 1 – May 31")
- Phase type: `bulk`, `cut`, `maintenance`, `reverse_diet`
- Target macros:
  - Total calories (absolute kcal/day)
  - Protein (absolute grams or per-lb LBM)
  - Carbs (absolute grams or as % of total calories)
  - Fats (absolute grams, minimum ~20% for hormone health)
- Optional: daily variation (e.g., high-carb on training days, low-carb on rest days)
- Optional: weekly taper (e.g., cut 100 kcal every 2 weeks)

**Macro Calculation Options:**
1. Coach enters targets manually
2. Planner calculates from goal + metrics (Mifflin-St Jeor TDEE + activity multiplier, then ±deficit/surplus)
3. Planner suggests targets based on phase + bodyweight + LBM (if available)

---

### 3.2 Suggestion Review & Approval

**Planner Output Workflow:**
1. Coach requests meal plan (for athlete, for date range)
2. Planner generates 3–5 options (e.g., "High-carb option", "Balanced option", "Flexible snack-based option")
3. Coach reviews each:
   - Macro summary (total kcal, P/C/F breakdown, vs. target)
   - Food list (familiar? appropriate? quality?)
   - Estimated adherence (planner's confidence, based on athlete's history)
   - Estimated prep time
4. Coach selects one option → applies to athlete's meal plan
5. Optionally, coach modifies before applying (swap food, adjust portion, add/remove meal)

**Approval Criteria:**
- Macros hit target ±5% (default tolerance)
- All foods exist in database
- All foods match athlete's restrictions
- No repeated foods >2 days per week (unless athlete chose that)
- Estimated adherence >70% (if lower, flag it)

---

### 3.3 Manual Override & Customization

**Coach Always Retains Control:**
- Edit any suggested meal (food, portion, meal name)
- Delete/add meals manually
- Lock certain foods (e.g., "always include 150g chicken breast in lunch" for consistency)
- Add custom notes (e.g., "Prep in bulk on Sunday, divide into 5 portions")
- Apply template to multiple athletes at once

---

### 3.4 Tracking What Works

**Feedback Loop:**
- Coach views athlete's adherence history: which meals were eaten, which were skipped, which were swapped
- Planner learns: "This athlete always eats grilled chicken (90% adherence) but never eats boiled eggs (20% adherence)"
- Future suggestions prioritize high-adherence foods for that athlete

**Metrics Coach Wants:**
- Weekly adherence % (meals eaten vs. suggested)
- Which foods are "sticky" (high adherence)
- Which foods are "rejected" (low adherence)
- Weight trend relative to plan (is the macro target working?)
- Plate photos (future integration: coach can assess real portions)

---

### 3.5 Bulk Operations

**Multi-Athlete Management:**
- "Apply [template] to all athletes in [cohort]"
- "Schedule [meal plan] for [athlete group] starting [date]"
- "Adjust macro targets for all cut-phase athletes by −50 kcal"
- "Export grocery list for all athletes for next week"

---

### 3.6 AI Model & Prompt Tuning

**Coach-Controllable Parameters:**
- Diversity level: "Prefer new foods each week" vs. "Repeat proven foods"
- Complexity level: "Simple 3-ingredient meals" vs. "Restaurant-quality recipes"
- Variety window: "Change meals every week" vs. "Change every 2 weeks"
- Confidence threshold: Only suggest foods with >70% estimated adherence (adjustable by coach)

**Hallucination Guards (Coach Oversight):**
- Planner can ONLY suggest foods from the database (no fictional foods)
- Portion sizes must be realistic (flag if >500g in a single meal)
- Calorie targets must stay within ±10% of athlete's goal
- Protein:energy ratio must be healthy (>1g per 10 kcal for most goals)

---

## 4. FEATURE VARIATIONS

### 4.1 "Quick Suggestion" (MVP)
**Use Case:** Coach needs to generate a meal for today in <30 seconds.

**Inputs:**
- Athlete ID
- Target macros (pre-filled from `athlete_goals`)
- Meal type (breakfast, lunch, dinner, snack)
- Optional: dietary preference (e.g., "only already-eaten foods")

**Output:**
- Single meal suggestion (3–4 foods, portions, total macros)
- Coach can apply or regenerate

**Complexity:** Low
**Time to Implement:** 1–2 weeks (simple API call to LLM)

---

### 4.2 "Meal Planning Wizard" (Phase 2)
**Use Case:** Coach builds a full week meal plan interactively, step-by-step.

**Flow:**
1. Select date range (start of week, or custom dates)
2. Review/confirm athlete macro targets
3. For each day:
   - Wizard suggests meal structure ("breakfast 400 kcal, lunch 700, dinner 900, snacks 300")
   - Coach confirms or adjusts
   - Wizard generates 3 meal options per slot
   - Coach selects, or modifies
   - Loop back to next day
4. Review full week summary (macro balance, variety, foods)
5. Apply or save as draft

**Complexity:** Medium
**Time to Implement:** 3–4 weeks (workflow, multiple suggestion screens, review panel)

---

### 4.3 "Macro Calculator" (Low Priority)
**Use Case:** Coach or athlete wants to manually assemble a meal and check macros in real-time.

**Inputs:**
- Select foods from database
- Enter quantities
- Real-time macro calculation (uses `calculateItemMacros` from existing code)

**Output:**
- Total macros for the meal
- Visual indicator: "123 kcal, 15g P, 12g C, 4g F" with % toward daily target
- Suggestion: "Add 50g chicken to hit protein target"

**Complexity:** Low
**Time to Implement:** 1–2 weeks (mostly UI, leverages existing macro calc logic)

---

### 4.4 "Food Swap Recommender" (Already Exists, Enhance)
**Current State:** `SwapPreviewModal` in tracker app. Given a food in a meal, suggest alternatives that match macros.

**Enhancement Ideas:**
- Coach applies swap suggestions to meal plan for next week
- Planner tracks: "Athlete can swap chicken ↔ lean beef ↔ turkey, but not fish"
- Seasonal swap suggestions (e.g., "Winter: use frozen broccoli instead of fresh")

**Complexity:** Low (mostly extending existing swap algorithm)
**Time to Implement:** 1–2 weeks

---

### 4.5 "Grocery List Generator" (Phase 2)
**Use Case:** Coach generates a shopping list for athlete (or for meal prep service).

**Inputs:**
- Date range (week, or custom)
- Format preference (simple list, by store section, by supplier)

**Output:**
- Aggregated foods from all planned meals for that period
- Quantities (e.g., "2 kg chicken breast, 1 kg rice, 0.5 kg broccoli")
- Estimated cost (if food costs tracked in DB)
- Optional: shopping-list app export (note app, PDF, CSV)
- Optional: supplier integration (e.g., link to local Italian grocery, meal-prep service)

**Complexity:** Medium
**Time to Implement:** 2–3 weeks

---

## 5. QUALITY & ACCEPTANCE CRITERIA

### 5.1 What Makes a "Good" Suggestion?

**Macro Accuracy:**
- Total calories within ±5% of target (e.g., target 2500 kcal → suggest 2375–2625)
- Protein within ±10% of target (flexibility for carbs/fats within total calories)
- No suggestion violates athlete's hard constraints (allergies, dietary style)

**Variety & Adherence:**
- No food repeats on consecutive days (exception: if athlete chose it)
- No more than 2 repeats per week from the same "food category" (e.g., chicken 2 days, rice 2 days, but not 3x)
- Foods chosen are high-adherence for that athlete (based on history)
- Meal structure matches athlete's eating preference (e.g., if "4 meals/day", suggest 4 meals, not 3)

**Realism:**
- All foods exist in the database
- Portions are realistic (no 800g chicken breast in a single meal; max ~250g)
- Prep time matches kitchen capability (raw ingredients only if athlete has full kitchen; simple reheating if microwave-only)
- Cost within budget (if specified)

**Personalization:**
- Respects dietary restrictions (zero instances of forbidden foods)
- Respects food preferences (mostly includes liked foods, avoids strongly disliked foods)
- Considers athlete's training (high-carb on training days if relevant)
- Aligns with cultural/language preference (Italian athlete → Italian ingredient names, Italian recipes)

---

### 5.2 Feedback Loop & Learning

**What the Planner Should Track:**
1. **Adherence Rate:** For each suggested meal, did the athlete eat it?
   - Source: `meal_adherence` table, with `is_completed` flag
   - Metric: "% of suggested meals actually eaten"
2. **Food-Level Adherence:** Which foods does this athlete actually eat?
   - Aggregated from meal adherence history
   - Metric: "Grilled chicken: 85% adherence, Boiled eggs: 20% adherence"
3. **Weight Trend vs. Macro Goal:** Is the suggested macro target working?
   - Source: `daily_logs` table (weight), `athlete_goals` (target macros)
   - Metric: "Cut plan with 2300 kcal: lost 0.5 kg/week (on track)" vs. "lost 0.2 kg/week (adjust down)"
4. **Digestion Quality:** Did the foods cause issues?
   - Source: `daily_logs.digestion_rating`, `digestion_comments`
   - Flag: "Athlete reports bloating after this food; suggest alternative"

**Adaptive Tuning:**
- Every 2–4 weeks, planner should re-evaluate:
  - Does athlete's weight match goal pace? (Adjust calories if not)
  - Which foods have >75% adherence? (Prefer these)
  - Which foods have <40% adherence? (Deprioritize or replace)
  - Has adherence quality changed? (May need simpler meals, or can handle more complexity)

**Coach Touchpoints:**
- Weekly: "Your current macro target is on pace; no adjustment needed" OR "Weight loss is slow; consider −100 kcal"
- Monthly: "Adherence is 92% — most suggested foods are sticking" OR "Adherence is 65% — try simpler meals next week"
- Quarterly: "Adapt phase: current plan achieved goal; moving to maintenance phase"

---

### 5.3 Hallucination Guards

**Prevent Fictional Foods:**
- Whitelist: Planner can ONLY suggest foods that exist in `foods` table
- Validation: Before returning suggestion, cross-check every food_id against DB
- Error handling: If a food is deleted mid-plan, mark meal as "food unavailable" and suggest alternative

**Prevent Unrealistic Portions:**
- Min portion: 10g (for oils, supplements)
- Max portion: 500g per meal (flag if exceeded)
- Realistic ratio: Calories should scale linearly with portion (sanity check)

**Prevent Bad Macros:**
- Protein:kcal ratio: Minimum 1g per 10 kcal (for most athletes; coaches can override)
- Fat minimum: At least 20% of calories (for hormone health)
- Carb-timing: High-carb meals should align with training time (not sleep)

**Prevent Constraint Violations:**
- Hard constraint check: NEVER suggest foods on athlete's allergy/intolerance list
- Dietary check: NEVER suggest meat for vegan athlete, etc.
- Frequency check: NEVER suggest same food >3 days per week (default; coach can customize)

**Coach Review Gatekeeping:**
- All suggestions must be reviewed by coach before showing to athlete
- Coach explicitly approves or modifies before it appears in athlete's meal plan
- Audit trail: log which suggestions were used vs. ignored (for continuous improvement)

---

## 6. TECHNICAL INTEGRATION POINTS

### 6.1 Database Schema Changes (Minimal)

**Suggested New Tables (if not already present):**

1. **`planner_suggestions`** (optional, for audit trail)
   ```
   id UUID PRIMARY KEY
   athlete_id UUID → profiles
   generated_at TIMESTAMPTZ
   suggestion_type TEXT ('quick_meal', 'weekly_plan', 'food_swap')
   macro_targets JSONB {kcal, protein, carbs, fats}
   suggested_meals JSONB [{ meal_name, foods: [{id, quantity}], macros }]
   applied_by UUID → auth.users (NULL if ignored)
   applied_at TIMESTAMPTZ (NULL if ignored)
   feedback TEXT (coach notes after reviewing)
   ```

2. **`athlete_food_preferences`** (optional, for learning)
   ```
   id UUID PRIMARY KEY
   athlete_id UUID → profiles
   food_id TEXT → foods
   adherence_rate NUMERIC (0–1)
   last_eaten DATE
   notes TEXT (e.g., "causes bloating")
   ```

3. **`macro_target_history`** (for periodization)
   ```
   id UUID PRIMARY KEY
   athlete_id UUID → profiles
   set_by UUID → auth.users (coach)
   target_calories INTEGER
   target_protein INTEGER
   target_carbs INTEGER
   target_fats INTEGER
   effective_from DATE
   effective_until DATE (NULL if current)
   ```
   *Note: `athlete_goals` may already cover this; check before creating.*

**Alternatively, Use Existing Tables:**
- `athlete_goals` already has macro targets and phase tracking → use this as source of truth
- `meal_adherence` already tracks what was eaten → use for feedback loop
- `meal_plans` is the output table (coach creates rows here after approving suggestions)

---

### 6.2 API/Backend Requirements

**LLM Integration (Claude API or similar):**
- Prompt template for meal suggestions
- Structured output parsing (convert JSON response to meal objects)
- Error handling (malformed LLM output, hallucinated foods)

**Macro Calculation:**
- Leverage existing `calculateItemMacros()` function (in `src/core/lib/mealMacros.ts`)
- Leverage existing `calculateSwap()` function (in `src/core/lib/swapAlgorithm.ts`)

**Database Queries:**
- Fetch athlete preferences (from `profiles` + new `athlete_food_preferences` table)
- Fetch macro targets (from `athlete_goals`)
- Fetch available foods (from `foods` table, filtered by constraints)
- Fetch adherence history (from `meal_adherence`, grouped by food_id)

**Caching Strategy:**
- Cache food list (rarely changes)
- Cache athlete preferences (updates ~monthly)
- Do NOT cache suggestions (should be fresh each time)

---

### 6.3 Frontend Components

**Coach Dashboard Additions:**
- "Meal Planner" tab in `DashboardApp.tsx` or as a new route `/dashboard/planner`
- `PlannerPage.tsx` (main entry point)
  - Athlete selector (dropdown)
  - "Generate Suggestions" button → opens `SuggestionWizard`
  - History of suggestions applied → list with "used" vs. "ignored"

- `SuggestionWizard.tsx` (multi-step modal or drawer)
  - Step 1: Review athlete macro targets (or set new targets)
  - Step 2: Review dietary constraints
  - Step 3: Select suggestion variant (quick, balanced, flexible)
  - Step 4: Display 3–5 suggestions, coach picks one
  - Step 5: Review/edit selected suggestion
  - Step 6: Confirm → creates `meal_plans` rows for each meal

- `FoodPreferenceForm.tsx` (athlete onboarding or coach configures)
  - Allergies, dislikes, likes, cuisines, meal frequency
  - Saveable via Supabase

**Athlete Feedback (Optional, Phase 2):**
- Post-meal feedback form: "How did this meal go?"
  - Taste/satisfaction (1–5 stars)
  - GI comfort (none, minor discomfort, significant issues)
  - Would eat again? (yes/no)
- Accessible from `meal_adherence` row details

---

### 6.4 Existing Code Integration

**Reuse Existing Patterns:**
- Hooks: Create `useMealPlannerSuggestions()` using TanStack Query pattern
- Forms: Use `react-hook-form` + `react-hook-form` resolvers for validation
- Styling: Tailwind + shadcn/ui components (already used throughout)
- State management: Local React state + TanStack Query (no new library)
- Error handling: `toast.error()` via sonner (existing pattern)

**Files to Touch:**
- `/src/apps/dashboard/routes.tsx` — add planner route
- `/src/apps/dashboard/pages/` — create `MealPlannerPage.tsx`
- `/src/apps/dashboard/components/` — create planner-specific components
- `/src/apps/dashboard/hooks/` — create `useMealPlannerSuggestions.ts`
- `/src/core/types/database.ts` — extend with planner-related types
- `/src/core/hooks/` — create `useAthletePreferences.ts` (if using new table)

**Do NOT Touch:**
- Existing diet/meal_adherence logic (keep as-is; planner builds on top)
- Athlete-facing meal plan display (only coaches use planner)
- Existing food swap algorithm (reuse, don't rewrite)

---

## 7. PHASED ROLLOUT PLAN

### Phase 1: MVP (4–6 weeks)
**Scope:** Quick meal suggestion + manual review → apply

**Deliverables:**
1. Coach inputs: athlete, date, meal type, target macros
2. Backend: LLM API call with constraints, returns 1 meal
3. Coach review: displays suggested meal + macros, with approve/reject
4. Apply: creates meal_plan row if approved
5. Coach override: can edit suggestion before applying

**Acceptance:** Coach can generate a quick lunch suggestion for an athlete in <1 minute

---

### Phase 2: Enhanced MVP (2–3 weeks after Phase 1)
**Scope:** Weekly planning + multiple suggestion variants

**Additions:**
1. Weekly wizard (step through 7 days, suggest multiple options per day)
2. Suggestion variants ("high-carb", "balanced", "flexible")
3. Macro balancing across week (some days high-carb, some lower)
4. Grocery list export

**Acceptance:** Coach can plan a full week in ~20 minutes

---

### Phase 3: Learning Loop (3–4 weeks after Phase 2)
**Scope:** Adherence tracking + AI learns

**Additions:**
1. Athlete feedback form (post-meal satisfaction)
2. Planner learns: tracks adherence per food per athlete
3. Preference refinement: future suggestions prioritize high-adherence foods
4. Weight trend adjustment: "Your target is on pace / slow / fast" → adjust macros

**Acceptance:** Suggestions improve month-over-month; athletes eat more of what's suggested

---

### Phase 4: Bulk Operations & Periodization (2–3 weeks after Phase 3)
**Scope:** Scale to multiple athletes, seasonal periodization

**Additions:**
1. Bulk assign plan to multiple athletes
2. Periodization presets (bulk, cut, maintenance, reverse_diet with macro adjustments)
3. Seasonal food rotation (winter ↔ summer options)
4. Coach dashboard: "% athletes adhering to plan", "avg weight progress vs. plan"

**Acceptance:** Coach can manage 10+ athletes' meal plans with minimal manual work

---

## 8. SUCCESS METRICS

**For Coach:**
- Time to generate weekly meal plan: <30 minutes (target: <15 min)
- # of manual tweaks needed per plan: <2 edits
- # of athletes with active meal plans: increase over time
- Coach satisfaction: "Saves time vs. manual planning"

**For Athlete:**
- Meal adherence rate: >75% (eating what's suggested)
- Weight progress vs. goal: ±0.25 kg/week error (on track)
- Subjective satisfaction: "I like the suggested meals" (survey)
- Digestion quality: no increase in GI complaints

**For Product:**
- Suggestion accuracy: >90% macros hit target ±5%
- Zero hallucinated foods (100% of suggested foods exist in DB)
- Zero constraint violations (0% of suggestions violate allergies/preferences)
- Fallback success: if LLM fails, coach can still manually plan (graceful degradation)

---

## 9. OPEN QUESTIONS & EDGE CASES

**Decision Points for Coach (Mihaid):**

1. **LLM Provider:** Use Claude (Anthropic), GPT-4 (OpenAI), or open-source?
   - **Trade-off:** Closed-source = better quality, higher cost; open-source = lower cost, variable quality
   - **Recommendation:** Start with Claude for MVP (trusted for nutrition domain), consider alternatives if cost prohibitive

2. **Food Database Sourcing:** How to grow the food database beyond current entries?
   - **Options:**
     - Manually curate (slow but accurate)
     - Integrate USDA FoodData Central API (automated, but schema mismatch)
     - Coach-uploaded foods (crowdsourced, but QC challenge)
     - Hybrid: Auto-import with coach review
   - **Recommendation:** Start manual + coach uploads, add API integration in Phase 4

3. **Macro Targets:**
   - Should planner suggest targets, or only use coach-provided ones?
   - **Recommendation:** Phase 1 = coach-provided only; Phase 2 = planner suggests based on Mifflin-St Jeor + athlete goal

4. **Meal Complexity:**
   - Allow recipe-style suggestions (e.g., "Pasta alla Carbonara: 200g pasta, 50g guanciale, 1 egg, 20g Pecorino"), or just food lists?
   - **Recommendation:** Phase 1 = simple food lists; Phase 2 = recipe scaffolding with prep notes

5. **User Language:**
   - App is bilingual (English UI, Italian food/diet terms). Planner output in Italian?
   - **Recommendation:** Yes, for diet terms (meal names, food notes); keep UI in English

6. **Seasonal/Regional Sourcing:**
   - Should planner prefer seasonal Italian produce for cost/freshness?
   - **Recommendation:** Yes; add "season" metadata to foods, bias suggestions toward in-season

---

## 10. CONCLUSION

The diet planner is a **high-value, achievable feature** for bw-tracker. It addresses the core need: coaches spend hours manually assembling meal plans. With an MVP in 4–6 weeks, the tool becomes useful immediately. With phased enhancements, it scales from "quick lunch suggestion" to "fully managed weekly meal planning with learning."

**Key Success Factors:**
- Coach retains full control (suggestions are starting point, not mandate)
- Hard constraints (allergies, dietary style) are never violated
- Athlete adherence drives continuous improvement (feedback loop)
- Time-saving is measurable (before: 30 min/athlete/week, target: 5 min/athlete/week)

**Recommendation:** Start Phase 1 immediately if resources allow. The MVP will be valuable even without AI learning or weekly wizards. Phase 2–4 scale and refine based on real usage and feedback.

---

## APPENDIX: Suggested LLM Prompt Template (Conceptual)

```
You are a sports nutrition assistant helping a fitness coach plan meals for an athlete.

ATHLETE PROFILE:
- Name: [athlete_name]
- Goal: [goal: bulk/cut/maintenance]
- Target Calories: [kcal]
- Target Macros: Protein [Xg], Carbs [Yg], Fats [Zg]
- Dietary Restrictions: [list]
- Food Preferences:
  - Likes: [list]
  - Dislikes: [list]
  - Cuisines: [list]
  - Meal structure: [e.g., "5 meals/day", "3 meals + 2 snacks"]
- Training: [e.g., "Heavy strength training Mon/Wed/Fri"]

AVAILABLE FOODS (from database):
[JSON list of foods: {id, name, portion_size, unit, calories, protein, carbs, fats}]

TASK:
Generate a [breakfast/lunch/dinner/snack] that:
1. Totals [X] kcal ±5%
2. Hits macros: Protein [Yg] ±10%, Carbs [Zg] ±10%, Fats [Wg] ±10%
3. Uses ONLY foods from the available list
4. Respects all dietary restrictions (NO foods from restrictions list)
5. Prefers liked foods; avoids disliked foods
6. Is realistic (portions 10–500g unless oil/supplement)
7. Is varied (no same food as yesterday if possible)

PREVIOUS EATEN FOODS (for this athlete):
[List of recently eaten foods, with adherence rate]

OUTPUT (JSON):
{
  "meal_name": "[Name]",
  "foods": [
    {"food_id": "...", "quantity": 123, "unit": "g", "portion_rationale": "..."},
    ...
  ],
  "total_macros": {"kcal": X, "protein": Y, "carbs": Z, "fats": W},
  "rationale": "This meal combines [food] with [food] to achieve [macro goal]. It's [preferred by athlete / simple to prepare].",
  "estimated_adherence": 0.85,
  "warnings": ["If any", "concerns"]
}
```

**Note:** The prompt is a rough template. Actual implementation should be tested and refined based on Claude's output quality.

---

**End of Brainstorm Document**
