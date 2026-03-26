# Workout Planner Feature — Comprehensive Brainstorm

**Date:** March 25, 2026
**Context:** Multi-app monorepo (Tracker, Dashboard, Workout) for single Italian athlete with coach oversight
**Scope:** Research and design for AI-assisted workout program planning and management

---

## 1. Feature Scope & Capabilities

### 1.1 Program Suggestion Engine

#### What Should Be Suggested?
- **Pre-built Program Templates** (coach-authored or curated)
  - Linear periodization: 4, 8, 12-week programs with progressive loading schemes
  - Undulating periodization: daily/weekly variation in intensity, volume, or rep ranges
  - Block periodization: hypertrophy blocks → strength blocks → power blocks in sequence
  - Sport-specific programs (if athlete has competitive goals)
  - Example: Upper/Lower 4x/week, Push/Pull/Legs (PPL) 6x/week, Full-Body 3x/week

- **Weekly Splits** based on training frequency
  - 3x/week: Full-body or alternating (A-B-A, B-A-B)
  - 4x/week: Upper/Lower repeating
  - 5x/week: PPL + 2 accessory days
  - 6x/week: PPL doubled
  - 7x/week: Daily variations or recovery days

- **Exercise Selection** (compound + accessory pairing)
  - Primary compound per session (1): Squat, Bench, Deadlift, OHP, etc.
  - Secondary compound (1): Complementary lift or variation
  - Accessory exercises (3-5): Isolation or weak-point work
  - Auto-selection based on athlete's goal, equipment, and current program history

- **Progression Schemes** (prescribed within program)
  - Linear: +2.5–5kg per week on main lifts
  - Double progression: increase reps first, then weight (e.g., 3x5 → 3x8 → 4x5)
  - RPE-based: prescribe intensity as "RPE 7" allowing athlete flexibility
  - Wave loading: Week 1 (5 reps), Week 2 (3 reps), Week 3 (1 rep) at same weight
  - Autoregulation: "5 reps @ RPE 8 or max 3 reps below max"

#### Integration with Existing Workout App
- Link to active program in `LogWorkoutView` (currently WIP placeholder)
- Pre-populate session workout selection when logging
- Track adherence: did athlete follow prescribed exercises/weights/reps?
- Store program history: active program, date started, expected end date
- Show today's prescribed workout when opening log tab

#### Program Management for Coaches
- **Coach Dashboard** new section: "Training Programs"
  - Assign program template to athlete (with start date, expected duration)
  - View athlete's current active program and progress through phases
  - Swap exercises mid-program (e.g., Bench Press → Dumbbell Press due to shoulder issue)
  - Modify volume (reduce sets/reps for deload)
  - Extend or terminate programs early
  - View program adherence (% of prescribed exercises actually performed)

- **Program Versioning**
  - Save program revisions as athlete-specific variants
  - Athlete can see "Original Program" vs. "Coach Notes" (customizations)
  - Revert to previous version if needed

#### Periodization Support

**Linear Periodization**
- Week 1: 4 sets × 6 reps @ RPE 7
- Week 2: 4 sets × 5 reps @ RPE 8
- Week 3: 4 sets × 3 reps @ RPE 8.5
- Week 4: Deload (3 sets × 6 reps @ RPE 5)
- Store as array of phase objects; week counter auto-increments on logging

**Undulating Periodization**
- Day A: 5 reps (strength focus)
- Day B: 8 reps (hypertrophy focus)
- Day C: 12 reps (endurance focus)
- Repeat weekly; track which "day type" was done on which calendar date

**Block Periodization**
- Block 1 (Weeks 1–4): Accumulation (high volume, moderate intensity)
- Block 2 (Weeks 5–8): Intensification (moderate volume, high intensity)
- Block 3 (Weeks 9–12): Realization (low volume, high intensity)
- Each block has different exercise selection, rep ranges, and progression

