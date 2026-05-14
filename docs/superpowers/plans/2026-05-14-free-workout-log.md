# Free Workout Log — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a free-form workout logging flow in the Log tab — start session, pick exercises from catalog, add typed sets, log weight/reps/RIR/rest, finish.

**Architecture:** Replace the WIP `LogWorkoutView` placeholder with a 6-component flow. `LogWorkoutView` owns idle/active state; `ActiveFreeWorkout` orchestrates the session; `FreeExerciseBlock` renders per-exercise set logging; `FreeSetRow` handles individual set input. Two bottom sheets handle exercise selection and set scheme configuration. New types extend `workout-log.ts` without touching the Programs flow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide icons. No new dependencies.

---

### Task 1: Extend workout-log.ts with free workout types

**Files:**
- Modify: `src/apps/workout/types/workout-log.ts`

- [ ] **Step 1: Append free workout types and factories**

Open `src/apps/workout/types/workout-log.ts`. The file currently starts with:
```ts
import type { ProgramExercise } from './program';
```

Add a second import at the top for Exercise, then append the new types at the end of the file:

```ts
// Add after the existing import line:
import type { Exercise } from './exercise';
```

Then append to the bottom of the file:

```ts
// ── Free workout (no program template) ────────────────────────────────────

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
  reps: string;
  rir: string;
  rest: string;
  completed: boolean;
}

export interface FreeExerciseLog {
  exerciseId: string;
  exercise: Exercise;
  sets: FreeSetLog[];
}

export interface FreeWorkoutLog {
  sessionId: string;
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

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc -b --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/apps/workout/types/workout-log.ts
git commit -m "feat: add FreeWorkoutLog types and factory functions"
```

---

### Task 2: SetSchemeSheet

Bottom sheet: user picks set scheme type + set count → caller appends N rows.

**Files:**
- Create: `src/apps/workout/components/log/SetSchemeSheet.tsx`

- [ ] **Step 1: Create SetSchemeSheet.tsx**

```tsx
import { useState } from 'react';
import type { FreeSetType } from '../../types/workout-log';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (type: FreeSetType, count: number) => void;
}

const SCHEME_OPTIONS: { type: FreeSetType; label: string }[] = [
  { type: 'warmup',     label: 'Warm-up'    },
  { type: 'normal',     label: 'Normal'     },
  { type: 'range',      label: 'Range'      },
  { type: 'dropset',    label: 'Drop Set'   },
  { type: 'rest_pause', label: 'Rest-Pause' },
  { type: 'max_reps',   label: 'AMRAP'      },
];

export default function SetSchemeSheet({ open, onClose, onConfirm }: Props) {
  const [selectedType, setSelectedType] = useState<FreeSetType>('normal');
  const [count, setCount] = useState(3);

  if (!open) return null;

  function handleConfirm() {
    onConfirm(selectedType, count);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full bg-card rounded-t-2xl p-6 space-y-5">
        <h3 className="font-semibold text-foreground text-lg">Add Sets</h3>

        {/* Scheme type selector */}
        <div className="grid grid-cols-3 gap-2">
          {SCHEME_OPTIONS.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                selectedType === type
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Set count stepper */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Number of sets</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCount(c => Math.max(1, c - 1))}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-xl leading-none"
            >
              −
            </button>
            <span className="text-foreground font-semibold w-4 text-center">{count}</span>
            <button
              onClick={() => setCount(c => Math.min(10, c + 1))}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-xl leading-none"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold active:scale-[0.98] transition-transform"
        >
          Add {count} {count === 1 ? 'Set' : 'Sets'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc -b --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/apps/workout/components/log/SetSchemeSheet.tsx
git commit -m "feat: add SetSchemeSheet for set scheme and count selection"
```

---

### Task 3: ExercisePickerSheet

Bottom sheet: search + muscle filter → tap exercise to add it.

**Files:**
- Create: `src/apps/workout/components/log/ExercisePickerSheet.tsx`

Notes:
- `FilterChipRow` from `../exercises/FilterChipRow` takes `children: ReactNode` — render chip `<button>` elements inside it.
- `useExercises()` from `../../hooks/useExercises` returns `{ data: Exercise[] }` via TanStack Query.
- `ALL_MUSCLE_GROUPS`, `SPECIFIC_TO_GROUP` are exported from `../../types/exercise`.

