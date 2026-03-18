# Workout Log App - Work In Progress

## Overview

A mobile-first workout logging app integrated into the BW Tracker project at `/workout/*`. Allows athletes to log training sessions, track progress, manage programs, and view workout analytics.

## Architecture

Located at `src/apps/workout/` with the same multi-app pattern as tracker and dashboard:

```
src/apps/workout/
├── WorkoutApp.tsx              # Main app with 4 tabs + bottom nav
├── components/
│   ├── log/LogWorkoutView.tsx           # Tab 1: Log a workout
│   ├── history/WorkoutHistoryView.tsx   # Tab 2: View past workouts
│   ├── programs/ProgramsView.tsx        # Tab 3: Manage programs
│   └── stats/WorkoutStatsView.tsx       # Tab 4: Analytics
├── hooks/                      # (empty - to be filled)
└── contexts/                   # (empty - to be filled)
```

## 4 Tabs

### 1. **Log Workout** 🎯 (in progress)
**Purpose**: Record a training session

**Planned features**:
- Select or create a program to log against
- Add exercises with sets, reps, weight/load, and RPE (rate of perceived exertion)
- Voice notes for exercise comments
- Auto-save to Dexie offline queue
- Sync to Supabase when online

**Data model**:
```typescript
interface WorkoutSession {
  id: string;
  user_id: string;
  date: string;
  program_id?: string;
  exercises: WorkoutExercise[];
  notes?: string;
  created_at: string;
}

interface WorkoutExercise {
  id: string;
  session_id: string;
  exercise_name: string;
  sets: WorkoutSet[];
  notes?: string;
}

interface WorkoutSet {
  id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  unit: 'kg' | 'lbs';
  rpe: number; // 1-10
  notes?: string;
}
```

### 2. **History** 📋 (in progress)
**Purpose**: View and manage past workouts

**Planned features**:
- Timeline of workouts (most recent first)
- Expandable cards showing all exercises for each session
- Edit/delete past workouts
- Filter by program, date range, or exercise
- Search by exercise name
- Offline support (stored in IndexedDB)

### 3. **Programs** 📖 (in progress)
**Purpose**: Create and manage workout program templates

**Planned features**:
- List user's programs (templates)
- Create new programs with weekly structure (Mon/Tue/Wed etc.)
- Define exercises per day with target sets, reps, and rest periods
- Clone existing programs to create variants
- Activate/deactivate programs for logging
- Sync with coach dashboard (coaches can assign programs)

**Data model**:
```typescript
interface WorkoutProgram {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface ProgramDay {
  id: string;
  program_id: string;
  day_of_week: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  exercises: ProgramExercise[];
}

interface ProgramExercise {
  id: string;
  program_day_id: string;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
  rest_seconds?: number;
}
```

### 4. **Stats** 📊 (in progress)
**Purpose**: Track progress and workout analytics

**Planned features**:
- Total volume (tonnage) by time period
- One-rep max (1RM) estimates for key lifts (calculated from Brzycki formula)
- Exercise frequency heatmap (which exercises, how often)
- Progress tracking for key lifts (squat, bench, deadlift, OHP)
- Workout consistency streaks
- Charts: volume trend, 1RM trend, exercise frequency

**Metrics**:
- **Volume**: Sum of (weight × reps) per session
- **1RM Estimate**: 1RM = weight × (36 / (37 - reps)) [Brzycki formula]
- **Streak**: Consecutive days with logged workouts
- **Frequency**: Exercises per week/month

## Integration Points

### Routing
- `/workout/*` route added to `src/shell/AppRouter.tsx`
- Lazy-loaded via React.lazy() for code-splitting
- Uses same Auth and Role contexts as other apps

### UI Link
- Added "Workout" button to tracker bottom nav (5th tab)
- Links to `/workout` from tracker home page
- Can also link from dashboard sidebar (future enhancement)

### Database
- Will use same Supabase instance as other apps
- RLS policies to be defined (users can only see their own workouts)
- Offline-first: uses Dexie IndexedDB syncQueue for offline writes
- Sync mechanism via `useSync()` hook (shared with tracker app)

### Offline Support
- Same architecture as daily logs
- Write to Dexie first, then sync when online
- Manual sync button (uses existing SyncHeader component pattern)

## TODO Checklist

### Data Layer
- [ ] Create `workouts` table in Supabase
- [ ] Create `workout_exercises` table
- [ ] Create `workout_sets` table
- [ ] Create `workout_programs` table
- [ ] Create `program_days` table
- [ ] Create `program_exercises` table
- [ ] Define RLS policies for all tables
- [ ] Add TypeScript types to `src/core/types/database.ts`

### Hooks (src/apps/workout/hooks/)
- [ ] `useWorkoutSessions(userId)` - Query past workouts
- [ ] `useActiveProgram(userId)` - Query active program
- [ ] `usePrograms(userId)` - List all programs
- [ ] `useExerciseFrequency(userId, days)` - Heatmap data
- [ ] `useOneRMEstimates(userId, exercise)` - 1RM calculations
- [ ] `useWorkoutStreak(userId)` - Consecutive days logged

### Components - Log Workout
- [ ] Form to select program or create session
- [ ] Exercise input component (name, sets/reps/weight/RPE)
- [ ] Set management UI (add/remove sets)
- [ ] Notes field with voice input (use Web Speech API)
- [ ] Offline sync indicator

### Components - History
- [ ] Workout timeline (flat list or calendar grid)
- [ ] Workout card component (expandable)
- [ ] Edit modal
- [ ] Delete confirmation
- [ ] Filter/search UI

### Components - Programs
- [ ] Program list
- [ ] Program creator wizard (7-day structure)
- [ ] Exercise builder (target sets/reps)
- [ ] Clone program dialog
- [ ] Activate/deactivate toggle

### Components - Stats
- [ ] Volume chart (Recharts line chart)
- [ ] 1RM trend chart
- [ ] Exercise frequency heatmap
- [ ] Streak display
- [ ] Key lift progress cards

## Styling Notes

- Mobile-first: 375px minimum width
- Follows BW Tracker's Tailwind + shadcn/ui pattern
- Dark mode support (CSS custom properties via Tailwind)
- Bottom navigation matches tracker/dashboard (4-5 buttons)
- Responsive: grows to desktop (tablet-friendly)

## Performance Considerations

- Lazy-load chart components (Recharts) to reduce initial bundle
- Paginate history view (50 workouts per page)
- Debounce exercise search
- Cache program list (10-minute stale time)
- IndexedDB for offline workouts (same as daily logs)

## Future Enhancements

- Push notifications for workout reminders
- Wearable integration (Apple Watch, Wear OS)
- Sharing workouts with coach (read-only)
- AI-powered 1RM predictions
- Volume auto-regulation (suggest weights based on RPE)
- Integration with Apple Health / Google Fit