**Implementation Storage:**
```
workout_programs table:
  id, coach_id, athlete_id, name, description,
  periodization_type: 'linear' | 'undulating' | 'block',
  start_date, expected_end_date,
  is_active, created_at, updated_at

program_phases table:
  id, program_id, phase_number, phase_name,
  week_start, week_end,
  focus: 'strength' | 'hypertrophy' | 'power' | 'endurance' | 'recovery',
  volume_multiplier (0.5 for deload), created_at

program_sessions table:
  id, program_id, phase_id,
  day_of_week OR session_number (for block periodization),
  session_name ('Upper A', 'Lower B', etc.)

program_exercises table:
  id, session_id, exercise_id,
  sets, reps, rpe, rest_seconds,
  notes (coaching cues), exercise_order (for sequencing),
  created_at
```

#### Time Horizons
- **Single Session:** "Generate today's workout" button (pull from active program or quick-generate)
- **Weekly Split:** "This is your week structure" (display 7 days with prescribed sessions)
- **4/8/12-week Programs:** Entire program card showing phase breakdown, progression, estimated 1RM gains
- **Open-ended:** "Custom program" with no end date (athlete and coach agree to adjust as needed)

---

## 2. Athlete Inputs Needed

### 2.1 Onboarding/Profile Data (required for program matching)

| Input | Type | Options | Reasoning |
|-------|------|---------|-----------|
| **Training Goals** | Multi-select | Strength, Hypertrophy, Endurance, Power, Fat Loss, Maintenance, Sport-Specific | Determines exercise selection, rep ranges, periodization |
| **Experience Level** | Single select | Beginner (<1 yr), Intermediate (1–3 yr), Advanced (3–10 yr), Elite (10+ yr) | Governs program complexity, recovery capacity, progression speed |
| **Equipment Access** | Multi-select | Barbell, Dumbbell, Machines, Kettlebells, Resistance Bands, Cables, Bodyweight, Specialty (chains, boards, etc.) | Limits exercise pool for selection |
| **Training Frequency** | Single select | 3, 4, 5, 6, 7 days/week | Determines split structure |
| **Session Duration Pref** | Single select | 30, 45, 60, 90 minutes | Constrains total volume per session |
| **Injury History** | Free text or predefined list | Knee, Shoulder, Lower Back, Elbow, Ankle, Other (describe) | Excludes or modifies certain movements |
| **Movement Restrictions** | Multi-select | No heavy squats, No overhead pressing, No jumping, etc. | Auto-removes exercises; flags alternatives |
| **Sport-Specific Goal** | Optional free text | "Prepare for powerlifting meet in 12 weeks" | Enables sport-specific periodization |
| **Current Metrics** | Numeric | Estimated 1RM (squat, bench, deadlift), last tested 3RM, recent competition result | Seeds progression calculations |

### 2.2 Smart Defaults & Auto-Fill

- Read from `profiles` table: `height`, `age`, `gender`, `activity_level`, `goal`, `training_age` (if tracked)
- Infer experience from logged workout history: "You've been logging for 8 months, I'll suggest Intermediate programs"
- Show "popular among your role" (e.g., "Most athletes in your category use PPL splits")
- Display "based on your metrics": "Your estimated squat 1RM is 140kg, so starting weight for this program is 105kg (75%)"

### 2.3 Optional Deep-Dive Profile (for advanced athletes)