- [ ] **Step 1: Create ExercisePickerSheet.tsx**

```tsx
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useExercises } from '../../hooks/useExercises';
import FilterChipRow from '../exercises/FilterChipRow';
import type { Exercise, MuscleGroup } from '../../types/exercise';
import { ALL_MUSCLE_GROUPS, SPECIFIC_TO_GROUP } from '../../types/exercise';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
}

const GROUP_ACTIVE: Record<MuscleGroup, string> = {
  Chest:       'bg-red-500 text-white border-red-500',
  Back:        'bg-blue-500 text-white border-blue-500',
  Shoulders:   'bg-purple-500 text-white border-purple-500',
  Arms:        'bg-orange-500 text-white border-orange-500',
  Legs:        'bg-green-500 text-white border-green-500',
  Core:        'bg-yellow-500 text-white border-yellow-500',
  Cardio:      'bg-pink-500 text-white border-pink-500',
  'Full Body': 'bg-primary text-primary-foreground border-primary',
  Other:       'bg-muted-foreground text-white border-muted-foreground',
};

export default function ExercisePickerSheet({ open, onClose, onAdd }: Props) {
  const { data: exercises = [] } = useExercises();
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (!muscleFilter) return true;
      const allMuscles = [...ex.primary_muscles, ...ex.secondary_muscles, ...ex.auxiliary_muscles];
      return allMuscles.some(m => SPECIFIC_TO_GROUP[m] === muscleFilter);
    });
  }, [exercises, search, muscleFilter]);

  if (!open) return null;

  function handleAdd(exercise: Exercise) {
    onAdd(exercise);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full bg-card rounded-t-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <h3 className="font-semibold text-foreground text-lg">Add Exercise</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Search + muscle filter */}
        <div className="px-4 pt-3 pb-2 space-y-2 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises…"
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <FilterChipRow>
            {ALL_MUSCLE_GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setMuscleFilter(prev => prev === g ? null : g)}
                className={`shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-colors ${
                  muscleFilter === g
                    ? GROUP_ACTIVE[g]
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {g}
              </button>
            ))}
          </FilterChipRow>
        </div>

        {/* Scrollable exercise list */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1 space-y-1.5">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => handleAdd(ex)}
              className="w-full text-left bg-background border border-border rounded-lg px-4 py-3 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {ex.primary_muscles[0]?.replace(/_/g, ' ') ?? ''}
                </p>
              </div>
              <span className="text-primary text-sm font-semibold ml-3 shrink-0">+ Add</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm pt-10">No exercises found</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc -b --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/apps/workout/components/log/ExercisePickerSheet.tsx
git commit -m "feat: add ExercisePickerSheet with search and muscle group filter"
```

---

### Task 4: FreeSetRow

Single set row: type badge + weight/reps/RIR/rest inputs + completion toggle.

**Files:**
- Create: `src/apps/workout/components/log/FreeSetRow.tsx`

- [ ] **Step 1: Create FreeSetRow.tsx**

```tsx
import { Circle, CheckCircle2 } from 'lucide-react';
import type { FreeSetLog, FreeSetType } from '../../types/workout-log';

interface Props {
  set: FreeSetLog;
  index: number;
  onChange: (set: FreeSetLog) => void;
}

const BADGE: Record<FreeSetType, { label: string; className: string }> = {
  warmup:     { label: 'W',  className: 'bg-sky-500/15 text-sky-500' },
  normal:     { label: '',   className: 'bg-muted text-muted-foreground' },
  range:      { label: 'R',  className: 'bg-purple-500/15 text-purple-500' },
  dropset:    { label: 'D',  className: 'bg-orange-500/15 text-orange-500' },
  rest_pause: { label: 'RP', className: 'bg-amber-500/15 text-amber-600' },
  max_reps:   { label: 'F',  className: 'bg-destructive/15 text-destructive' },
};

const inputBase =
  'w-full bg-transparent text-center text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-40';

export default function FreeSetRow({ set, index, onChange }: Props) {
  const badge = BADGE[set.type];
  const badgeLabel = badge.label || String(index + 1);

  function patch(field: Partial<FreeSetLog>) {
    onChange({ ...set, ...field });
  }

  return (
    <div
      className={`grid grid-cols-[28px_1fr_1fr_1fr_1fr_32px] items-center gap-1 py-1.5 transition-opacity ${
        set.completed ? 'opacity-50' : ''
      }`}
    >
      {/* Type badge */}
      <span
        className={`text-[10px] font-bold rounded px-1 py-0.5 text-center leading-tight ${badge.className}`}
      >
        {badgeLabel}
      </span>

      {/* Weight (kg) */}
      <input
        type="text"
        inputMode="decimal"
        value={set.weight}
        onChange={e => patch({ weight: e.target.value })}
        placeholder="kg"
        disabled={set.completed}
        className={inputBase}
      />

      {/* Reps */}
      <input
        type="text"
        inputMode="numeric"
        value={set.reps}
        onChange={e => patch({ reps: e.target.value })}
        placeholder={set.type === 'max_reps' ? '∞' : 'reps'}
        disabled={set.completed}
        className={inputBase}
      />

      {/* RIR */}
      <input
        type="text"
        inputMode="numeric"
        value={set.rir}
        onChange={e => patch({ rir: e.target.value })}
        placeholder="RIR"
        disabled={set.completed}
        className={inputBase}
      />

      {/* Rest (seconds) */}
      <input
        type="text"
        inputMode="numeric"
        value={set.rest}
        onChange={e => patch({ rest: e.target.value })}
        placeholder="rest"
        disabled={set.completed}
        className={inputBase}
      />

      {/* Completion toggle */}
      <button
        onClick={() => patch({ completed: !set.completed })}
        className="flex items-center justify-center text-muted-foreground"
      >
        {set.completed
          ? <CheckCircle2 size={20} className="text-primary" />
          : <Circle size={20} />}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc -b --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/apps/workout/components/log/FreeSetRow.tsx
git commit -m "feat: add FreeSetRow with type badge and set inputs"
```

---

### Task 5: FreeExerciseBlock

Per-exercise card: exercise header, column labels, set rows, "Add Set" button.

**Files:**
- Create: `src/apps/workout/components/log/FreeExerciseBlock.tsx`

- [ ] **Step 1: Create FreeExerciseBlock.tsx**

```tsx
import { useState } from 'react';
import type { FreeExerciseLog, FreeSetLog, FreeSetType } from '../../types/workout-log';
import { makeFreeSet } from '../../types/workout-log';
import { SPECIFIC_TO_GROUP, CATEGORY_LABELS } from '../../types/exercise';
import FreeSetRow from './FreeSetRow';
import SetSchemeSheet from './SetSchemeSheet';

const CATEGORY_COLORS: Record<string, string> = {
  madre:             'bg-primary/15 text-primary',
  meccanico:         'bg-blue-500/15 text-blue-500',
  metabolico:        'bg-orange-500/15 text-orange-500',
  pre_attivazione:   'bg-green-500/15 text-green-500',
  pre_affaticamento: 'bg-purple-500/15 text-purple-500',
  all_out:           'bg-destructive/15 text-destructive',
};

const GROUP_COLORS: Record<string, string> = {
  Chest:       'text-red-500',
  Back:        'text-blue-500',
  Shoulders:   'text-purple-500',
  Arms:        'text-orange-500',
  Legs:        'text-green-500',
  Core:        'text-yellow-600',
  'Full Body': 'text-muted-foreground',
  Other:       'text-muted-foreground',
};

const SET_COL_HEADERS = ['', 'kg', 'reps', 'RIR', 'rest', ''];

interface Props {
  log: FreeExerciseLog;
  onChange: (log: FreeExerciseLog) => void;
}

export default function FreeExerciseBlock({ log, onChange }: Props) {
  const [schemeOpen, setSchemeOpen] = useState(false);
  const { exercise, sets } = log;

  const primaryGroup = exercise.primary_muscles.length > 0
    ? SPECIFIC_TO_GROUP[exercise.primary_muscles[0]]
    : 'Other';

  const completedCount = sets.filter(s => s.completed).length;
  const categoryColor = CATEGORY_COLORS[exercise.category] ?? 'bg-muted text-muted-foreground';
  const groupColor = GROUP_COLORS[primaryGroup ?? 'Other'] ?? 'text-muted-foreground';

  function updateSet(index: number, updated: FreeSetLog) {
    const newSets = sets.map((s, i) => (i === index ? updated : s));
    onChange({ ...log, sets: newSets });
  }

  function handleAddSets(type: FreeSetType, count: number) {
    const newSets = Array.from({ length: count }, () => makeFreeSet(type));
    onChange({ ...log, sets: [...sets, ...newSets] });
  }

  return (
    <div className="border border-border bg-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{exercise.name}</p>
            <p className={`text-xs font-medium mt-0.5 ${groupColor}`}>{primaryGroup}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${categoryColor}`}>
            {CATEGORY_LABELS[exercise.category]}
          </span>
        </div>
        {sets.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {completedCount}/{sets.length} sets done
          </p>
        )}
      </div>

      {/* Column headers (only shown when sets exist) */}
      {sets.length > 0 && (
        <div className="grid grid-cols-[28px_1fr_1fr_1fr_1fr_32px] gap-1 px-4 pb-1">
          {SET_COL_HEADERS.map((h, i) => (
            <span key={i} className="text-[10px] text-muted-foreground text-center">{h}</span>
          ))}
        </div>
      )}

      {/* Set rows */}
      {sets.length > 0 && (
        <div className="px-4 divide-y divide-border/50">
          {sets.map((set, i) => (
            <FreeSetRow
              key={i}
              set={set}
              index={i}
              onChange={updated => updateSet(i, updated)}
            />
          ))}
        </div>
      )}

      {/* Add Set button */}
      <div className="px-4 py-3">
        <button
          onClick={() => setSchemeOpen(true)}
          className="w-full py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          + Add Set
        </button>
      </div>

      <SetSchemeSheet
        open={schemeOpen}
        onClose={() => setSchemeOpen(false)}
        onConfirm={handleAddSets}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc -b --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/apps/workout/components/log/FreeExerciseBlock.tsx
git commit -m "feat: add FreeExerciseBlock per-exercise card with set management"
```

---

### Task 6: ActiveFreeWorkout

Session container: elapsed timer, exercise list, "Add Exercise", finish / completion screen.

**Files:**
- Create: `src/apps/workout/components/log/ActiveFreeWorkout.tsx`

- [ ] **Step 1: Create ActiveFreeWorkout.tsx**

```tsx
import { useState, useEffect } from 'react';
import { Clock, Trophy, X } from 'lucide-react';
import type { FreeWorkoutLog, FreeExerciseLog } from '../../types/workout-log';
import { makeFreeExerciseLog } from '../../types/workout-log';
import type { Exercise } from '../../types/exercise';
import FreeExerciseBlock from './FreeExerciseBlock';
import ExercisePickerSheet from './ExercisePickerSheet';

interface Props {
  log: FreeWorkoutLog;
  onChange: (log: FreeWorkoutLog) => void;
  onFinish: () => void;
  onCancel: () => void;
}

function useElapsed(startedAt: Date): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveFreeWorkout({ log, onChange, onFinish, onCancel }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const elapsed = useElapsed(log.startedAt);

  const totalSets = log.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const doneSets  = log.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const hasExercises = log.exercises.length > 0;

  function updateExercise(index: number, updated: FreeExerciseLog) {
    const exercises = log.exercises.map((ex, i) => (i === index ? updated : ex));
    onChange({ ...log, exercises });
  }

  function addExercise(exercise: Exercise) {
    onChange({ ...log, exercises: [...log.exercises, makeFreeExerciseLog(exercise)] });
  }

  function handleCancel() {
    if (window.confirm('Discard this workout session?')) {
      onCancel();
    }
  }

  // Completion screen
  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
        <Trophy size={56} className="text-primary" />
        <h2 className="text-xl font-bold text-foreground">Workout Complete!</h2>
        <p className="text-muted-foreground text-sm">Free Workout</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {formatElapsed(elapsed)}
          </span>
          <span>{doneSets}/{totalSets} sets done</span>
        </div>
        <button
          onClick={onFinish}
          className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cancel workout"
        >
          <X size={20} />
        </button>

        <span className="font-mono text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock size={14} />
          {formatElapsed(elapsed)}
        </span>

        <button
          onClick={() => setFinished(true)}
          disabled={!hasExercises}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            hasExercises
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {hasExercises && totalSets > 0
            ? `Finish (${doneSets}/${totalSets})`
            : 'Finish'}
        </button>
      </div>

      {/* Exercise list */}
      {log.exercises.map((exLog, i) => (
        <FreeExerciseBlock
          key={exLog.exerciseId + i}
          log={exLog}
          onChange={updated => updateExercise(i, updated)}
        />
      ))}

      {/* Add Exercise button */}
      <button
        onClick={() => setPickerOpen(true)}
        className="w-full py-3 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        + Add Exercise
      </button>

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addExercise}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc -b --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/apps/workout/components/log/ActiveFreeWorkout.tsx
git commit -m "feat: add ActiveFreeWorkout session view with timer and exercise management"
```

---

### Task 7: Replace LogWorkoutView

Replace the WIP placeholder with an idle/active gate.

**Files:**
- Modify: `src/apps/workout/components/log/LogWorkoutView.tsx`

- [ ] **Step 1: Replace LogWorkoutView.tsx with full implementation**

Overwrite the entire file:

```tsx
import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import type { FreeWorkoutLog } from '../../types/workout-log';
import ActiveFreeWorkout from './ActiveFreeWorkout';

function createNewWorkout(): FreeWorkoutLog {
  return {
    sessionId: crypto.randomUUID(),
    startedAt: new Date(),
    exercises: [],
  };
}

export default function LogWorkoutView() {
  const [workout, setWorkout] = useState<FreeWorkoutLog | null>(null);

  if (workout) {
    return (
      <ActiveFreeWorkout
        log={workout}
        onChange={setWorkout}
        onFinish={() => setWorkout(null)}
        onCancel={() => setWorkout(null)}
      />
    );
  }

  // Idle state
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Dumbbell size={28} className="text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Start a Workout</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick exercises, add sets, log your lifts.
        </p>
      </div>
      <button
        onClick={() => setWorkout(createNewWorkout())}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold active:scale-[0.98] transition-transform"
      >
        Start Workout
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc -b --noEmit
```

Expected: no output.

- [ ] **Step 3: Start dev server and smoke-test the flow**

```bash
npm run dev
```

Open `http://localhost:3000/workout` in browser (or mobile emulator at 375px).

Verify:
1. Log tab shows idle card with "Start Workout" button
2. Tap "Start Workout" → active session appears with timer and "Add Exercise" button
3. Tap "Add Exercise" → sheet opens with search + muscle filter chips
4. Tap an exercise → sheet closes, exercise block appears in session
5. Tap "+ Add Set" inside the block → SetSchemeSheet opens
6. Select scheme (e.g. "Drop Set") + set count (e.g. 4) → tap "Add 4 Sets"
7. Sheet closes, 4 D-badged rows appear under the exercise
8. Fill in weight/reps in a row → tap circle → row dims and locks
9. Tap "Finish" button → completion screen with trophy, elapsed, set count
10. Tap "Back" → returns to idle
11. Tap X (cancel) during session → confirm dialog appears → confirm → idle state

- [ ] **Step 4: Commit**

```bash
git add src/apps/workout/components/log/LogWorkoutView.tsx
git commit -m "feat: implement free workout log flow replacing WIP placeholder"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Start new workout session (idle → active via "Start Workout")
- ✅ Select exercises from catalog (ExercisePickerSheet with search + muscle filter)
- ✅ Add sets from set types with count (SetSchemeSheet: 6 types + stepper)
- ✅ Empty template rows created per set (makeFreeSet factory)
- ✅ Log weight/reps/RIR/rest per set (FreeSetRow inputs)
- ✅ Mark set complete (circle → checkmark, row dims + locks)
- ✅ Elapsed timer (useElapsed in ActiveFreeWorkout)
- ✅ Finish → completion screen (trophy, elapsed, set count)
- ✅ Discard guard (window.confirm on cancel)
- ✅ Programs tab untouched

**Type consistency check:**
- `FreeSetType` defined in Task 1, used in Tasks 2, 4, 5 ✅
- `FreeSetLog` defined in Task 1, used in Tasks 4, 5 ✅
- `FreeExerciseLog` defined in Task 1, used in Tasks 5, 6 ✅
- `FreeWorkoutLog` defined in Task 1, used in Tasks 6, 7 ✅
- `makeFreeSet(type)` defined in Task 1, called in Task 5 ✅
- `makeFreeExerciseLog(exercise)` defined in Task 1, called in Task 6 ✅
- `FreeExerciseBlock` props: `{ log: FreeExerciseLog; onChange: (log) => void }` — matches Task 5 definition and Task 6 usage ✅
- `ActiveFreeWorkout` props: `{ log, onChange, onFinish, onCancel }` — matches Task 6 definition and Task 7 usage ✅
