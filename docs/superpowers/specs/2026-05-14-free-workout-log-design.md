# Free Workout Log — Design Spec
**Date:** 2026-05-14  
**App:** `leonida-app` / workout module  
**Tab:** Log (currently WIP placeholder)

---

## Goal

Replace the WIP `LogWorkoutView` placeholder with a full free-form workout logging flow. Users start a session, pick exercises from the catalog, add sets (with scheme type + count), fill in weight/reps/RIR/rest per set, and finish.

---

## Data Model

Extend `src/apps/workout/types/workout-log.ts` with three new interfaces and two factory functions. These are decoupled from `ProgramExercise` — the free workout has no template.

```ts
export type FreeSetType =
  | 'warmup'
  | 'normal'
  | 'range'
  | 'dropset'
  | 'rest_pause'
  | 'max_reps';

export interface FreeSetLog {
  type: FreeSetType;
  weight: string;
  reps: string;      // for max_reps: AMRAP count filled in after the set
  rir: string;
  rest: string;
  completed: boolean;
}

export interface FreeExerciseLog {
  exerciseId: string;
  exercise: Exercise;   // full catalog Exercise, not ProgramExercise
  sets: FreeSetLog[];
}

export interface FreeWorkoutLog {
  sessionId: string;    // crypto.randomUUID() at session start
  startedAt: Date;
  exercises: FreeExerciseLog[];
}

export function makeFreeSet(type: FreeSetType): FreeSetLog {
  return { type, weight: '', reps: '', rir: '', rest: '', completed: false };
}

export function makeFreeExerciseLog(exercise: Exercise): FreeExerciseLog {
  return { exerciseId: exercise.id, exercise, sets: [] };
}
```

All numeric fields stored as strings (same convention as existing `SetLog`) to avoid forced validation at input time.

---

## Component Architecture

```
src/apps/workout/components/log/
  LogWorkoutView.tsx          ← thin gate: idle or active state
  ActiveFreeWorkout.tsx       ← session container
  FreeExerciseBlock.tsx       ← per-exercise card
  FreeSetRow.tsx              ← one set row
  ExercisePickerSheet.tsx     ← bottom sheet: exercise selection
  SetSchemeSheet.tsx          ← bottom sheet: scheme + count picker
```

### Render tree

```
LogWorkoutView
  idle  → "Start Workout" button (centered card)
  active →
    ActiveFreeWorkout
      ├─ sticky header: elapsed timer · "Finish Workout" button
      ├─ FreeExerciseBlock × N (one per exercise in log)
      │    ├─ exercise name + primary muscle group badge
      │    ├─ FreeSetRow × N
      │    │    └─ [type badge] [kg input] [reps] [RIR] [rest] [✓]
      │    └─ "Add Set" button → opens SetSchemeSheet
      └─ "Add Exercise" button (bottom of list) → opens ExercisePickerSheet
```

---

## Component Specs

### LogWorkoutView
- Local state: `FreeWorkoutLog | null` (null = idle)
- `handleStart()` → creates new `FreeWorkoutLog` with `crypto.randomUUID()` and `new Date()`
- `handleFinish()` → resets state to null (future: persist to backend)
- Renders idle card or `<ActiveFreeWorkout>`

### ActiveFreeWorkout
Props: `log: FreeWorkoutLog`, `onChange(log): void`, `onFinish(): void`

- Elapsed timer via `setInterval` (same `useElapsed` pattern as `ActiveWorkoutView`)
- Header: back/cancel icon (left) + Clock icon + MM:SS elapsed + "Finish" button (right)
- "Finish" disabled when `exercises.length === 0`; always tappable otherwise
- On finish: show completion screen (trophy, elapsed, set count, "Back" button)
- `updateExercise(index, updated)` → immutable update to `log.exercises`

### FreeExerciseBlock
Props: `log: FreeExerciseLog`, `onChange(log): void`

- Exercise name (bold) + category badge (reuse color map from `ActiveExerciseCard`)
- Primary muscle group label (muted, small)
- Renders `<FreeSetRow>` for each set
- "Add Set" button → opens `SetSchemeSheet`; on confirm appends N rows via `makeFreeSet`
- Progress indicator: "X/Y sets done" (count completed)

### FreeSetRow
Props: `set: FreeSetLog`, `index: number`, `onChange(set): void`

Grid layout: `grid-cols-[28px_1fr_1fr_1fr_1fr_32px]`

Columns: `[badge]` `[kg]` `[reps]` `[RIR]` `[rest]` `[✓]`

| type | badge text | badge color |
|------|-----------|-------------|
| warmup | W | blue/muted |
| normal | set # | muted |
| range | R | purple |
| dropset | D | orange |
| rest_pause | RP | amber |
| max_reps | F | red |

- Completed rows: `opacity-50`, inputs `disabled`
- `inputMode="decimal"` for weight; `inputMode="numeric"` for reps/RIR/rest

### ExercisePickerSheet
State: search string, selected muscle group filter

- Reuses `FilterChipRow` for muscle group chips
- Filters `MOCK_EXERCISES` by name + muscle group (same logic as `ExercisesView`)
- Tap exercise → calls `onAdd(exercise)`, sheet closes
- No multi-select — one tap = one add (user opens sheet again to add another)

### SetSchemeSheet
State: selected `FreeSetType`, set count (number, default 3)

- Scheme selector: 6 chip buttons (Warmup / Normal / Range / Drop Set / Rest-Pause / AMRAP)
- Count: `+` / `−` stepper, min 1 max 10
- "Add Sets" confirm button → calls `onConfirm(type, count)`

---

## UX Flows

### Start workout
1. Log tab → idle card → "Start Workout" tap
2. `FreeWorkoutLog` created, active state shown

### Add exercise
1. Tap "Add Exercise"
2. `ExercisePickerSheet` opens — search + muscle filter
3. Tap exercise → appended to `log.exercises`, sheet closes

### Add sets
1. Tap "Add Set" inside `FreeExerciseBlock`
2. `SetSchemeSheet` opens — pick scheme + count
3. Confirm → N `FreeSetLog` rows appended with chosen type

### Log a set
- Tap weight/reps/RIR/rest → numeric keyboard
- Tap circle → `completed: true`, row dims + inputs lock

### Finish
- "Finish" always visible in header
- Disabled (grayed) when no exercises
- Tap → completion screen: trophy, session name "Free Workout", elapsed, set count
- "Back" → resets to idle

### Discard guard
- Back/cancel during active session → confirm dialog: "Discard session?"
- Confirm → reset to idle; Cancel → stay in session

---

## Reuse Points

| Existing | Reused in |
|----------|-----------|
| `FilterChipRow` | `ExercisePickerSheet` muscle filter |
| `useElapsed` pattern (copy, not import) | `ActiveFreeWorkout` timer |
| Category badge color map | `FreeExerciseBlock` |
| `MOCK_EXERCISES` + filter logic | `ExercisePickerSheet` |

Programs tab flow (`ProgramsView` → `ActiveWorkoutView`) is untouched.

---

## Out of Scope

- Backend persistence (no Dexie queue or Supabase sync in this iteration)
- Editing/deleting individual set rows after adding
- Reordering exercises
- Superset grouping
- History tab showing free workouts