- Weak points (e.g., "Bench stalls at 90kg, especially lockout")
- Weak points auto-inform exercise recommendations ("Let's add board presses and pin presses")
- Postural issues (anterior pelvic tilt, kyphosis) → modifies exercise selection and cues
- Previous program history (what worked, what didn't)
- Soft tissue quality concerns (poor ankle mobility → adjust squat depth targets)

---

## 3. Coach Inputs & Controls

### 3.1 Athlete Metadata Management (Dashboard)

**Training Age & Progression Expectations**
- Set custom training age ranges per athlete (overrides self-reported)
- Define expected strength gains per training block (e.g., "Expect 5–10kg bench press gain this 8-week block")
- Adjust recovery capacity multipliers (some athletes recover fast, some need more recovery)
- Flag athletes who need attention (e.g., "not progressing as expected")

**Role-Based Access Control** (already exists via RoleContext)
- Coach sees all athlete data (programs, logs, biofeedback)
- Coach can suggest or mandate programs
- Athlete can only see their own active program and history

### 3.2 Exercise Library Management (New)

**Custom Exercise Library**
- Coach creates exercises with:
  - Name (e.g., "Paused Bench Press")
  - Equipment required (multiselect)
  - Muscle groups (multiselect: chest, back, shoulders, quads, hamstrings, glutes, etc.)
  - Movement pattern: Push, Pull, Squat, Hinge, Carry, Core, Isolation
  - Difficulty level: Beginner, Intermediate, Advanced
  - Coaching cues (text field)
  - Form video URL (optional, link to YouTube or internal CDN)
  - Compound/Accessory classification
  - Allows "primary" (one per session typically) vs. "accessory" tagging

- **Exercise Variants**
  - Barbell Bench Press (primary compound)
  - Dumbbell Bench Press (variation, easier on joints)
  - Machine Chest Press (machine variant, safer for untrained)
  - Floor Press (accommodation for limited ROM or injury)
  - Auto-suggest progressions: "Progress from DB Bench → Barbell Bench → Incline Bench"

- **Exercise Substitution Rules**
  - Define which exercises are interchangeable without changing stimulus
  - Example: "Floor Press and Paused Bench work the same muscles at similar intensity"
  - Enables athlete-friendly swaps without losing program intent

### 3.3 Exercise Selection Rules (Constraints & Logic)

**Incompatibility Constraints**
- Never pair Deadlift + Heavy Back Rows in same session (CNS fatigue)
- Don't combine Heavy Squats + Leg Press on same day (quadriceps overload)
- Avoid heavy pressing + heavy chest isolation (pec muscle fatigue)
- Coach defines: "Exercise X and Exercise Y cannot be in same workout"

**Movement Balance Rules**
- Every session should have 1 push, 1 pull, 1 leg movement (or coach override)
- If no pulling movement detected, flag: "Warning: no horizontal or vertical pull today"
- Auto-suggest supplementary exercise to balance session

**Weekly Volume Distribution**
- Ensure each muscle group is hit 2–3x per week (depending on goals)
- Flag if a muscle is hit only once (risk of adaptation plateau)
- Redistribute if needed

### 3.4 Exercise Progression Paths

**Progression Prescribing**
- Coach defines progression chains for each lift:
  - Bench Press → Incline Bench → Paused Bench → Board Press
  - Squat → Front Squat → Pin Squat (reduced ROM variation)
  - Deadlift → Deficit Deadlift → Block Pulls (increased ROM variation)

- When athlete hits program milestone (e.g., completes 8-week program at 95kg × 5), suggest:
  - Next variation (technical progression)
  - Or increased weight (linear progression)
  - Or added volume (double progression)

**Variant Criteria:**
- Same main muscle, slightly different stimulus (joint angle, range of motion, leverage)
- Example: 5x5 Squat → 4x8 Front Squat (change rep range, joint angle)
- Coach can lock in progression ("Must do Bench Press next") or allow athlete flexibility

### 3.5 Review & Adjust

**Adherence Dashboard**
- For active program, show:
  - "% prescribed exercises performed" (e.g., "Completed 92% of prescribed sessions")
  - "% prescribed reps hit" (did athlete match target reps, or did they stop short?)
  - "RPE accuracy" (did athlete log RPE matching the prescription? e.g., prescribed RPE 8, logged RPE 9)
  - Heat map: which exercises have highest adherence/dropout
  - Flagged sessions: "Athlete skipped today's pressing, did cardio instead"

**Mid-Program Adjustments**
- Swap Exercise: "Replace Leg Press with Bulgarian Split Squat"
  - Shows muscle group coverage impact
  - Ensures replacement has same difficulty level
- Modify Volume: "Reduce to 3 sets (deload week)" or "Add 2 sets (intensification phase)"
- Extend/Shorten: "Extend program 2 more weeks" or "Terminate, start new program next week"
- Adjust Progression: "Next session, aim for 102.5kg instead of 100kg"

**Feedback Loop Integration**
- After athlete logs workout, coach sees:
  - Biofeedback from DailyLog (sleep, HRV, soreness, mood, energy)
  - Quick assessment: "Good recovery signal, can progress" vs. "Fatigued, consider deload"
  - Automatic flag: "Soreness 8/10 for 3 consecutive days, investigate overtraining"

---

## 4. Feature Variations to Consider

### 4.1 Quick Program (1-Click Generation)

**Use Case:** Coach needs a 4-week program for a new athlete in 5 minutes

**Inputs:**
- Select athlete
- Choose goal: Strength, Hypertrophy, Power, Fat Loss
- Pick frequency: 3, 4, 5, 6 days/week
- Select periodization: Linear, Undulating, Block

**Output:**
- Pre-populated 4-week program with:
  - Automatically selected exercises (based on equipment and experience)
  - Rep/set schemes matching periodization
  - Progression built in (week 4 is typically a deload or step-up)
  - Option to tweak before assigning

**Implementation:**
- Hard-code 4–5 program templates per goal × frequency combination
- Fill templates with athlete's exercise library
- Use heuristics: if training age = Intermediate and goal = Hypertrophy, use 6–10 rep ranges

### 4.2 Exercise Recommender

**Use Case:** "What should I do next for chest?"

**Interface:**
- Coach/Athlete selects: Goal + Primary Lift or Body Part + Equipment Available
- System suggests: 2–3 compound exercises + 4–5 accessories ranked by relevance

**Algorithm:**
- Query exercise library filtered by:
  - Muscle group (chest) + Movement pattern (push)
  - Equipment (match profile)
  - Difficulty ≤ athlete's level
  - Not in current week's workout (avoid duplication)
- Rank by:
  - Complementarity (if last session was 5x5, suggest 3x8 rep range)
  - Synergy with recent exercises (if athlete did flat bench, suggest incline next)
  - Least-used in recent history (encourage variety, prevent adaptation plateau)

### 4.3 Progression Prescriber

**Use Case:** "What's next after athlete hits 100kg × 5 on Bench?"

**Inputs:**
- Athlete's current lift: 100kg × 5 reps
- Program phase context (strength, hypertrophy, power)

**Logic:**
- **Linear Progression Path:** "Next session, aim for 102.5kg × 5"
- **Double Progression:** "Target 100kg × 8, then 110kg × 5"
- **Variation Switch:** "Move to Incline Bench 80kg × 6" (technical progression)
- **Rep Range Shift:** "Switch to 4x8 @ 90kg" (hypertrophy focus, auto-deload weight)

**Output:**
- Proposed next session's loading
- Estimated 1RM progression (e.g., "Current 1RM est: 120kg → Next block 1RM: 127kg")
- Coach review/approval before athlete sees it

### 4.4 Deload Planner

**Use Case:** "Athlete is fatigued, needs a deload week"

**Trigger Options:**
- Manual: Coach clicks "Start Deload Week"
- Automatic: System detects 3+ consecutive days of low HRV, sleep < 6h, or soreness 7+/10
- Time-based: "It's been 4 weeks, schedule deload" (every 4th week in linear periodization)

**Deload Logic:**
- Reduce volume by 40–50% (e.g., 4 sets → 2–3 sets, same weight)
- Reduce intensity (RPE 7 → RPE 5)
- Keep movement patterns (don't change exercises, just reduce load)
- Typically 1 week
- Can be extended if athlete still fatigued

**Output:**
- Modified program week with reduced prescription
- Notify athlete: "Deload week—focus on movement quality, not progression"
- Provide guidance: "Stay active with light cardio, prioritize sleep"

### 4.5 Session Generator

**Use Case:** "Generate today's workout" (within active program context)

**Input:**
- Today's date and planned focus (Upper, Lower, Chest, etc.)
- Or: Auto-detect from program schedule

**Output:**
- Fully prescribed session:
  - Exercise name, sets, reps, weight (inferred from last logged weight)
  - Rest periods between sets
  - RPE targets
  - Order (primary compound first)
  - Notes/coaching cues for each exercise

**Smart Features:**
- Learns athlete's preferences: "Last 3 times, you swapped leg press for hack squat—want that today?"
- Autoregulation: "If you feel good, go RPE 8; if fatigued, stay RPE 7"
- Adjusts loading based on recent biofeedback (sleep, HRV, etc.)

---

## 5. Quality & Acceptance Criteria

### 5.1 Validation & Safety Guards

**Exercise Appropriateness**
- No duplicate exercises in same session (system enforces)
- No contradictory rep ranges (e.g., don't prescribe 1x1 AND 5x5 for same lift on same day)
- Respect injury constraints: if athlete marked "no heavy squats," never auto-suggest back squat at high weight
- Equipment match: don't suggest barbell bench if only dumbbell access listed

**Hallucination Prevention**
- Exercise library is finite and coach-curated (no LLM-generated exercises)
- Exercise names must match exactly (case-insensitive, but standardized)
- Coaching cues are coach-entered or from reputable biomechanics sources (not fabricated)
- Flag exercises added by AI model and require coach approval before use

**Periodization Logic Checks**
- Ensure phase progression makes sense (don't go from 5 reps straight to 12 reps, too much jump)
- Deload phases auto-reduce volume proportionally across all exercises
- Progression recommendations respect historical limits (don't suggest 1RM jump > 5% per week without warning)

**Load Calculations**
- Verify weights are plausible for athlete's experience level
  - Beginner (1 yr): typically 50–60% of main compound 1RM as accessory weight
  - Intermediate (3 yr): typically 60–75%
  - Advanced (10 yr): can vary widely, but system flags if extreme outliers
- Warn if loading seems too light ("This is significantly lighter than your previous program")

### 5.2 Training Variables to Track

**Volume Load** (weight × reps × sets)
- Per exercise: e.g., Bench Press 100kg × 5 reps × 4 sets = 2000 kg
- Per session: sum of all exercises
- Per week: sum of all daily volumes
- Trend over time: should match program progression curve

**RPE Matching**
- Prescribed RPE 8, athlete logs RPE 9 → session was slightly harder than planned (okay, but flag pattern)
- Prescribed RPE 6, athlete logs RPE 3 → session was much easier (flag if trend continues)
- Enables autoregulation calibration

**Exercise Selection Variance**
- Track if athlete is doing same exercises repeatedly (beneficial for specialization) or varying (beneficial for adaptation)
- Flag if new exercise variance is too high (every workout has different exercises = poor stimulus)
- Optimal range: 70–80% exercises same within a phase, 20–30% variation

**Adherence Submetrics**
- Exercise adherence: % of prescribed exercises performed
- Volume adherence: % of prescribed reps/sets hit
- Intensity adherence: % of sessions at prescribed RPE range (±0.5)
- Consistency: % of prescribed sessions actually completed

**Fatigue & Recovery Signals**
- HRV trend during program block (should stabilize or improve by end of phase)
- Sleep quality during high-volume weeks (should drop slightly, then recover in deload)
- Soreness pattern (acute post-workout soreness is normal, chronic elevated soreness suggests overtraining)
- Subjective energy & mood (often drop early in block, recover during deload)

### 5.3 AI Feedback Loop & Learning

**Closed-Loop Validation**
1. Coach assigns program
2. Athlete logs workouts + biofeedback over weeks
3. System learns:
   - "This athlete responds well to 3x/week upper/lower splits" (vs. 4x/week failing)
   - "Adding deload after week 3 prevents fatigue" (vs. week 4 deload that's too late)
   - "Incline Bench works better than Dumbbell Bench for this athlete" (based on adherence + strength gains)
4. Next program recommendation is influenced by learned patterns

**Metrics to Learn From:**
- Program adherence rate (% sessions completed, % exercises done)
- 1RM progression per phase (did athlete gain expected 5–10kg on main lifts?)
- Biofeedback quality during program (low fatigue signal = sustainable program)
- Dropout rate (if athlete abandons program, what went wrong?)
- Injury reports (flag if program caused new injuries)

**Training Database Value**
- Over time, bw-tracker accumulates program outcomes
- Example insight: "For this athlete's profile (Intermediate, 4 days/week, PPL), average 1RM gain is 8kg per 8-week block"
- Use to set realistic progression expectations for future programs

### 5.4 Acceptance Criteria (Definition of Done)

- [ ] Program CRUD operations (create, read, update, delete) functional in coach dashboard
- [ ] Athlete can view assigned program and today's prescribed workout in workout app
- [ ] Exercise library is populated (minimum 30–50 exercises covering all major movement patterns)
- [ ] Auto-assignment logic passes validation (no incompatible exercises, respects injury constraints)
- [ ] Progression recommendations align with prescribed periodization type
- [ ] Adherence tracking captures % exercises, % volume, RPE matching
- [ ] Deload detection (manual or automatic) reduces volume by 40–50% without changing movements
- [ ] Coach can swap exercises mid-program with immediate update to athlete view
- [ ] No hallucinated exercises or cues (all exercises and cues from coach library or validated sources)
- [ ] Program history preserved (athlete can view past programs and outcomes)
- [ ] Mobile-friendly (responsive on 375px viewport, 44px touch targets)
- [ ] Offline-capable (program data syncs to Dexie queue on create/update, manual sync available)
- [ ] Type-safe (full TypeScript coverage, no `any` types in critical logic)
- [ ] Tested (unit tests for progression logic, E2E test for assign program → log workout → track adherence)

---

## 6. Technical Considerations

### 6.1 Database Schema Extensions

**New Tables Needed:**

```sql
-- Core program structure
workout_programs (id, coach_id, athlete_id, name, description,
                  periodization_type, start_date, expected_end_date,
                  is_active, created_at, updated_at)

program_phases (id, program_id, phase_number, phase_name,
                week_start, week_end, focus, volume_multiplier, created_at)

program_sessions (id, program_id, phase_id, day_of_week, session_name,
                  created_at)

-- Exercise management
exercises (id, coach_id, name, movement_pattern,
           difficulty, coaching_cues, form_video_url,
           is_compound, created_at, updated_at)

exercise_equipment (id, exercise_id, equipment_name)
exercise_muscle_groups (id, exercise_id, muscle_group)

-- Session prescriptions
program_exercise_prescriptions (id, session_id, exercise_id,
                                sets, reps, rpe, rest_seconds,
                                notes, exercise_order, created_at)

-- Exercise variants & progressions
exercise_progressions (id, coach_id, from_exercise_id, to_exercise_id,
                      progression_type: 'variant' | 'loading' | 'volume',
                      description, created_at)

-- Athlete workout logs (if not already in schema)
athlete_workout_logs (id, athlete_id, date, program_id, session_id,
                      created_at, updated_at)

athlete_exercise_logs (id, log_id, exercise_id, sets_performed,
                       reps_performed, weight, rpe, created_at)

-- Adherence tracking
program_adherence_summary (id, athlete_id, program_id,
                          exercise_adherence_pct, volume_adherence_pct,
                          intensity_adherence_pct, updated_at)
```

### 6.2 Integration Points

- **Workout App (LogWorkoutView):** Display today's prescribed session from active program
- **Dashboard (new "Programs" page):** Manage program templates, assign to athletes, track adherence
- **DailyLog sync:** Incorporate gym_rpe, soreness_level into adherence calculations
- **Dexie queue:** Offline support for program create/update (sync on next connection)
- **RoleContext:** Coach role can access/modify programs; athlete role is read-only on programs

### 6.3 Modeling Considerations

**Program Assignment vs. Template**
- Template: Coach creates reusable program structure (e.g., "PPL 6x/week for Hypertrophy")
- Assignment: Coach assigns a template to an athlete with a specific start date
- Athlete sees the assigned copy, not the template
- Coach can edit assigned copy without affecting template

**Periodization Representation**
- Linear: JSON array of phases with week-by-week loading prescription
- Undulating: JSON object mapping day-type to prescription
- Block: Phases stored separately, exercise selection per phase

**Exercise Ordering**
- Program exercises have explicit `exercise_order` (1, 2, 3, ...)
- Athlete should do exercises in order (compounds first, accessories last)
- UI enforces or suggests order when logging

---

## 7. Out of Scope (For Future Iterations)

- **Nutrition program generation** (separate from workout planning)
- **Automated form video capture & analysis** (would need computer vision)
- **Real-time coaching during workout** (live feedback from coach)
- **A/B testing programs** (assigning variant programs to test outcomes)
- **Automatic 1RM estimation from submaximal lifts** (biomechanics model needed)
- **Sport-specific movement analysis** (injury risk assessment, sport science modeling)
- **Multi-coach collaboration** (one coach per athlete for MVP)

---

## 8. Example Workflows

### Workflow 1: Assign a Quick 4-Week Hypertrophy Program

1. Coach navigates to Dashboard → Programs
2. Clicks "Quick Program" button
3. Selects athlete, goal (Hypertrophy), frequency (4 days/week)
4. System generates 4-week Upper/Lower split with 8–10 rep ranges
5. Coach reviews exercise selections, adjusts 1–2 exercises
6. Clicks "Assign & Start"
7. Athlete sees "New Program: Upper/Lower Hypertrophy (4 weeks, starting today)"
8. Athlete opens Workout Log → sees Week 1, Day 1 (Upper A) with prescribed exercises
9. Athlete logs session with actual sets/reps/RPE
10. Coach dashboard shows adherence: "Completed 5/6 exercises, 92% volume, RPE matching"

### Workflow 2: Mid-Program Deload

1. It's Week 3 of 4; athlete's biofeedback shows: HRV down 15%, sleep 5.5h, soreness 8/10
2. Coach dashboard auto-flags: "Recovery signal low, consider deload"
3. Coach clicks "Insert Deload Week"
4. Program updates: Week 4 becomes deload (3 sets instead of 4, RPE 5 instead of RPE 8)
5. Week 5 (new) is original Week 4 prescription
6. Athlete is notified: "New deload week added—focus on movement quality"
7. Athlete logs deload week with light weight; biofeedback improves
8. Week 5 (original Week 4): athlete is recovered and hits targets easily

### Workflow 3: Exercise Swap Due to Shoulder Pain

1. Athlete logs workout: "Did 3 sets of Bench Press, felt shoulder pain, stopped at set 3"
2. Athlete adds note: "Shoulder discomfort during bench"
3. Coach reviews log + notes
4. Coach opens program editor, finds Bench Press in this week and next week
5. Coach clicks "Swap Exercise" for next week's Bench Press
6. System suggests alternatives: Dumbbell Bench, Machine Chest Press, Floor Press
7. Coach selects Dumbbell Bench, which is marked "lower shoulder stress"
8. Athlete sees: "Program updated: Bench Press replaced with Dumbbell Bench for next week"
9. Coach leaves note: "Testing dumbbell variation on shoulder—let me know how it feels"

---

## 9. Success Metrics (Post-Launch Evaluation)

- **Adoption:** % of coaches using workout planner within 60 days
- **Program Adherence:** Average adherence rate > 85% (exercises and volume)
- **Athlete Retention:** Athletes with assigned programs have higher app engagement
- **Progression:** Average 1RM gains match expected ranges for periodization type (5–10kg per 8-week block)
- **Adherence Consistency:** RPE accuracy within ±0.5 rating (athlete self-regulation improving over time)
- **Fatigue Management:** Deload-inserted programs show better HRV/sleep recovery patterns than non-deload cohort
- **Coach Confidence:** Coach dashboard usage time increases; manual adjustments decrease over time (programs improving)
- **User Feedback:** NPS > 7; specific feedback on exercise recommendations accuracy

---

## Appendix: Existing System Context

### Current Architecture
- **Auth:** Supabase with RoleContext (athlete, self_coached, coach)
- **State Management:** TanStack Query (server), React useState (UI), Dexie/IndexedDB (offline queue)
- **Tables:** profiles, daily_logs, meal_plans, foods, meal_adherence, coach_athletes
- **Workout App (WIP):** 4 tabs (log, history, programs, stats); all currently placeholder views
- **Dashboard:** Existing pages (Athletes, Progress, Goals, Diets, Settings); coaches manage athlete nutrition/metrics

### Constraints
- Single athlete per session (session.user_id in Supabase)
- Manual type generation (no ORM/codegen from schema)
- Offline-first for writes (Dexie queue)
- No migration tooling (manual SQL via dashboard)
- Mobile-first PWA (375px min viewport, 44px touch targets)

### Data Availability
- Athlete workout logs (once implemented): sets, reps, weight, RPE per exercise per date
- Biofeedback: sleep hours/quality, HRV, soreness, energy, mood (daily_logs table)
- Athlete profile: training age/experience, equipment access, injury history (extended profiles table)

