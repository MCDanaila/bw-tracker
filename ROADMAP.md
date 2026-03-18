# BW Tracker -- Dashboard & Coach Panel Implementation Roadmap

> **Created**: 2026-03-17
> **Specification**: See `DASHBOARD_SPEC.md` for full product spec
> **Current Stack**: React 19 + Vite 7 + TypeScript 5.9 + Tailwind v4 + Supabase + TanStack Query + Dexie + shadcn/ui + Recharts
> **New Dependencies**: `react-router-dom`, `@tanstack/react-table`, `@dnd-kit/core`, `@dnd-kit/sortable`

---

## Table of Contents

- [Phase 0: Prerequisites and Foundation Setup](#phase-0-prerequisites-and-foundation-setup)
- [Phase 1: Athlete Dashboard](#phase-1-athlete-dashboard)
- [Phase 2: Food and Diet Management](#phase-2-food-and-diet-management)
- [Phase 3: Coach Multi-Athlete Panel](#phase-3-coach-multi-athlete-panel)
- [Phase 4: Analytics and Alerts](#phase-4-analytics-and-alerts)
- [Phase 5: Polish and Optimization](#phase-5-polish-and-optimization)
- [Appendix A: File Index](#appendix-a-file-index)
- [Appendix B: Migration Execution Order](#appendix-b-migration-execution-order)

---

## Phase 0: Prerequisites and Foundation Setup

This phase sets up routing, the dashboard layout shell, database role system, and the coach-athlete relationship table. No visible features are delivered -- this is pure scaffolding.

### Database

#### [x] P0-T01: Add `role` column to `profiles` table and create helper functions

**Description**: Write and execute a Supabase migration that adds the `role` column to the existing `profiles` table and creates the two SQL helper functions (`get_my_role()` and `is_coach_of()`) that all subsequent RLS policies depend on.

**Files to create**:
- `supabase/migrations/001_add_role_and_helpers.sql`

**SQL to include**:
```sql
ALTER TABLE profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'athlete'
  CHECK (role IN ('athlete', 'coach'));

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coach_of(target_athlete_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_athletes
    WHERE coach_id = auth.uid()
      AND athlete_id = target_athlete_id
      AND status = 'active'
  );
$$;
```

Also add a profile update policy that prevents role self-escalation (see DASHBOARD_SPEC.md Section 7.4).

**Acceptance criteria**:
- Migration runs without errors on local Supabase instance
- `SELECT get_my_role()` returns `'athlete'` for existing users
- Existing app continues to work unchanged (role defaults to `'athlete'`)
- The `profiles` update policy prevents changing `role` via client

**Dependencies**: None

---

#### [x] P0-T02: Create `coach_athletes` relationship table

**Description**: Write and execute a Supabase migration creating the `coach_athletes` table that maps coach users to athlete users. This table is required by the `is_coach_of()` function from P0-T01.

**Files to create**:
- `supabase/migrations/002_create_coach_athletes.sql`

**SQL to include**:
```sql
CREATE TABLE public.coach_athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  terminated_at TIMESTAMPTZ,
  UNIQUE(coach_id, athlete_id),
  CHECK (coach_id != athlete_id)
);

ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches see their own relationships"
  ON coach_athletes FOR SELECT
  USING (coach_id = auth.uid() OR athlete_id = auth.uid());

CREATE POLICY "Coaches can manage relationships"
  ON coach_athletes FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
```

**Acceptance criteria**:
- Table created with all constraints
- RLS enabled: coaches can see/manage their own rows, athletes can see rows where they are the athlete
- `is_coach_of()` returns `TRUE` after inserting a test row

**Dependencies**: P0-T01

---

#### [x] P0-T03: Update TypeScript types for new DB columns and tables

**Description**: Update `src/types/database.ts` to add the `role` field to any profile-related types, and add new interfaces for `CoachAthlete`. Also update the `UserProfile` interface in `src/hooks/useProfile.ts` to include `role`.

**Files to modify**:
- `src/types/database.ts` -- add `CoachAthlete` interface
- `src/hooks/useProfile.ts` -- add `role: 'athlete' | 'coach'` to `UserProfile` interface

**New types**:
```typescript
export interface CoachAthlete {
  id: string;
  coach_id: string;
  athlete_id: string;
  status: 'active' | 'paused' | 'terminated';
  assigned_at: string;
  terminated_at: string | null;
}
```

**Acceptance criteria**:
- TypeScript compiles without errors
- `UserProfile.role` is typed as `'athlete' | 'coach'`
- Existing code is unaffected (role has a default value in DB)

**Dependencies**: P0-T01, P0-T02

---

### Routing

#### [x] P0-T04: Install `react-router-dom` and wire up shell routing in `main.tsx`

**Description**: Install `react-router-dom` as a dependency. Refactor `src/main.tsx` to use `BrowserRouter` and define two top-level routes: `/` renders the existing `App.tsx` (mobile shell, unchanged), and `/dashboard/*` renders a new `DashboardApp.tsx` (to be built in P0-T06). Both shells share the same `AuthProvider` and `QueryClientProvider`.

**Files to modify**:
- `src/main.tsx` -- wrap in `BrowserRouter`, add `Routes`/`Route` for `/` and `/dashboard/*`

**Commands to run**:
```bash
npm install react-router-dom
```

**New `main.tsx` structure**:
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// ... existing imports ...

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard/*" element={<DashboardApp />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

**Acceptance criteria**:
- `npm run dev` starts without errors
- Navigating to `http://localhost:5173/` shows the existing mobile app unchanged
- Navigating to `http://localhost:5173/dashboard` shows the DashboardApp placeholder
- No regressions in existing app functionality

**Dependencies**: None

---

#### [x] P0-T05: Define all dashboard routes

**Description**: Create a route configuration file that defines all dashboard routes from DASHBOARD_SPEC.md Section 4.2. This file exports route constants and the nested `Routes` component used inside `DashboardApp.tsx`.

**Files to create**:
- `src/components/dashboard-panel/routes.tsx`

**Route definitions** (all lazy-loaded with `React.lazy`):
```
/dashboard                    -> OverviewPage
/dashboard/progress           -> ProgressPage
/dashboard/athletes           -> AthletesPage (coach only)
/dashboard/athletes/:id       -> AthleteDetailPage (coach only)
/dashboard/athletes/:id/progress -> AthleteDetailPage w/ progress tab
/dashboard/athletes/:id/diet  -> AthleteDetailPage w/ diet tab
/dashboard/athletes/:id/goals -> AthleteDetailPage w/ goals tab
/dashboard/diet               -> DietEditorPage
/dashboard/diet/foods         -> FoodDatabasePage
/dashboard/diet/templates     -> TemplatesPage (coach only)
/dashboard/goals              -> GoalsPage
/dashboard/settings           -> SettingsPage
```

Each page component is a placeholder `<div>Page Name - TODO</div>` for now.

**Acceptance criteria**:
- All routes resolve to placeholder components
- URL changes reflect in the browser address bar
- Non-existent dashboard routes show a 404 placeholder

**Dependencies**: P0-T04

---

### Layout

#### [x] P0-T06: Create `DashboardApp.tsx` entry shell

**Description**: Create the top-level dashboard shell component. It wraps the content area in an `AthleteProvider` context (placeholder for now) and renders the `DashboardShell` layout. It is responsible for auth guarding (redirect to `/` if not authenticated).

**Files to create**:
- `src/components/dashboard-panel/DashboardApp.tsx`

**Structure**:
```typescript
export default function DashboardApp() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/" />;

  return (
    <AthleteProvider>
      <DashboardShell>
        <DashboardRoutes />
      </DashboardShell>
    </AthleteProvider>
  );
}
```

**Acceptance criteria**:
- Unauthenticated users are redirected to `/`
- Authenticated users see the shell layout with sidebar and content area
- Loading state shows a spinner

**Dependencies**: P0-T04, P0-T05, P0-T07, P0-T08

---

#### [x] P0-T07: Build `DashboardShell` layout component

**Description**: Create the main layout wrapper that renders a sidebar on the left and content area on the right. Implements the responsive breakpoint strategy from DASHBOARD_SPEC.md Section 5.2: full sidebar at xl (256px), narrower at lg (224px), icon rail at md (64px), and slide-over drawer below md.

**Files to create**:
- `src/components/dashboard-panel/layout/DashboardShell.tsx`

**Props**:
```typescript
interface DashboardShellProps {
  children: React.ReactNode;
}
```

**Implementation details**:
- Uses a `useState` for sidebar collapsed/expanded state
- CSS grid layout: `grid-cols-[256px_1fr]` at xl, `grid-cols-[224px_1fr]` at lg, `grid-cols-[64px_1fr]` at md
- Below md: sidebar hidden, replaced by `MobileDrawer` (built in P0-T10)
- Content area has `overflow-y-auto` and full height (`h-screen`)
- Includes a `TopHeader` bar above the content area (built in P0-T09)

**Acceptance criteria**:
- At 1280px+: sidebar is 256px wide, content fills remainder
- At 1024px: sidebar is 224px
- At 768px: sidebar collapses to 64px icon rail
- Below 768px: sidebar not visible (drawer trigger in header)
- Content scrolls independently of sidebar

**Dependencies**: None (can be built in parallel with other layout tasks)

---

#### [x] P0-T08: Build `Sidebar` and `SidebarNav` components

**Description**: Create the sidebar navigation that is role-aware. It reads the user's role from the profile (via `useProfile` hook) and renders different nav items for athletes vs coaches, as defined in DASHBOARD_SPEC.md Section 4.3. Uses `NavLink` from react-router-dom for active state highlighting.

**Files to create**:
- `src/components/dashboard-panel/layout/Sidebar.tsx`
- `src/components/dashboard-panel/layout/SidebarNav.tsx`

**Sidebar.tsx** renders:
- App logo/name at top
- `SidebarNav` component with nav items
- User menu at bottom (email, sign out button)

**SidebarNav.tsx** takes:
```typescript
interface SidebarNavProps {
  collapsed: boolean;  // true when in icon-rail mode
}
```

**Nav items use Lucide icons**: `LayoutDashboard`, `TrendingUp`, `Apple`, `Target`, `Settings`, `Users`, `Database`, `FileStack`

**Athlete nav items**: Overview, Progress, My Diet, Goals, Settings
**Coach nav items**: Overview, Athletes, Diet Editor, Food Database, Templates, Goals, Settings

**Acceptance criteria**:
- Athlete users see 5 nav items
- Coach users see 7 nav items
- Active route is visually highlighted (e.g., background color + bold text)
- In collapsed mode (icon rail), only icons show with tooltips on hover
- Clicking a nav item navigates to the correct route

**Dependencies**: P0-T03 (needs `role` on UserProfile), P0-T04

---

#### [x] P0-T09: Build `TopHeader` component

**Description**: Create the top header bar that sits above the content area inside the dashboard shell. It shows: a sidebar toggle button (hamburger/X), a `Breadcrumbs` component, and the user avatar/name on the right.

**Files to create**:
- `src/components/dashboard-panel/layout/TopHeader.tsx`

**Props**:
```typescript
interface TopHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}
```

**Renders**:
- Left: hamburger button (visible only below md breakpoint), breadcrumbs
- Right: user avatar circle (first letter of email), role badge ("Coach" or "Athlete")

**Acceptance criteria**:
- Hamburger button only visible below md breakpoint
- Clicking hamburger opens the mobile drawer (event passed up via `onToggleSidebar`)
- User avatar shows first letter of email
- Role badge shows "Coach" with a distinct color if user is coach

**Dependencies**: P0-T07

---

#### [x] P0-T10: Build `MobileDrawer` component

**Description**: Create a slide-over drawer that contains the sidebar navigation for mobile viewports (below 768px). Uses the shadcn `dialog` component (already installed) as the underlying primitive, or a custom implementation with Tailwind transitions.

**Files to create**:
- `src/components/dashboard-panel/layout/MobileDrawer.tsx`

**Props**:
```typescript
interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}
```

**Implementation**:
- Slides in from the left with a backdrop overlay
- Contains the same `SidebarNav` component used in the desktop sidebar
- Closes on backdrop click, Escape key, or nav item click
- Animates with `transition-transform duration-300`

**Acceptance criteria**:
- Drawer opens/closes with smooth animation
- Backdrop overlay dims the content area
- Clicking any nav item closes the drawer and navigates
- Escape key closes the drawer
- Focus trapped inside drawer when open

**Dependencies**: P0-T08

---

#### [x] P0-T11: Build `Breadcrumbs` component

**Description**: Create a route-aware breadcrumb trail that shows the current location within the dashboard. Uses `useLocation` and `useMatches` from react-router-dom to derive breadcrumb segments.

**Files to create**:
- `src/components/dashboard-panel/layout/Breadcrumbs.tsx`

**Mapping examples**:
- `/dashboard` -> "Dashboard"
- `/dashboard/progress` -> "Dashboard / Progress"
- `/dashboard/athletes/123` -> "Dashboard / Athletes / [Athlete Name]"
- `/dashboard/diet/foods` -> "Dashboard / Diet / Food Database"

**Acceptance criteria**:
- Breadcrumbs update on every route change
- Each segment except the last is a clickable link
- Handles athlete name lookup for `/athletes/:id` routes (shows "..." while loading)

**Dependencies**: P0-T05

---

#### [x] P0-T12: Create `AthleteProvider` context (stub)

**Description**: Create the `AthleteContext` and `AthleteProvider` that will be the central state mechanism for the "active athlete" pattern described in DASHBOARD_SPEC.md Section 5.6. For now, this is a stub that always returns the current user as the effective user.

**Files to create**:
- `src/components/dashboard-panel/contexts/AthleteContext.tsx`

**Interface**:
```typescript
interface AthleteContextValue {
  activeAthleteId: string | null;       // null = viewing own data
  setActiveAthleteId: (id: string | null) => void;
  isCoach: boolean;
  effectiveUserId: string;              // The ID to use for all queries
}
```

**Initial implementation**:
- `isCoach` reads from `useProfile().data?.role === 'coach'`
- `effectiveUserId` returns `activeAthleteId ?? user.id`
- `activeAthleteId` defaults to `null`
- `setActiveAthleteId` is a simple `useState` setter

**Acceptance criteria**:
- Context provides `effectiveUserId` that equals `user.id` for athletes
- Context provides `effectiveUserId` that can be switched for coaches
- TypeScript types are correct and exported

**Dependencies**: P0-T03

---

### Design System

#### [x] P0-T13: Add dashboard-specific CSS tokens to `index.css`

**Description**: Extend the existing Tailwind v4 theme in `src/index.css` with the dashboard-specific semantic color tokens and typography utilities defined in DASHBOARD_SPEC.md Sections 6.1-6.3.

**Files to modify**:
- `src/index.css` -- add inside the existing `@theme inline { }` block

**Tokens to add**:
- Metric colors: `--color-metric-weight`, `--color-metric-sleep`, `--color-metric-training`, `--color-metric-diet`, `--color-metric-steps`, `--color-metric-recovery`
- Status colors: `--color-status-excellent`, `--color-status-good`, `--color-status-warning`, `--color-status-danger`, `--color-status-neutral`
- Chart palette: `--color-chart-1` through `--color-chart-8`

**Also add utility classes**:
```css
.grid-stats { @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4; }
.grid-panels { @apply grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6; }
.grid-equal { @apply grid grid-cols-1 lg:grid-cols-2 gap-6; }
.dashboard-content { container-type: inline-size; }
```

**Acceptance criteria**:
- Tailwind recognizes new color tokens (e.g., `text-metric-weight` works)
- Grid utility classes apply correct layouts at each breakpoint
- Existing app styling is unaffected

**Dependencies**: None

---

### Phase Wrap-Up

#### [x] P0-T14: Phase 0 verification and changelog

**Description**: Run the full build and lint pass. Verify every placeholder page renders at its route. Verify the existing mobile app at `/` is completely unaffected. Update `CHANGELOG.md` with Phase 0 summary. Mark all Phase 0 tasks as done.

**Acceptance criteria**:
- `npm run build` passes with zero errors
- `npm run lint` passes with zero errors (or only pre-existing warnings)
- All 13 dashboard routes render their placeholder content
- Mobile app at `/` works identically to before Phase 0
- `CHANGELOG.md` updated with Phase 0 entry
- All P0 tasks in this roadmap marked `[x]`

**Dependencies**: All P0 tasks

---

## Phase 1: Athlete Dashboard

This phase delivers the athlete-facing dashboard: stat cards, weight trend chart, recovery gauge, compliance rings, biofeedback radar, steps bar chart, and the goals editor. By the end of this phase, athletes have a fully functional desktop analytics view.

### Hooks / State

#### [x] P1-T01: Parameterize `useDashboardData` hook to accept optional `userId`

**Description**: Modify the `useDashboardData` hook in `src/hooks/useDashboardData.ts` to accept an optional `userId` parameter. When provided, it fetches data for that user instead of the authenticated user. This is a non-breaking change -- all existing call sites pass no argument and get current behavior.

**Files to modify**:
- `src/hooks/useDashboardData.ts`

**Changes**:
```typescript
// Before
export const useDashboardData = (range: TimeRange) => {
  const { user } = useAuth();
  // uses user.id

// After
export const useDashboardData = (range: TimeRange, userId?: string) => {
  const { user } = useAuth();
  const targetId = userId ?? user?.id;
  // uses targetId everywhere, query key includes targetId
```

**Acceptance criteria**:
- Existing call sites (no `userId` arg) work identically
- Passing a `userId` fetches that user's data
- TanStack Query cache key includes the target user ID
- TypeScript compiles without errors

**Dependencies**: P0-T03

---

#### [x] P1-T02: Parameterize `useProfile` hook to accept optional `userId`

**Description**: Same pattern as P1-T01 but for `src/hooks/useProfile.ts`. The hook already returns `UserProfile` -- add an optional `userId` parameter.

**Files to modify**:
- `src/hooks/useProfile.ts`

**Changes**:
```typescript
export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId ?? user?.id;
  return useQuery({
    queryKey: ['profile', targetId],
    // ...fetch for targetId
  });
};
```

**Acceptance criteria**:
- Existing call sites work identically
- `useProfile('some-uuid')` fetches that user's profile
- TypeScript compiles without errors

**Dependencies**: P0-T03

---

#### [x] P1-T03: Parameterize `useHistoryLogs` hook to accept optional `userId`

**Description**: Same pattern for `src/hooks/useHistoryLogs.ts`.

**Files to modify**:
- `src/hooks/useHistoryLogs.ts`

**Changes**: Accept optional `userId?: string`, use `userId ?? user?.id` as `targetId`, include `targetId` in query key.

**Acceptance criteria**:
- Existing call sites work identically
- TypeScript compiles without errors

**Dependencies**: P0-T03

---

#### [x] P1-T04: Parameterize `useStreak` hook to accept optional `userId`

**Description**: Same pattern for `src/hooks/useStreak.ts`. Note: this hook also reads from `localDB.syncQueue` (Dexie). When a foreign `userId` is provided, skip the local queue lookup (offline data is only for the current user).

**Files to modify**:
- `src/hooks/useStreak.ts`

**Changes**:
```typescript
export function useStreak(userId?: string): number {
  const { user } = useAuth();
  const targetId = userId ?? user?.id;
  const isOwnData = !userId || userId === user?.id;

  const { data: remoteLogs } = useHistoryLogs(targetId);
  // Only read local sync queue for own data
  const localActions = useLiveQuery(
    () => isOwnData
      ? localDB.syncQueue.where('mutation_type').equals('UPSERT_DAILY_LOG').toArray()
      : Promise.resolve([]),
    [isOwnData]
  );
  // ...rest unchanged
}
```

**Acceptance criteria**:
- Existing call sites work identically
- Foreign userId skips local queue
- TypeScript compiles without errors

**Dependencies**: P1-T03

---

#### [x] P1-T05: Parameterize `useDietData` hook to accept optional `userId`

**Description**: Same pattern for `src/hooks/useDietData.ts`.

**Files to modify**:
- `src/hooks/useDietData.ts`

**Changes**: Accept optional `userId?: string`, use it in the Supabase query filter instead of `session.user.id`. Update query key.

**Acceptance criteria**:
- Existing call sites work identically
- TypeScript compiles without errors

**Dependencies**: P0-T03

---

#### [x] P1-T06: Create `useDashboardStats` hook for derived stat card data

**Description**: Create a new hook that computes the four stat card values shown on the athlete overview (DASHBOARD_SPEC.md Section 5.3): current weight, 7-day average weight, logging streak, and average steps (7d). This hook composes `useDashboardData` and `useStreak`.

**Files to create**:
- `src/components/dashboard-panel/hooks/useDashboardStats.ts`

**Interface**:
```typescript
interface DashboardStats {
  currentWeight: number | null;
  sevenDayAvgWeight: number | null;
  streak: number;
  avgSteps7d: number | null;
  weightDelta7d: number | null;    // vs previous 7d avg
  isLoading: boolean;
}

export function useDashboardStats(userId?: string): DashboardStats;
```

**Calculation logic**:
- Current weight = most recent `weight_fasting` value
- 7d avg = mean of last 7 weight entries
- Streak from `useStreak(userId)`
- Avg steps = mean of last 7 `steps` entries
- Weight delta = current 7d avg - previous 7d avg (days 8-14)

**Acceptance criteria**:
- Returns correct values when data exists
- Returns null for metrics without enough data
- Handles empty data gracefully (no crashes)
- Loading state reflects underlying query states

**Dependencies**: P1-T01, P1-T04

---

#### [x] P1-T07: Create `useRecoveryScore` hook

**Description**: Create a hook that computes the recovery score (0-100) from the latest daily log data, following the formula in DASHBOARD_SPEC.md Section 8.1: `sleep (30%) + HRV (25%) + soreness (20%) + stress (15%) + energy (10%)`.

**Files to create**:
- `src/components/dashboard-panel/hooks/useRecoveryScore.ts`

**Interface**:
```typescript
interface RecoveryScoreResult {
  score: number | null;         // 0-100
  components: {
    sleep: number | null;       // normalized 0-100
    hrv: number | null;
    soreness: number | null;
    stress: number | null;
    energy: number | null;
  };
  trend: 'up' | 'down' | 'stable' | null;  // vs 7d ago
  isLoading: boolean;
}

export function useRecoveryScore(userId?: string): RecoveryScoreResult;
```

**Normalization** (using existing scale ranges from `src/lib/constants.ts`):
- Sleep: `(sleep_hours / 8 * 0.4) + (sleep_quality / 3 * 0.3) + (sleep_score / 100 * 0.3)` scaled to 0-100
- HRV: use 7-day z-score relative to 30-day baseline, map to 0-100
- Soreness: invert scale (1=good=100, 3=bad=33) -- `soreness_level` uses 1-3 range per schema
- Stress: invert scale (1=low=100, 3=high=33) -- `stress_level` uses 1-3 range per schema
- Energy: `(value / 3) * 100` -- `daily_energy` uses 1-3 range per schema

**Acceptance criteria**:
- Returns a score between 0-100 when data is available
- Returns null when insufficient data
- Trend compares today's score vs 7 days ago

**Dependencies**: P1-T03

---

#### [x] P1-T08: Create `useComplianceRings` hook

**Description**: Create a hook that computes the three compliance percentages for the weekly compliance rings: diet adherence, training sessions completed, and steps goal achievement.

**Files to create**:
- `src/components/dashboard-panel/hooks/useComplianceRings.ts`

**Interface**:
```typescript
interface ComplianceRingsData {
  diet: number;       // 0-100, weekly adherence score
  training: number;   // 0-100, sessions completed / planned
  steps: number;      // 0-100, days at goal / 7
  isLoading: boolean;
}

export function useComplianceRings(userId?: string): ComplianceRingsData;
```

**Calculation** (last 7 days of daily_logs):
- Diet: map `perfect=100, minor_deviation=70, cheat_meal=30` (values from `diet_adherence` column), average across days with data
- Training: count days where `workout_session` is not null and not "Rest" / expected sessions (default 5)
- Steps: count days where `steps >= steps_goal` / 7 (using `steps_goal` from daily_logs or profile default of 10000)

**Acceptance criteria**:
- All three values return 0-100
- Handles missing data (returns 0 for no data)
- Uses the user's `steps_goal` from profile, falling back to `STEPS_GOAL_DEFAULT` (10000) from `src/hooks/useProfile.ts`

**Dependencies**: P1-T03, P1-T02

---

#### [x] P1-T09: Create `useBiofeedbackRadar` hook

**Description**: Create a hook that gathers the 6 biofeedback axes for the radar chart: digestion, energy, mood, hunger, libido, and stress. Returns both current week average and previous week average.

**Files to create**:
- `src/components/dashboard-panel/hooks/useBiofeedbackRadar.ts`

**Interface**:
```typescript
interface BiofeedbackAxis {
  axis: string;
  currentWeek: number;    // normalized 0-100
  previousWeek: number;   // normalized 0-100
}

interface BiofeedbackRadarData {
  axes: BiofeedbackAxis[];  // 6 items
  isLoading: boolean;
}

export function useBiofeedbackRadar(userId?: string): BiofeedbackRadarData;
```

**Normalization** (to 0-100 scale, using ranges from `src/lib/constants.ts`):
- Digestion: `(value / 4) * 100` -- `digestion_rating` is 1-4 per `DIGESTION_OPTIONS`
- Energy: `(value / 3) * 100` -- `daily_energy` is 1-3 per `ENERGY_OPTIONS`
- Mood: `(value / 5) * 100` -- `mood` is 1-5 per `MOOD_OPTIONS`
- Hunger: invert -- `((6 - value) / 5) * 100` so 1 (no hunger) = 100, 5 (starving) = 20
- Libido: `(value / 5) * 100` -- `libido` is 1-5 per `LIBIDO_OPTIONS`
- Stress: invert -- `((4 - value) / 3) * 100` so 1 (low) = 100, 3 (high) = 33

**Acceptance criteria**:
- Returns 6 axes with both current and previous week values
- All values normalized to 0-100
- Handles missing individual days gracefully (averages only available days)

**Dependencies**: P1-T03

---

### Frontend / Components

#### [x] P1-T10: Build `StatCard` component

**Description**: Create a reusable stat card component that displays a single metric with label, value, optional trend indicator, and optional comparison text. Used throughout both athlete and coach dashboards.

**Files to create**:
- `src/components/dashboard-panel/components/StatCard.tsx`

**Props**:
```typescript
interface StatCardProps {
  label: string;                    // e.g., "Current Weight"
  value: string | number;          // e.g., "82.3 kg"
  icon?: React.ReactNode;          // Lucide icon
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;                 // e.g., "-0.5 kg" or "+2%"
    isPositive?: boolean;          // green or red (losing weight = positive in cut)
  };
  color?: string;                  // Tailwind color class for accent
  isLoading?: boolean;             // Show skeleton
}
```

**Implementation**:
- Uses shadcn `Card` component (`src/components/ui/card.tsx`) as base
- Typography: value uses `text-3xl font-bold`, label uses `text-xs uppercase tracking-wide text-muted-foreground`
- Trend arrow: up arrow (green/red based on `isPositive`), down arrow, or dash
- Loading state: pulse skeleton matching the card dimensions

**Acceptance criteria**:
- Renders correctly with all prop combinations
- Loading skeleton matches card dimensions
- Trend indicator colors are correct (green for positive, red for negative)
- Responsive: cards stack in 1-col on mobile, 2-col on sm, 4-col on lg (via parent `grid-stats` class)

**Dependencies**: None

---

#### [x] P1-T11: Build `RecoveryGauge` component

**Description**: Create a radial gauge (270-degree arc) that displays the recovery score from 0-100 with color zones, as specified in DASHBOARD_SPEC.md Section 6.4.

**Files to create**:
- `src/components/dashboard-panel/components/RecoveryGauge.tsx`

**Props**:
```typescript
interface RecoveryGaugeProps {
  score: number | null;    // 0-100
  trend?: 'up' | 'down' | 'stable' | null;
  isLoading?: boolean;
}
```

**Implementation**:
- SVG-based radial arc (270 degrees, open at bottom)
- Color zones on the background arc: 0-40 red (`--color-status-danger`), 41-60 amber (`--color-status-warning`), 61-80 green (`--color-status-good`), 81-100 bright green (`--color-status-excellent`)
- Animated fill arc that sweeps to the score value
- Large score number centered inside the gauge
- Trend arrow below the score
- Wrapped in shadcn `Card` with title "Recovery Score"

**Acceptance criteria**:
- Score of 0 shows empty arc
- Score of 100 shows full arc (270 degrees)
- Colors match the zone the score falls in
- Animation plays on mount (CSS transition or requestAnimationFrame)
- Null score shows "--" with empty arc
- Loading state shows skeleton

**Dependencies**: P0-T13

---

#### [x] P1-T12: Build `ComplianceRings` component

**Description**: Create three concentric progress rings showing diet, training, and steps compliance percentages. Inspired by Apple's Activity Rings.

**Files to create**:
- `src/components/dashboard-panel/components/ComplianceRings.tsx`

**Props**:
```typescript
interface ComplianceRingsProps {
  diet: number;       // 0-100
  training: number;   // 0-100
  steps: number;      // 0-100
  isLoading?: boolean;
}
```

**Implementation**:
- Three concentric SVG circles using `stroke-dasharray` and `stroke-dashoffset` for progress
- Outer ring (largest): Diet adherence -- `--color-metric-diet` (amber)
- Middle ring: Training -- `--color-metric-training` (orange)
- Inner ring (smallest): Steps -- `--color-metric-steps` (emerald)
- Legend below with colored dots and percentage labels
- Animated on mount
- Wrapped in shadcn `Card` with title "Weekly Compliance"

**Acceptance criteria**:
- Three rings render concentrically with correct colors
- 0% = empty ring, 100% = full circle
- Values above 100% handled gracefully (cap at full circle or show overflow)
- Legend shows color, metric name, and percentage
- Loading state shows skeleton rings

**Dependencies**: P0-T13

---

#### [x] P1-T13: Build `BiofeedbackRadar` component

**Description**: Create a radar/spider chart component using Recharts `RadarChart` that compares current week vs previous week across 6 biofeedback axes.

**Files to create**:
- `src/components/dashboard-panel/components/BiofeedbackRadar.tsx`

**Props**:
```typescript
interface BiofeedbackRadarProps {
  axes: Array<{
    axis: string;
    currentWeek: number;
    previousWeek: number;
  }>;
  isLoading?: boolean;
}
```

**Implementation**:
- Uses Recharts `RadarChart`, `PolarGrid`, `PolarAngleAxis`, `Radar` (Recharts already installed as `recharts@2.15.4`)
- Current week: solid blue fill (30% opacity) with solid blue stroke
- Previous week: no fill, grey dashed stroke
- Axis labels around the perimeter
- Legend at bottom: "This Week" (blue), "Last Week" (grey dashed)
- Wrapped in shadcn `Card` with title "Biofeedback"

**Acceptance criteria**:
- Renders 6-axis radar chart correctly
- Both data series visible with distinct styling
- Handles missing axes gracefully
- Responsive: scales to container width
- Loading state shows card skeleton

**Dependencies**: None (Recharts already installed)

---

#### [x] P1-T14: Build enhanced Weight Trend Chart for dashboard

**Description**: Create a new weight trend chart component that adds moving averages and goal line on top of the raw data points. The existing `WeightChart` in `src/components/dashboard/WeightChart.tsx` is a basic line chart. This new version adds: raw data as scatter dots (low opacity), 7-day MA as solid line, 14-day MA as dashed line, and a horizontal goal line.

**Files to create**:
- `src/components/dashboard-panel/components/WeightTrendChart.tsx`

**Props**:
```typescript
interface WeightTrendChartProps {
  data: Array<{ date: string; weight_fasting: number | null }>;
  targetWeight?: number | null;
  dateRange: TimeRange;
  isLoading?: boolean;
}
```

**Implementation**:
- Uses Recharts `ComposedChart` with `Scatter` (raw dots, opacity 0.3), `Line` (7d MA, solid, `--color-metric-weight`), `Line` (14d MA, dashed grey), `ReferenceLine` (goal weight, red dashed)
- Moving average calculation done in-component (simple sliding window)
- Date range selector (7d, 14d, 1m, 3m, all) as a button group above the chart (using shadcn `button-group` from `src/components/ui/button-group.tsx`)
- Tooltip shows: date, raw weight, 7d MA, 14d MA
- Wrapped in shadcn `Card` with title "Weight Trend"

**Acceptance criteria**:
- Raw dots visible at low opacity
- 7-day MA line smooth and solid
- 14-day MA line smooth and dashed
- Goal line visible when `targetWeight` provided
- Date range buttons switch the view
- Responsive: chart fills container width
- Loading state shows card skeleton

**Dependencies**: P1-T01

---

#### [x] P1-T15: Build Steps Bar Chart component for dashboard

**Description**: Create a steps bar chart that shows daily steps vs goal with color-coded compliance, as specified in DASHBOARD_SPEC.md Section 6.4.

**Files to create**:
- `src/components/dashboard-panel/components/StepsBarChart.tsx`

**Props**:
```typescript
interface StepsBarChartProps {
  data: Array<{ date: string; shortDate: string; steps: number | null }>;
  stepsGoal: number;
  isLoading?: boolean;
}
```

**Implementation**:
- Recharts `BarChart` with custom bar colors based on compliance:
  - Green (`--color-status-excellent`): steps >= goal
  - Amber (`--color-status-warning`): steps >= 80% of goal
  - Red (`--color-status-danger`): steps < 80% of goal
- Horizontal reference line at goal value
- Tooltip shows date, step count, and percentage of goal
- Wrapped in shadcn `Card` with title "Daily Steps"

**Acceptance criteria**:
- Bars colored correctly based on threshold
- Goal line visible
- Tooltip displays useful information
- Handles null steps (shows empty/grey bar)

**Dependencies**: P0-T13

---

#### [x] P1-T16: Build `TrainingCalendarStrip` component

**Description**: Create a weekly calendar strip showing 7 days with workout types, RPE colors, and duration. This is a P2 feature per the spec but is straightforward to include alongside other dashboard widgets.

**Files to create**:
- `src/components/dashboard-panel/components/TrainingCalendarStrip.tsx`

**Props**:
```typescript
interface TrainingDay {
  date: string;
  dayLabel: string;          // e.g., "Lun", "Mar"
  workoutSession: string | null;   // e.g., "Push", "Pull", "Rest" (values from WORKOUT_TYPES in constants.ts)
  rpe: number | null;              // 1-10 scale (gym_rpe column)
  duration: number | null;         // minutes (workout_duration column)
}

interface TrainingCalendarStripProps {
  days: TrainingDay[];       // 7 items
  isLoading?: boolean;
}
```

**Implementation**:
- 7-cell horizontal strip (flexbox, equal width)
- Each cell shows: day label, workout type icon/text, RPE color dot (green 1-4, amber 5-7, red 8-10), duration in minutes
- Rest days show a dimmed cell
- Current day highlighted with primary border
- Wrapped in shadcn `Card` with title "Training This Week"

**Acceptance criteria**:
- Renders 7 days correctly
- RPE colors match the scale
- Rest days visually distinct from training days
- Responsive: cells shrink proportionally

**Dependencies**: None

---

#### [x] P1-T17: Build Athlete `OverviewPage`

**Description**: Assemble the athlete dashboard overview page using the stat cards, weight trend chart, recovery gauge, compliance rings, biofeedback radar, training calendar strip, and steps bar chart. This is the main page athletes see at `/dashboard`.

**Files to modify**:
- `src/components/dashboard-panel/pages/OverviewPage.tsx` (replace placeholder from P0-T05)

**Layout** (matches wireframe in DASHBOARD_SPEC.md Section 5.3):
```
Row 1: Welcome message + date range selector
Row 2: 4x StatCard (Current Wt, 7d Avg Wt, Streak, Steps Avg) in grid-stats
Row 3: WeightTrendChart (full width)
Row 4: RecoveryGauge (left) + ComplianceRings (right) in grid-equal
Row 5: TrainingCalendarStrip (left) + BiofeedbackRadar (right) in grid-equal
```

**Data sources**:
- `useDashboardStats(effectiveUserId)` for stat cards
- `useDashboardData(range, effectiveUserId)` for weight + steps charts
- `useRecoveryScore(effectiveUserId)` for gauge
- `useComplianceRings(effectiveUserId)` for rings
- `useBiofeedbackRadar(effectiveUserId)` for radar
- `useHistoryLogs(effectiveUserId)` for training calendar (last 7 days)

Uses `effectiveUserId` from `AthleteContext` (P0-T12) so it works for both self-view and coach-viewing-athlete.

**Acceptance criteria**:
- All 6 widgets render with real data from Supabase
- Loading states show skeletons for all widgets
- Layout matches the wireframe from spec
- Responsive: widgets stack vertically on mobile
- Page title shows "Welcome back, [Name]" using `username` from profile or email fallback

**Dependencies**: P1-T06, P1-T07, P1-T08, P1-T09, P1-T10, P1-T11, P1-T12, P1-T13, P1-T14, P1-T15, P1-T16, P0-T12

---

#### [x] P1-T18: Build `ProgressPage` for detailed weight and metrics trends

**Description**: Create the Progress page at `/dashboard/progress` that shows a larger weight trend chart with more controls (date range picker, show/hide MA lines), plus a table of raw data below.

**Files to modify**:
- `src/components/dashboard-panel/pages/ProgressPage.tsx` (replace placeholder from P0-T05)

**Layout**:
- Top: page title "Progress" + date range selector (7d, 14d, 1m, 3m, all)
- Main: `WeightTrendChart` (larger, takes ~60% height)
- Below chart: raw data table with columns: Date, Weight, Steps, Sleep Hours, Diet Adherence
- Table uses shadcn `Table` component from `src/components/ui/table.tsx` (not full DataTable -- that comes in Phase 2)

**Acceptance criteria**:
- Chart fills available width
- Date range selector filters both chart and table
- Table is scrollable if many rows
- All data comes from `useDashboardData` and `useHistoryLogs`

**Dependencies**: P1-T14, P1-T01, P1-T03

---

#### [x] P1-T19: Build `GoalsPage` for athlete self-service goal editing

**Description**: Create the Goals page at `/dashboard/goals` where athletes can view and edit their personal goals (target weight, steps goal, water goal). For now, this edits the `profiles` table directly via `useUpdateProfile` (the versioned `athlete_goals` table comes in Phase 3).

**Files to modify**:
- `src/components/dashboard-panel/pages/GoalsPage.tsx` (replace placeholder from P0-T05)

**Layout**:
- Page title "My Goals"
- `GoalProgressCard` for each goal:
  - Target Weight: current 7d avg vs target, with progress bar
  - Daily Steps: today's steps vs goal, with progress bar
  - Daily Water: today's water vs goal, with progress bar
- Edit form (inline or dialog) using `react-hook-form` (already installed as `react-hook-form@7.71.2`):
  - Target weight (number input, kg)
  - Steps goal (number input)
  - Water goal (number input, liters)
- Save button calls `useUpdateProfile` from `src/hooks/useProfile.ts`

**New component to create**:
- `src/components/dashboard-panel/components/GoalProgressCard.tsx`

**GoalProgressCard props**:
```typescript
interface GoalProgressCardProps {
  label: string;
  current: number | null;
  target: number;
  unit: string;
  color: string;        // Tailwind color class for progress bar
  inverted?: boolean;    // true for weight loss (lower = progress)
}
```

Uses shadcn `Progress` component (`src/components/ui/progress.tsx`) for the bar.

**Acceptance criteria**:
- All three goals display with progress bars
- Edit mode allows changing values
- Save persists to Supabase via `useUpdateProfile`
- Optimistic update: values update immediately in UI
- Validation: no negative numbers, reasonable ranges

**Dependencies**: P1-T02, P1-T06

---

### Phase Wrap-Up

#### [x] P1-T20: Phase 1 verification and changelog

**Description**: Run full build and lint. Verify all athlete dashboard features work with real data. Test responsive behavior at all breakpoints. Update `CHANGELOG.md`. Mark all Phase 1 tasks as done.

**Acceptance criteria**:
- `npm run build` passes with zero errors
- `npm run lint` passes
- Overview page renders all 6 widgets with data
- Progress page shows chart and table
- Goals page allows viewing and editing goals
- All pages responsive (tested at 1280px, 1024px, 768px, 375px)
- `CHANGELOG.md` updated with Phase 1 entry
- All P1 tasks marked `[x]`

**Dependencies**: All P1 tasks

---

## Phase 2: Food and Diet Management

This phase builds the Food Database CRUD, the Diet Template Editor, and the diet assignment flow. It introduces the `DataTable` component and several new database tables.

### Database

#### [x] P2-T01: Create `diet_templates` and `diet_template_items` tables

**Description**: Write and execute a Supabase migration creating the diet template tables from DASHBOARD_SPEC.md Section 7.2.

**Files to create**:
- `supabase/migrations/003_create_diet_templates.sql`

**SQL**: Create both tables with all columns and constraints from the spec. Add RLS policies: coaches have full CRUD on their own templates (where `coach_id = auth.uid()`). Athletes have no access to template tables.

**Acceptance criteria**:
- Both tables created with all constraints
- RLS: coaches can CRUD their own templates
- RLS: athletes cannot see templates
- Foreign key from `diet_template_items.food_id` to `foods.id` works
- `day_of_week` CHECK constraint matches existing values: `'LUN','MAR','MER','GIO','VEN','SAB','DOM'`

**Dependencies**: P0-T01

---

#### [x] P2-T02: Add `created_by` and `template_id` columns to `meal_plans`

**Description**: Alter the `meal_plans` table to add `created_by` (who created the plan) and `template_id` (which template it came from, nullable). Backfill `created_by` with `user_id` for existing rows.

**Files to create**:
- `supabase/migrations/004_alter_meal_plans.sql`

**SQL**:
```sql
ALTER TABLE meal_plans
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN template_id UUID REFERENCES diet_templates(id) ON DELETE SET NULL;

UPDATE meal_plans SET created_by = user_id WHERE created_by IS NULL;
```

**Acceptance criteria**:
- Columns added, nullable (so existing inserts from mobile app via `DietView` still work)
- Existing rows backfilled with `created_by = user_id`
- No impact on existing mobile app queries

**Dependencies**: P2-T01

---

#### [x] P2-T03: Add `created_by` and `updated_at` columns to `foods`

**Description**: Alter the `foods` table to track who created each food and when it was last modified.

**Files to create**:
- `supabase/migrations/005_alter_foods.sql`

**SQL**:
```sql
ALTER TABLE foods
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
```

Also add a coach-specific RLS policy so coaches can manage foods (the existing "Foods are viewable by everyone" SELECT policy in `src/db/schema.sql` remains):
```sql
CREATE POLICY "Coaches can manage foods"
  ON foods FOR ALL
  USING (public.get_my_role() = 'coach')
  WITH CHECK (public.get_my_role() = 'coach');
```

**Acceptance criteria**:
- Columns added
- Existing "Foods are viewable by everyone" SELECT policy still works
- Coaches can INSERT/UPDATE/DELETE foods
- Athletes still cannot modify foods

**Dependencies**: P0-T01

---

#### [x] P2-T04: Update TypeScript types for new tables and columns

**Description**: Add TypeScript interfaces for `DietTemplate`, `DietTemplateItem`, and update `Food` and `MealPlan` interfaces with the new columns.

**Files to modify**:
- `src/types/database.ts`

**New interfaces**:
```typescript
export interface DietTemplate {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DietTemplateItem {
  id: string;
  template_id: string;
  day_of_week: 'LUN' | 'MAR' | 'MER' | 'GIO' | 'VEN' | 'SAB' | 'DOM';
  meal_name: string;
  food_id: string | null;
  target_quantity: number;
  sort_order: number;
  // Joined relation
  foods?: Food | null;
}
```

**Updated interfaces**:
- `Food`: add `created_by: string | null` and `updated_at: string`
- `MealPlan`: add `created_by: string | null` and `template_id: string | null`

**Acceptance criteria**:
- TypeScript compiles without errors
- All new and modified types exported

**Dependencies**: P2-T01, P2-T02, P2-T03

---

### Frontend / Components -- DataTable

#### [x] P2-T05: Install `@tanstack/react-table` and create generic `DataTable` component

**Description**: Install TanStack Table and create a reusable, generic DataTable component built on shadcn's `Table` component (`src/components/ui/table.tsx`). This is the foundation for the Food Database, Athletes Roster, and Logs tables.

**Commands**:
```bash
npm install @tanstack/react-table
```

**Files to create**:
- `src/components/dashboard-panel/tables/DataTable.tsx`

**Props** (generic):
```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
}
```

**Implementation**:
- Uses `useReactTable` with `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`
- Renders with shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` from `src/components/ui/table.tsx`
- Column headers are clickable for sorting (ascending/descending/none)
- Sort indicator arrows in headers
- Loading state: skeleton rows (pulsing `animate-pulse` rows)

**Acceptance criteria**:
- Generic component works with any data type
- Sorting works on click
- Loading skeleton renders correct number of rows
- Empty state shows configurable message
- Row click handler fires with correct data

**Dependencies**: None

---

#### [x] P2-T06: Build `DataTableToolbar` component

**Description**: Create a toolbar component for search input and filter dropdowns, designed to sit above the DataTable.

**Files to create**:
- `src/components/dashboard-panel/tables/DataTableToolbar.tsx`

**Props**:
```typescript
interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    label: string;
    options: Array<{ label: string; value: string }>;
    value: string;
    onChange: (value: string) => void;
  }>;
  actions?: React.ReactNode;   // e.g., "+ Add Food" button
}
```

**Implementation**:
- Search input (`src/components/ui/input.tsx`) with debounced onChange (300ms)
- Filter dropdowns using shadcn `Select` (`src/components/ui/select.tsx`)
- Action slot renders on the right side
- Responsive: stacks vertically on narrow screens

**Acceptance criteria**:
- Search input with debounced onChange (300ms)
- Filter dropdowns render correctly
- Action slot renders on the right side
- Responsive: stacks vertically on narrow screens

**Dependencies**: None

---

#### [x] P2-T07: Build `DataTablePagination` component

**Description**: Create pagination controls for the DataTable: page size selector, page number display, and prev/next buttons.

**Files to create**:
- `src/components/dashboard-panel/tables/DataTablePagination.tsx`

**Props**:
```typescript
interface DataTablePaginationProps {
  table: Table<any>;  // TanStack Table instance
}
```

**Implementation**:
- Shows: "Page X of Y" text
- Buttons (`src/components/ui/button.tsx`): First, Previous, Next, Last
- Page size dropdown: 10, 25, 50, 100

**Acceptance criteria**:
- Buttons disabled when at first/last page
- Page size change resets to page 1
- Shows total row count

**Dependencies**: P2-T05

---

### Frontend / Components -- Food Database

#### [x] P2-T08: Create `useFoodsQuery` hook for paginated/filtered food data

**Description**: Create a hook that fetches foods from Supabase with server-side search, filtering, and pagination. The existing `useFoods` hook (`src/hooks/useFoods.ts`) is a simple fetch-all -- this new hook supports the DataTable's needs.

**Files to create**:
- `src/components/dashboard-panel/hooks/useFoodsQuery.ts`

**Interface**:
```typescript
interface UseFoodsQueryParams {
  search?: string;
  unitFilter?: string;       // matches Food.unit: 'g' | 'ml' | 'caps' | 'compr' | 'piece'
  stateFilter?: string;      // matches Food.state values
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDesc?: boolean;
}

interface UseFoodsQueryResult {
  data: Food[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
}
```

**Implementation**:
- Uses Supabase `.ilike('name', `%${search}%`)` for search
- Uses `.eq('unit', unitFilter)` when set
- Uses `.range(offset, offset + pageSize - 1)` for pagination
- Uses `.order(sortBy, { ascending: !sortDesc })` for sorting
- Returns total count via Supabase's `{ count: 'exact' }` option

**Acceptance criteria**:
- Search filters foods by name (case-insensitive)
- Unit and state filters work
- Pagination returns correct page of results
- Sorting works on all columns
- Total count is accurate for pagination controls

**Dependencies**: P2-T04

---

#### [x] P2-T09: Define `foods-columns.tsx` column definitions

**Description**: Define the TanStack Table column definitions for the Food Database table.

**Files to create**:
- `src/components/dashboard-panel/tables/foods-columns.tsx`

**Columns**:
1. Name (sortable, text)
2. Portion Size (sortable, number + unit suffix from `Food.unit`)
3. Unit (sortable, badge using shadcn `Badge` from `src/components/ui/badge.tsx`)
4. Calories (sortable, number, "kcal" suffix)
5. Protein (sortable, number, "g" suffix)
6. Carbs (sortable, number, "g" suffix)
7. Fats (sortable, number, "g" suffix)
8. State (sortable, badge)
9. Actions (edit button, delete button) -- only for coaches

**Acceptance criteria**:
- All columns render correct data
- Number columns right-aligned
- Action buttons only visible for coach role
- Columns typed correctly with `ColumnDef<Food>`

**Dependencies**: P2-T05, P2-T04

---

#### [x] P2-T10: Build `FoodFormDialog` component

**Description**: Create a dialog for adding and editing foods. Uses `react-hook-form` for form state and validation.

**Files to create**:
- `src/components/dashboard-panel/components/FoodFormDialog.tsx`

**Props**:
```typescript
interface FoodFormDialogProps {
  open: boolean;
  onClose: () => void;
  food?: Food | null;      // null = add mode, Food = edit mode
  onSave: (food: Partial<Food>) => Promise<void>;
}
```

**Form fields** (using shadcn `Input`, `Label`, `Select` from `src/components/ui/`):
- `id` (text, auto-generated slug from name for new foods, read-only for edit)
- `name` (text, required)
- `portion_size` (number, required, default 100)
- `unit` (select: g, ml, caps, compr, piece -- matching `Food.unit` type)
- `calories` (number, required)
- `protein` (number, required)
- `carbs` (number, required)
- `fats` (number, required)
- `state` (select: the 6 state options from schema -- 'Peso da Cotto', 'Peso da Crudo', 'Peso sgocciolato', 'Peso confezionato', 'Peso da sgusciato', 'N/A')

**Validation**:
- Name required, min 2 chars
- All numeric fields required, >= 0
- Portion size > 0
- Macros consistency warning: `protein * 4 + carbs * 4 + fats * 9` should be within 20% of calories (warning text, not blocking)

**Acceptance criteria**:
- Dialog opens in add mode (empty form) or edit mode (pre-filled)
- Form validates on submit
- Macro consistency warning shows (but does not block save)
- Save button shows loading spinner during save
- Dialog closes on successful save
- Uses shadcn `Dialog` from `src/components/ui/dialog.tsx`

**Dependencies**: None

---

#### [x] P2-T11: Build `ConfirmDialog` component

**Description**: Create a reusable confirmation dialog for destructive actions (e.g., deleting a food).

**Files to create**:
- `src/components/dashboard-panel/components/ConfirmDialog.tsx`

**Props**:
```typescript
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;    // default "Delete"
  variant?: 'destructive' | 'default';
  isLoading?: boolean;
}
```

**Acceptance criteria**:
- Uses shadcn `Dialog` from `src/components/ui/dialog.tsx` as base
- Destructive variant shows red confirm button (using `variant="destructive"` on shadcn Button)
- Loading state disables buttons
- Escape and backdrop click close the dialog

**Dependencies**: None

---

#### [x] P2-T12: Build `EmptyState` component

**Description**: Create a reusable empty state component for tables and lists.

**Files to create**:
- `src/components/dashboard-panel/components/EmptyState.tsx`

**Props**:
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Acceptance criteria**:
- Centered layout with icon, title, description, and optional action button
- Visually distinct from loading state
- Action button uses shadcn `Button`

**Dependencies**: None

---

#### [x] P2-T13: Build `FoodDatabasePage`

**Description**: Assemble the Food Database page at `/dashboard/diet/foods` using DataTable, toolbar, pagination, FoodFormDialog, and ConfirmDialog.

**Files to modify**:
- `src/components/dashboard-panel/pages/FoodDatabasePage.tsx` (replace placeholder from P0-T05)

**Features**:
- Search by food name (debounced)
- Filter by unit (dropdown with values: g, ml, caps, compr, piece)
- Filter by state (dropdown with Food state values)
- Sortable columns
- Pagination (default 25 rows)
- "+ Add Food" button (coach only) opens FoodFormDialog in add mode
- Row edit button opens FoodFormDialog in edit mode
- Row delete button opens ConfirmDialog
- CRUD mutations via Supabase directly (inline `useMutation` from TanStack Query)

**Acceptance criteria**:
- Table loads and displays all foods
- Search filters in real-time (300ms debounce)
- Add/Edit/Delete operations work and refresh the table
- Non-coaches see the table as read-only (no add/edit/delete buttons)
- Empty state when no foods match filters

**Dependencies**: P2-T05, P2-T06, P2-T07, P2-T08, P2-T09, P2-T10, P2-T11, P2-T12

---

### Frontend / Components -- Diet Template Editor

#### [x] P2-T14: Create `useDietTemplates` hook

**Description**: Create a hook for fetching and mutating diet templates (list, get by ID, create, update, delete).

**Files to create**:
- `src/components/dashboard-panel/hooks/useDietTemplates.ts`

**Exports**:
```typescript
export function useDietTemplatesList(): UseQueryResult<DietTemplate[]>;
export function useDietTemplate(templateId: string): UseQueryResult<DietTemplate & { items: DietTemplateItem[] }>;
export function useCreateDietTemplate(): UseMutationResult;
export function useUpdateDietTemplate(): UseMutationResult;
export function useDeleteDietTemplate(): UseMutationResult;
export function useAssignTemplate(): UseMutationResult;
```

**`useAssignTemplate` logic** (from DASHBOARD_SPEC.md Section 7.5):
1. Fetch template items with joined foods data
2. Delete existing coach-created meal plans for the target athlete
3. Insert new meal plans from template items with `user_id = athleteId`, `created_by = coachId`, `template_id = templateId`

Uses `calculateItemMacros` from `src/hooks/useDietData.ts` for any macro calculations.

**Acceptance criteria**:
- List query returns all templates for the current coach
- Get-by-ID returns template with all items joined to foods
- Create/Update/Delete mutations work and invalidate the list query
- Assign copies template items to meal_plans table correctly
- After assignment, athlete's `useDietData()` returns the new plans

**Dependencies**: P2-T04, P2-T01, P2-T02

---

#### [x] P2-T15: Build `MacroSummaryBar` component

**Description**: Create a horizontal bar component showing kcal/protein/carbs/fats breakdown for a meal or day total.

**Files to create**:
- `src/components/dashboard-panel/components/MacroSummaryBar.tsx`

**Props**:
```typescript
interface MacroSummaryBarProps {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  targetCalories?: number;   // shows vs target if provided
}
```

**Implementation**:
- Horizontal stacked bar: protein (blue segment), carbs (amber segment), fats (red segment)
- Width proportional to calorie contribution: protein*4, carbs*4, fats*9
- Below bar: text row showing "Kcal: X | P: Xg | C: Xg | F: Xg"
- If `targetCalories` provided, show "X / Y kcal" with color indicator (green if within 5%, amber if within 10%, red otherwise)

**Acceptance criteria**:
- Bar segments sized correctly by calorie contribution proportions
- All four values displayed as text
- Target comparison colors correct

**Dependencies**: None

---

#### [x] P2-T16: Build `FoodRowEditable` component

**Description**: Create an inline-editable food row for the meal plan editor. Each row shows food name, quantity input, unit, and calculated macros. Includes delete button and drag handle.

**Files to create**:
- `src/components/dashboard-panel/components/FoodRowEditable.tsx`

**Props**:
```typescript
interface FoodRowEditableProps {
  item: DietTemplateItem & { foods?: Food | null };
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  dragHandleProps?: any;   // from @dnd-kit
}
```

**Implementation**:
- Displays: drag handle icon (GripVertical from Lucide) | food name | quantity input (inline number, shadcn `Input`) | unit label | kcal | P | C | F | delete button (Trash2 icon)
- Quantity input: on change recalculates macros in real-time using `calculateItemMacros` from `src/hooks/useDietData.ts`
- Delete button with confirmation (or immediate with undo toast via `sonner`)

**Acceptance criteria**:
- Quantity change updates macros instantly
- Delete removes the row
- Drag handle visible (drag functionality in P2-T17)
- Macros calculated correctly using existing `calculateItemMacros`

**Dependencies**: P2-T04

---

#### [x] P2-T17: Install drag-and-drop and build `MealRow` component

**Description**: Install `@dnd-kit/core` and `@dnd-kit/sortable`. Create the `MealRow` component that groups food rows under a meal name (e.g., "MEAL 1 (PRE)") with subtotals and an "+ Add Food" button.

**Commands**:
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

**Files to create**:
- `src/components/dashboard-panel/components/MealRow.tsx`

**Props**:
```typescript
interface MealRowProps {
  mealName: string;
  items: Array<DietTemplateItem & { foods?: Food | null }>;
  onAddFood: (mealName: string) => void;
  onRemoveItem: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onReorder: (mealName: string, itemIds: string[]) => void;
  onRenameMeal: (oldName: string, newName: string) => void;
  onDeleteMeal: (mealName: string) => void;
}
```

**Implementation**:
- Collapsible section (shadcn `Collapsible` from `src/components/ui/collapsible.tsx`) with meal name as header
- Meal name is editable (click to edit inline with shadcn `Input`)
- List of `FoodRowEditable` components wrapped in `SortableContext` from dnd-kit
- Subtotal row at bottom showing summed kcal/P/C/F (using `calculateItemMacros` for each item)
- "+ Add Food" button opens the existing `FoodSearchModal` from `src/components/diet/FoodSearchModal.tsx`
- "Delete Meal" button in header (with `ConfirmDialog`)

**Acceptance criteria**:
- Foods can be dragged to reorder within a meal
- Adding a food opens the search modal and appends the selection
- Subtotals update when quantities change or foods are added/removed
- Meal name can be edited inline
- Meal can be deleted (with confirmation)

**Dependencies**: P2-T16

---

#### [x] P2-T18: Build `CopyDayDialog` component

**Description**: Create a dialog that lets the coach copy all meals from one day to one or more other days. Used in the diet template editor.

**Files to create**:
- `src/components/dashboard-panel/components/CopyDayDialog.tsx`

**Props**:
```typescript
interface CopyDayDialogProps {
  open: boolean;
  onClose: () => void;
  sourceDay: string;                // e.g., "LUN"
  onCopy: (targetDays: string[]) => void;
}
```

**Implementation**:
- Uses shadcn `Dialog`
- Title: "Copy [sourceDay] to..."
- 7 checkboxes for each day (`LUN` through `DOM`, using Italian day codes matching the schema)
- Source day checkbox disabled
- "Select All" / "Deselect All" toggle
- Copy button and Cancel button

**Acceptance criteria**:
- Source day checkbox disabled
- At least one target day must be selected to enable Copy button
- Calls `onCopy` with array of selected day codes

**Dependencies**: None

---

#### [x] P2-T19: Build `MealPlanEditor` compound component

**Description**: Create the full meal plan editor that combines day tabs, meal rows, food rows, macro summaries, and the copy-day feature. This is the core diet editing experience shown in DASHBOARD_SPEC.md Section 5.3 Diet Editor wireframe.

**Files to create**:
- `src/components/dashboard-panel/components/MealPlanEditor.tsx`

**Props**:
```typescript
interface MealPlanEditorProps {
  templateId: string;
  items: Array<DietTemplateItem & { foods?: Food | null }>;
  onSave: (items: DietTemplateItem[]) => Promise<void>;
  readOnly?: boolean;
}
```

**Implementation**:
- Day tabs: LUN MAR MER GIO VEN SAB DOM (shadcn `Tabs` from `src/components/ui/tabs.tsx`)
- Each day tab shows its meal rows (grouped by `meal_name`)
- "+ Add Meal" button at bottom of each day
- `MacroSummaryBar` showing daily totals at bottom of each day
- "Copy Day To..." button opens `CopyDayDialog`
- "Save Changes" button persists all changes
- Tracks dirty state (unsaved changes warning via `beforeunload` event)

**State management**:
- Local state for edits (optimistic), synced to server on save
- Items grouped by `day_of_week` then by `meal_name`
- Uses `calculateItemMacros` from `src/hooks/useDietData.ts` for all macro calculations

**Acceptance criteria**:
- Switching day tabs shows correct meals
- All CRUD operations work within the editor
- Daily macro totals update in real-time
- Copy Day copies all meals from source to target days
- Save persists all changes to Supabase
- Dirty state warning if navigating away with unsaved changes
- Read-only mode disables all editing controls

**Dependencies**: P2-T15, P2-T17, P2-T18

---

#### [x] P2-T20: Build `DietEditorPage` (template list + editor)

**Description**: Create the Diet Editor page at `/dashboard/diet`. For coaches, this shows a list of diet templates with a button to create new ones. Selecting a template opens the `MealPlanEditor`. For athletes, this redirects to or shows a read-only view of their current meal plan.

**Files to modify**:
- `src/components/dashboard-panel/pages/DietEditorPage.tsx` (replace placeholder from P0-T05)

**Coach view**:
- Template list as cards (name, description, meal count, last updated) using shadcn `Card`
- "+ Create Template" button
- Click template to open editor
- "Assign to Athlete" button on each template (opens athlete selector from `AthleteContext`)

**Athlete view**:
- Read-only view of their current meal plan using `MealPlanEditor` with `readOnly={true}`
- Data from `useDietData(effectiveUserId)` converted to template item format

**Acceptance criteria**:
- Coach sees template list and can create/edit/delete templates
- Athlete sees their current diet plan (read-only)
- Template assignment flow works (select athlete, confirm, copy-on-assign via `useAssignTemplate`)

**Dependencies**: P2-T14, P2-T19, P0-T12

---

### Phase Wrap-Up

#### [x] P2-T21: Phase 2 verification and changelog

**Description**: Run full build and lint. Test all Food Database CRUD operations. Test diet template creation, editing, and assignment. Verify mobile app unaffected. Update `CHANGELOG.md`.

**Acceptance criteria**:
- `npm run build` passes with zero errors
- `npm run lint` passes
- Food CRUD: add, edit, delete, search, filter, paginate all work
- Diet template: create, edit meals/foods, copy day, save, delete all work
- Diet assignment: assign template to athlete, verify meal_plans populated
- Mobile app at `/` fully functional (especially `DietView` and `FoodSearchModal`)
- `CHANGELOG.md` updated with Phase 2 entry
- All P2 tasks marked `[x]`

**Dependencies**: All P2 tasks

---

## Phase 3: Coach Multi-Athlete Panel

This phase delivers the coach-specific features: athlete roster, athlete detail view, coach overview dashboard with compliance heatmap and alert feed, and the athlete selector combobox.

### Database

#### [x] P3-T01: Add coach RLS policies to existing tables

**Description**: Write and execute a migration that adds coach access policies to `profiles`, `daily_logs`, `meal_adherence`, and `meal_plans` tables, as defined in DASHBOARD_SPEC.md Section 7.4. These are additive OR-based policies -- existing user policies remain unchanged.

**Files to create**:
- `supabase/migrations/006_coach_rls_policies.sql`

**Policies to add**:
```sql
-- Coaches can read their athletes' profiles
CREATE POLICY "Coaches can view athlete profiles"
  ON profiles FOR SELECT USING (public.is_coach_of(id));

-- Coaches can read (not write) their athletes' daily logs
CREATE POLICY "Coaches can view athlete daily logs"
  ON daily_logs FOR SELECT USING (public.is_coach_of(user_id));

-- Coaches can read athlete meal adherence
CREATE POLICY "Coaches can view athlete meal adherence"
  ON meal_adherence FOR SELECT USING (public.is_coach_of(user_id));

-- Coaches can CRUD meal plans for their athletes
CREATE POLICY "Coaches view athlete meal plans"
  ON meal_plans FOR SELECT USING (public.is_coach_of(user_id));
CREATE POLICY "Coaches create athlete meal plans"
  ON meal_plans FOR INSERT WITH CHECK (public.is_coach_of(user_id));
CREATE POLICY "Coaches update athlete meal plans"
  ON meal_plans FOR UPDATE USING (public.is_coach_of(user_id) AND created_by = auth.uid());
CREATE POLICY "Coaches delete athlete meal plans"
  ON meal_plans FOR DELETE USING (public.is_coach_of(user_id) AND created_by = auth.uid());
```

**Acceptance criteria**:
- Coach can SELECT athlete profiles, daily_logs, meal_adherence, and meal_plans via Supabase client
- Coach can INSERT/UPDATE/DELETE meal plans for athletes (only plans they created)
- Coach cannot UPDATE or DELETE meal plans they did not create
- Athlete access to own data unchanged (existing policies in `src/db/schema.sql` untouched)
- Non-coach users cannot see other users' data

**Dependencies**: P0-T01, P0-T02

---

#### [x] P3-T02: Create `athlete_goals` table

**Description**: Create the versioned goals table from DASHBOARD_SPEC.md Section 7.2. This stores time-bounded goal sets per athlete, replacing the simple `target_weight`/`steps_goal`/`water_goal` on profiles for the dashboard.

**Files to create**:
- `supabase/migrations/007_create_athlete_goals.sql`

**SQL**: Create table with all columns from spec, unique partial index for current goal (`WHERE effective_until IS NULL`), and RLS policies (athlete reads own, coach reads/writes for their athletes).

Also create a backfill to populate initial goals from existing profile data:
```sql
INSERT INTO athlete_goals (athlete_id, set_by, target_weight, steps_goal, water_goal, effective_from)
SELECT id, id, target_weight, steps_goal, water_goal, CURRENT_DATE
FROM profiles
WHERE target_weight IS NOT NULL OR steps_goal IS NOT NULL OR water_goal IS NOT NULL;
```

**Acceptance criteria**:
- Table created with partial unique index (one current goal per athlete)
- Existing profile goals backfilled
- RLS: athletes see own goals, coaches see/write their athletes' goals
- Setting new goals requires application-level close of previous (UPDATE `effective_until = today` before INSERT)

**Dependencies**: P0-T01

---

#### [x] P3-T03: Create Postgres function `get_latest_logs_for_athletes`

**Description**: Create the server-side function from DASHBOARD_SPEC.md Section 7.5 that returns the latest daily log for each athlete in an array of IDs. This avoids N+1 queries when loading the athlete roster.

**Files to create**:
- `supabase/migrations/008_get_latest_logs_function.sql`

**SQL**: The exact function from the spec using `DISTINCT ON` pattern. Returns `user_id`, `date`, `weight_fasting`, `steps`, `water_liters`, `diet_adherence`, `sleep_quality`, `daily_energy`.

**Acceptance criteria**:
- Function returns one row per athlete with their latest log
- Only returns data for athletes the calling coach has access to (via `is_coach_of` check)
- Performance: single query regardless of athlete count

**Dependencies**: P0-T02

---

#### [x] P3-T04: Update TypeScript types for `athlete_goals`

**Description**: Add the `AthleteGoal` interface to `src/types/database.ts`.

**Files to modify**:
- `src/types/database.ts`

**New interface**:
```typescript
export interface AthleteGoal {
  id: string;
  athlete_id: string;
  set_by: string;
  target_weight: number | null;
  steps_goal: number | null;
  water_goal: number | null;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fats: number | null;
  phase: 'bulk' | 'cut' | 'maintenance' | 'reverse_diet' | null;
  notes: string | null;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
}
```

**Acceptance criteria**:
- TypeScript compiles without errors
- Interface exported from `src/types/database.ts`

**Dependencies**: P3-T02

---

### Hooks / State

#### [x] P3-T05: Build `useAthletes` hook

**Description**: Create a hook for coaches to fetch their roster of athletes with latest stats. Uses the `get_latest_logs_for_athletes` RPC function and joins with profile data.

**Files to create**:
- `src/components/dashboard-panel/hooks/useAthletes.ts`

**Interface**:
```typescript
interface AthleteWithStats {
  id: string;
  username: string | null;
  email: string;
  lastLogDate: string | null;
  currentWeight: number | null;
  weightTrend: number[];          // last 7 weights for sparkline
  stepsCompliance: number | null; // 0-100
  dietAdherence: number | null;   // 0-100
  activeAlerts: number;
  status: 'active' | 'paused' | 'terminated';
}

export function useAthletes(): UseQueryResult<AthleteWithStats[]>;
```

**Implementation**:
1. Fetch `coach_athletes` where `coach_id = auth.uid()` and `status = 'active'`
2. Fetch profiles for those athlete IDs
3. Call `get_latest_logs_for_athletes` RPC with athlete IDs
4. Fetch last 7 daily_logs per athlete for sparkline data
5. Combine into `AthleteWithStats[]`

**Acceptance criteria**:
- Returns all active athletes for the current coach
- Includes latest log data and sparkline weights
- Loading state while fetching
- Empty array for non-coaches or coaches with no athletes

**Dependencies**: P3-T03, P3-T04

---

#### [x] P3-T06: Build `useCoachStats` hook

**Description**: Create a hook that computes the three coach overview stat card values: total athletes, logs received today, and active alerts count.

**Files to create**:
- `src/components/dashboard-panel/hooks/useCoachStats.ts`

**Interface**:
```typescript
interface CoachStats {
  totalAthletes: number;
  logsTodayCount: number;
  activeAlertsCount: number;
  isLoading: boolean;
}

export function useCoachStats(): CoachStats;
```

**Acceptance criteria**:
- Total athletes = count of active coach_athletes rows
- Logs today = count of daily_logs with today's date (using `getLocalDateStr()` from `src/lib/utils.ts`) for all athletes
- Active alerts = placeholder 0 (alert system built in Phase 4)
- All values update when underlying data changes (via TanStack Query invalidation)

**Dependencies**: P3-T05

---

#### [x] P3-T07: Build `useAthleteGoals` hook

**Description**: Create a hook for reading and writing versioned athlete goals.

**Files to create**:
- `src/components/dashboard-panel/hooks/useAthleteGoals.ts`

**Exports**:
```typescript
export function useCurrentGoal(athleteId: string): UseQueryResult<AthleteGoal | null>;
export function useGoalHistory(athleteId: string): UseQueryResult<AthleteGoal[]>;
export function useSetGoal(): UseMutationResult;  // closes previous, inserts new
```

**`useSetGoal` logic**:
1. Update previous current goal: `SET effective_until = CURRENT_DATE WHERE athlete_id = X AND effective_until IS NULL`
2. Insert new goal with `effective_from = CURRENT_DATE`, `effective_until = NULL`, `set_by = auth.uid()`

**Acceptance criteria**:
- Current goal returns the one with `effective_until IS NULL`
- Goal history returns all goals ordered by `effective_from DESC`
- Setting a new goal closes the previous one atomically
- Query key invalidated after mutation

**Dependencies**: P3-T04

---

#### [x] P3-T08: Fully wire `AthleteContext` with `AthleteSelector`

**Description**: Upgrade the stub `AthleteContext` from P0-T12 to be fully functional. When a coach selects an athlete from the selector, all data-fetching hooks in the dashboard switch to that athlete's data.

**Files to modify**:
- `src/components/dashboard-panel/contexts/AthleteContext.tsx`

**Files to create**:
- `src/components/dashboard-panel/components/AthleteSelector.tsx`

**AthleteSelector**:
- Combobox component (shadcn `Input` for search + dropdown list) showing athlete names/emails
- Uses `useAthletes()` for the list
- On selection, calls `setActiveAthleteId(id)` on context
- Shows "Viewing: [name]" indicator when an athlete is selected
- "Clear" (X) button to return to own view
- Only rendered for coaches (check `isCoach` from context)
- Placed in the `Sidebar` component (P0-T08) in the athlete selector area

**Context upgrade**:
- Persists `activeAthleteId` to URL search params (`?athlete=uuid`) using `useSearchParams` from react-router-dom so it survives page refreshes
- Provides `activeAthlete` object (profile data from `useProfile(activeAthleteId)`) in addition to just the ID
- `effectiveUserId` computed: `activeAthleteId ?? user.id`

**Acceptance criteria**:
- Coach can search and select an athlete
- All dashboard pages switch to show that athlete's data (since hooks use `effectiveUserId`)
- URL updates with `?athlete=uuid`
- Refreshing the page retains the selected athlete
- Athletes never see the selector
- Clearing selection returns to coach's own view

**Dependencies**: P3-T05, P0-T12

---

### Frontend / Components -- Roster and Detail

#### [x] P3-T09: Define `athletes-columns.tsx` column definitions

**Description**: Define TanStack Table column definitions for the Athletes Roster table.

**Files to create**:
- `src/components/dashboard-panel/tables/athletes-columns.tsx`

**Columns**:
1. Name (sortable, text -- `username` or email fallback)
2. Last Log (sortable, date -- relative format like "2h ago", "Yesterday" using `Intl.RelativeTimeFormat`)
3. Weight (sortable, number with "kg" unit, includes mini sparkline)
4. Diet Adherence (sortable, percentage with color badge using `--color-status-*` tokens)
5. Steps Compliance (sortable, percentage with color badge)
6. Alerts (sortable, number with badge -- red background if > 0)
7. Status (badge: active=green, paused=amber)

**Sparkline implementation**:
- Tiny inline SVG polyline (50px x 20px) rendering last 7 `weightTrend` values
- Green stroke if trend going down, red if trend going up (relative to first point)

**Acceptance criteria**:
- All columns render correctly
- Sparkline renders inline in the weight column
- Badges use status colors from `--color-status-*` design tokens
- Columns typed with `ColumnDef<AthleteWithStats>`

**Dependencies**: P2-T05, P3-T05

---

#### [x] P3-T10: Build `AthletesPage` (roster table)

**Description**: Create the Athletes page at `/dashboard/athletes` showing the full athlete roster with search, filtering, and click-to-detail.

**Files to modify**:
- `src/components/dashboard-panel/pages/AthletesPage.tsx` (replace placeholder from P0-T05)

**Features**:
- `DataTableToolbar` with search by name and filter by status (active/paused/terminated)
- `DataTable` with athletes-columns
- `DataTablePagination`
- Click row navigates to `/dashboard/athletes/:id` using `useNavigate` from react-router-dom
- Empty state for coaches with no athletes (using `EmptyState` component)

**Acceptance criteria**:
- Table shows all athletes with correct data
- Search filters by name (client-side filtering since athlete count is small)
- Status filter works
- Clicking a row navigates to detail page
- Empty state shown when no athletes

**Dependencies**: P2-T05, P2-T06, P2-T07, P3-T09, P3-T05, P2-T12

---

#### [x] P3-T11: Build `AthleteDetailPage` (tabbed view)

**Description**: Create the Athlete Detail page at `/dashboard/athletes/:id` with a tabbed layout: Overview, Progress, Diet, Goals, Logs. Each tab reuses components from Phase 1 and Phase 2, parameterized with the athlete's ID via `useParams` from react-router-dom.

**Files to modify**:
- `src/components/dashboard-panel/pages/AthleteDetailPage.tsx` (replace placeholder from P0-T05)

**Implementation**:
- Read `:id` from URL params
- Header: athlete name (from `useProfile(id)`), email, phase badge (from `useCurrentGoal(id)`), status badge
- Tabs (shadcn `Tabs` from `src/components/ui/tabs.tsx`):
  - **Overview**: Same widgets as athlete OverviewPage (P1-T17) but parameterized with this athlete's ID
  - **Progress**: Same as ProgressPage (P1-T18) parameterized with athlete ID
  - **Diet**: `MealPlanEditor` showing athlete's current meal plans (`useDietData(id)`), editable by coach
  - **Goals**: Goal history timeline (`useGoalHistory(id)`) + set new goal form (`useSetGoal`)
  - **Logs**: DataTable of all daily_logs (`useHistoryLogs(id)`) using logs-columns (P3-T12)

**URL mapping**:
- `/dashboard/athletes/:id` -> Overview tab (default)
- `/dashboard/athletes/:id/progress` -> Progress tab
- `/dashboard/athletes/:id/diet` -> Diet tab
- `/dashboard/athletes/:id/goals` -> Goals tab

**Acceptance criteria**:
- All 5 tabs render correct data for the specific athlete
- Tab state persists in URL (via nested route params)
- Coach can edit diet and goals from within this page
- Back button or breadcrumb returns to athletes roster
- Loading states for each tab

**Dependencies**: P1-T17, P1-T18, P2-T19, P3-T07, P3-T08

---

#### [x] P3-T12: Define `logs-columns.tsx` column definitions

**Description**: Define column definitions for the daily logs DataTable used in the Athlete Detail Logs tab.

**Files to create**:
- `src/components/dashboard-panel/tables/logs-columns.tsx`

**Columns** (matching fields from `DailyLog` interface in `src/types/database.ts`):
1. Date (sortable, formatted as locale date)
2. Weight (sortable, `weight_fasting`, number with "kg")
3. Steps (sortable, number with locale formatting)
4. Sleep Hours (sortable, `sleep_hours`, number with "h")
5. Sleep Quality (sortable, badge using labels from `SLEEP_QUALITY_OPTIONS` in `src/lib/constants.ts`)
6. Diet Adherence (sortable, badge with color: perfect=green, minor_deviation=amber, cheat_meal=red)
7. Gym RPE (sortable, number, color-coded: green 1-4, amber 5-7, red 8-10)
8. Water (sortable, `water_liters`, number with "L")
9. Energy (sortable, display using labels from `ENERGY_OPTIONS` in `src/lib/constants.ts`)
10. Mood (sortable, display using labels from `MOOD_OPTIONS` in `src/lib/constants.ts`)

**Acceptance criteria**:
- All columns render with correct formatting
- Sortable on all columns
- Badges use the same status color coding as elsewhere
- Types match `ColumnDef<DailyLog>`

**Dependencies**: P2-T05

---

### Frontend / Components -- Coach Overview

#### [x] P3-T13: Build `ComplianceHeatmap` component

**Description**: Create a matrix heatmap showing athletes (rows) x dates (columns), with each cell colored by compliance score. This is a custom component, not a Recharts chart.

**Files to create**:
- `src/components/dashboard-panel/components/ComplianceHeatmap.tsx`

**Props**:
```typescript
interface HeatmapData {
  athleteId: string;
  athleteName: string;
  days: Array<{
    date: string;
    score: number | null;   // 0-100
  }>;
}

interface ComplianceHeatmapProps {
  data: HeatmapData[];
  dateRange: number;    // number of days to show (default 14)
  isLoading?: boolean;
}
```

**Implementation**:
- CSS grid: rows = athletes, columns = dates
- Cell color: continuous scale using `--color-status-*` tokens:
  - null/no data = `--color-status-neutral` (grey)
  - 0-40 = `--color-status-danger` (red)
  - 41-60 = `--color-status-warning` (amber)
  - 61-80 = `--color-status-good` (green)
  - 81-100 = `--color-status-excellent` (bright green)
- Row headers: athlete names (clickable, navigate to `/dashboard/athletes/:id`)
- Column headers: date labels (short format)
- Tooltip on hover (using shadcn `Tooltip` from `src/components/ui/tooltip.tsx`): athlete name, date, exact score
- Horizontally scrollable if many dates (using shadcn `ScrollArea` from `src/components/ui/scroll-area.tsx`)
- Wrapped in shadcn `Card` with title "Compliance Heatmap"

**Acceptance criteria**:
- Renders correct color for each cell
- Null data shows grey
- Clicking athlete name navigates to detail page
- Tooltip shows correct information
- Scrolls horizontally on narrow screens

**Dependencies**: P0-T13

---

#### [x] P3-T14: Build `AlertFeed` component (static/placeholder)

**Description**: Create the alert feed component that will display chronological alerts. For now, render with an empty array -- the actual alert computation comes in Phase 4.

**Files to create**:
- `src/components/dashboard-panel/components/AlertFeed.tsx`

**Props**:
```typescript
interface Alert {
  id: string;
  athleteId: string;
  athleteName: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface AlertFeedProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  isLoading?: boolean;
}
```

**Implementation**:
- Chronological list in a scrollable container (shadcn `ScrollArea`)
- Each alert card: severity icon (AlertCircle red/amber/blue from Lucide), athlete name (clickable link), title, relative time
- Left border color: Critical = `--color-status-danger`, Warning = `--color-status-warning`, Info = `--color-chart-7` (cyan)
- "Acknowledge" button on each active alert
- Empty state: "No active alerts" with CheckCircle icon
- Wrapped in shadcn `Card` with title "Alerts"

**Acceptance criteria**:
- Renders correctly with mock data
- Severity colors match design system
- Acknowledge button present and functional (calls `onAcknowledge`)
- Empty state displayed when alerts array is empty
- Scrollable when many alerts

**Dependencies**: P0-T13

---

#### [x] P3-T15: Build Coach `OverviewPage` variant

**Description**: Update the OverviewPage to be role-adaptive. When the user is a coach with no athlete selected, show the coach overview layout (DASHBOARD_SPEC.md Section 5.3 Coach View wireframe) instead of the athlete overview.

**Files to modify**:
- `src/components/dashboard-panel/pages/OverviewPage.tsx`

**Coach layout**:
```
Row 1: "Coach Dashboard" + date range selector
Row 2: 3x StatCard (Total Athletes, Logs Today, Active Alerts) in grid-stats
Row 3: Athletes Table (compact, showing top 10 rows with "View All" link to /dashboard/athletes)
Row 4: ComplianceHeatmap (left, 2/3 width) + AlertFeed (right, 1/3 width) in grid-panels
```

**Implementation**:
- Read `isCoach` and `activeAthleteId` from `AthleteContext`
- If `isCoach && !activeAthleteId`: show coach layout
- If `isCoach && activeAthleteId`: show athlete layout for selected athlete (already built in P1-T17)
- If `!isCoach`: show athlete layout for own data (already built in P1-T17)

**Data sources for coach layout**:
- `useCoachStats()` for stat cards
- `useAthletes()` for compact table
- Compliance heatmap data derived from `useHistoryLogs` for each athlete (aggregate in a dedicated computation)
- `AlertFeed` with empty array (placeholder until Phase 4)

**Acceptance criteria**:
- Coach with no athlete selected sees coach dashboard
- Coach with athlete selected sees that athlete's dashboard
- Athlete always sees own dashboard
- All widgets populated with real data
- Switching between coach/athlete views works seamlessly via `AthleteSelector`

**Dependencies**: P3-T05, P3-T06, P3-T08, P3-T10, P3-T13, P3-T14

---

### Phase Wrap-Up

#### [x] P3-T16: Phase 3 verification and changelog

**Description**: Run full build and lint. Test coach workflows end-to-end: athlete roster, detail view, diet editing for athletes, goal setting, compliance heatmap. Verify athlete experience unchanged. Update `CHANGELOG.md`.

**Acceptance criteria**:
- `npm run build` passes with zero errors
- `npm run lint` passes
- Coach can view athlete roster and click into detail
- Coach can edit athlete's diet and goals from detail view
- Compliance heatmap renders with real data
- Athlete selector switches data correctly across all pages
- URL state (`?athlete=uuid`) preserved on refresh
- Mobile app at `/` unaffected
- `CHANGELOG.md` updated with Phase 3 entry
- All P3 tasks marked `[x]`

**Dependencies**: All P3 tasks

---

## Phase 4: Analytics and Alerts

This phase delivers derived metrics computation, trend detection, correlation insights, the full alert system, and the weekly report generator.

### Hooks / Analytics

#### [ ] P4-T01: Create `useWeightAnalytics` hook

**Description**: Create a hook that computes all weight-related derived metrics from DASHBOARD_SPEC.md Section 8.1: 7-day MA, 14-day MA, weekly delta (kg and %), rate of change (linear regression), and phase detection.

**Files to create**:
- `src/components/dashboard-panel/hooks/useWeightAnalytics.ts`

**Interface**:
```typescript
interface WeightAnalytics {
  movingAvg7d: Array<{ date: string; value: number }>;
  movingAvg14d: Array<{ date: string; value: number }>;
  weeklyDeltaKg: number | null;
  weeklyDeltaPct: number | null;
  rateOfChange: number | null;        // kg/week from linear regression
  phase: 'cutting' | 'maintaining' | 'gaining' | null;
  projectedWeight30d: number | null;
  isLoading: boolean;
}

export function useWeightAnalytics(userId?: string): WeightAnalytics;
```

**Phase detection** (from DASHBOARD_SPEC.md Section 8.3):
- Slope < -0.15 kg/wk = "cutting"
- Slope between -0.15 and +0.15 = "maintaining"
- Slope > +0.15 = "gaining"

**Linear regression**: Simple least-squares on last 14 `weight_fasting` data points (from `useHistoryLogs`), slope scaled to per-week rate.

**Moving average**: Simple sliding window over sorted daily logs. Skip null `weight_fasting` entries.

**Acceptance criteria**:
- Moving averages calculated correctly (verified against manual calculation)
- Weekly delta = current 7d avg - previous 7d avg
- Phase detection matches the thresholds
- 30-day projection = current 7d avg + (rateOfChange * 4.3)
- Null values when insufficient data (< 7 days for 7d MA, < 14 for regression)

**Dependencies**: P1-T03

---

#### [ ] P4-T02: Create `useTrainingLoad` hook

**Description**: Compute training load metrics from DASHBOARD_SPEC.md Section 8.1: session RPE load, weekly training load, and ACWR.

**Files to create**:
- `src/components/dashboard-panel/hooks/useTrainingLoad.ts`

**Interface**:
```typescript
interface TrainingLoadData {
  weeklyLoad: number | null;        // sum of session RPE loads this week
  acwr: number | null;              // acute:chronic workload ratio
  acwrStatus: 'sweet_spot' | 'caution' | 'risk' | null;
  weeklyLoadTrend: Array<{ week: string; load: number }>;  // last 8 weeks
  isLoading: boolean;
}

export function useTrainingLoad(userId?: string): TrainingLoadData;
```

**Calculations** (using `gym_rpe` and `workout_duration` from `DailyLog`):
- Session RPE load = `gym_rpe * workout_duration` (sRPE method)
- Weekly load = SUM of session loads for the current week
- ACWR = current week's load / average of last 4 weeks' loads
- Status: < 0.8 = "risk" (detraining), 0.8-1.3 = "sweet_spot", 1.3-1.5 = "caution", > 1.5 = "risk" (overtraining)

**Acceptance criteria**:
- Session RPE load calculated correctly
- Weekly load sums correctly
- ACWR calculated correctly with 4-week chronic window
- Status labels match thresholds from spec
- Handles weeks with no training (load = 0, ACWR = 0/chronic)

**Dependencies**: P1-T03

---

#### [ ] P4-T03: Create `useCorrelationInsights` hook

**Description**: Compute correlation insights from DASHBOARD_SPEC.md Section 8.2. Uses Pearson correlation coefficient between pairs of metrics.

**Files to create**:
- `src/components/dashboard-panel/hooks/useCorrelationInsights.ts`

**Interface**:
```typescript
interface CorrelationResult {
  metricA: string;
  metricB: string;
  r: number;               // Pearson r (-1 to 1)
  sampleSize: number;
  isSignificant: boolean;  // sample >= minimum threshold
  description: string;     // human-readable insight
}

interface CorrelationInsightsData {
  correlations: CorrelationResult[];
  isLoading: boolean;
}

export function useCorrelationInsights(userId?: string): CorrelationInsightsData;
```

**Correlations to compute** (with minimum sample sizes from spec):
1. Sleep Quality (`sleep_quality` + `sleep_hours`) vs Gym Performance (`gym_energy`) -- 20 data points
2. Diet Adherence (mapped to numeric) vs Weight Trend (7d MA delta, 2-week lag) -- 56 data points (8 weeks)
3. Stress (`stress_level`) vs Mood (`mood`) and Recovery score -- 14 data points
4. Training Load (weekly sRPE) vs Weight delta and Biofeedback composite -- 28 data points (4 weeks)
5. Hydration (`water_liters`) and Salt (`salt_grams`) vs next-morning weight delta -- 14 data points

**Pearson r implementation**: Standard formula, pure function, can be extracted to `src/components/dashboard-panel/lib/`.

**Acceptance criteria**:
- All 5 correlations computed when sufficient data exists
- Returns `isSignificant: false` when below minimum sample
- Descriptions are human-readable (e.g., "Strong positive correlation between sleep quality and gym performance (r=0.72)")
- No crashes on insufficient data
- All wrapped in `useMemo` for performance

**Dependencies**: P1-T03

---

#### [ ] P4-T04: Create `useTrendDetection` hook

**Description**: Implement the trend detection logic from DASHBOARD_SPEC.md Section 8.3: overreach detection, weekday vs weekend diet patterns, and biofeedback deterioration.

**Files to create**:
- `src/components/dashboard-panel/hooks/useTrendDetection.ts`

**Interface**:
```typescript
interface TrendInsight {
  type: 'overreach_risk' | 'diet_weekend_pattern' | 'biofeedback_drop' | 'phase_change';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  detectedAt: string;
}

export function useTrendDetection(userId?: string): {
  insights: TrendInsight[];
  isLoading: boolean;
};
```

**Detection rules** (from DASHBOARD_SPEC.md Section 8.3):
- Overreach: training load increasing AND recovery score decreasing for 2+ consecutive weeks
- Weekend diet: compute weekday avg adherence vs weekend avg; if difference >= 20 points, flag "Weekend Adherence Drop"
- Biofeedback drop: if 7-day biofeedback composite drops 15+ points below 30-day average, flag
- Phase change: if `useWeightAnalytics.phase` changed from previous week, flag as info

**Acceptance criteria**:
- Each detection rule correctly identifies the pattern from daily_logs data
- Insights have human-readable titles and descriptions
- No false positives on normal data variation
- Empty array when no concerning trends detected

**Dependencies**: P4-T02, P1-T07, P1-T09

---

### Alert System

#### [ ] P4-T05: Create alerts infrastructure (types, storage, computation)

**Description**: Build the core alert system: define all 14 alert types from DASHBOARD_SPEC.md Section 9.1, create a client-side alert computation engine, and implement localStorage-based alert state tracking. Alerts are computed on the fly from existing data -- no new database table needed for this.

**Files to create**:
- `src/components/dashboard-panel/hooks/useAlerts.ts`
- `src/components/dashboard-panel/lib/alertEngine.ts`
- `src/components/dashboard-panel/lib/alertTypes.ts`

**`alertTypes.ts`**: Define all 14 alert types as configuration objects:
```typescript
interface AlertDefinition {
  id: string;                // e.g., 'rapid_weight_loss'
  title: string;
  severity: 'critical' | 'warning' | 'info';
  cooldownDays: number;
  check: (data: AlertCheckData) => AlertTriggerResult | null;
}
```

All 14 alerts from spec Section 9.1: Rapid Weight Loss, Rapid Weight Gain, Logging Gap, High ACWR, Low ACWR, Diet Adherence Streak, Low Recovery Trend, HRV Drop, Sleep Deficit, Elevated Stress, Hydration Low, Steps Under, Personal Best, Adherence Milestone.

**`alertEngine.ts`**: Pure function that takes daily logs array, profile, goals, and alert acknowledgment state, runs all 14 checks, applies cooldown logic, and returns active alerts.

**`useAlerts.ts`**: Hook that:
1. Calls `useHistoryLogs` and `useProfile` to get data
2. For coaches: runs alertEngine for each athlete via `useAthletes`
3. Manages acknowledged state in localStorage (`bw-alerts-ack-{alertId}-{date}`)
4. Returns sorted alerts (critical first, then warning, then info; within severity, newest first)

**Alert lifecycle** (client-side):
- Triggered: condition met, alert appears
- Active: displayed in feed
- Acknowledged: coach clicks "Seen", stored in localStorage
- Resolved: trigger condition no longer met (auto-removed next computation)
- Cooldown: same alert type suppressed for `cooldownDays` after last trigger

**Acceptance criteria**:
- All 14 alert types from the spec implemented as check functions
- Cooldown logic prevents duplicate alerts within the window
- Acknowledged state persists across page refreshes (localStorage)
- For coaches: alerts computed for all athletes
- Alerts sorted by severity then by date

**Dependencies**: P1-T03, P1-T02, P3-T05

---

#### [ ] P4-T06: Wire `AlertFeed` component with real alert data

**Description**: Replace the placeholder empty array in `AlertFeed` (P3-T14) with real computed alerts from `useAlerts`. Add the acknowledge handler. Wire alert count into sidebar badge.

**Files to modify**:
- `src/components/dashboard-panel/components/AlertFeed.tsx` -- connect `onAcknowledge` to `useAlerts` acknowledge function
- `src/components/dashboard-panel/pages/OverviewPage.tsx` -- pass `useAlerts().alerts` to AlertFeed in coach overview
- `src/components/dashboard-panel/layout/SidebarNav.tsx` -- add unacknowledged alert count badge next to Overview nav item

**Acceptance criteria**:
- Real alerts display in the feed
- Acknowledging an alert updates its status and persists across refresh
- Sidebar badge shows correct unacknowledged count
- Empty state shown when no alerts
- Alert count updates in real-time when new logs trigger alerts

**Dependencies**: P4-T05, P3-T14, P3-T15

---

### Frontend / Components -- Analytics

#### [ ] P4-T07: Build Correlation Insights visualization

**Description**: Create a card component that displays a single correlation insight as a scatter plot with regression line and r-value.

**Files to create**:
- `src/components/dashboard-panel/components/CorrelationCard.tsx`

**Props**:
```typescript
interface CorrelationCardProps {
  correlation: CorrelationResult;
}
```

**Implementation**:
- Recharts `ScatterChart` with `Line` overlay for regression
- Title: metric pair names (e.g., "Sleep Quality vs Gym Performance")
- Subtitle: "r = 0.72, n = 45" -- green text for strong positive, red for strong negative
- Wrapped in shadcn `Card`
- Insignificant correlations shown with muted styling and "Insufficient data" disclaimer

**Acceptance criteria**:
- Scatter plot renders data points
- Regression line fits the data visually
- r-value and sample size displayed
- Color coding: |r| > 0.5 = strong color, |r| < 0.3 = muted
- Insignificant correlations show disclaimer

**Dependencies**: P4-T03

---

#### [ ] P4-T08: Build `SleepTrendChart` component

**Description**: Create a dual-axis chart for sleep data: bars for sleep hours, line for sleep quality (P3 feature from spec).

**Files to create**:
- `src/components/dashboard-panel/components/SleepTrendChart.tsx`

**Props**:
```typescript
interface SleepTrendChartProps {
  data: Array<{ date: string; sleepHours: number | null; sleepQuality: number | null }>;
  isLoading?: boolean;
}
```

**Implementation**:
- Recharts `ComposedChart` with `Bar` (sleep hours, left Y axis, `--color-metric-sleep`) and `Line` (sleep quality, right Y axis, dashed)
- Sleep quality mapped from 1-3 scale (per `SLEEP_QUALITY_OPTIONS` in constants) to visual representation
- Wrapped in shadcn `Card` with title "Sleep Trends"

**Acceptance criteria**:
- Both axes labeled correctly (hours on left, quality 1-3 on right)
- Bars and line render on correct axes
- Tooltip shows both values with labels

**Dependencies**: None

---

#### [ ] P4-T09: Add analytics section to ProgressPage

**Description**: Enhance the ProgressPage (P1-T18) with analytics widgets below the weight chart: training load, ACWR, correlations, trends, and sleep.

**Files to modify**:
- `src/components/dashboard-panel/pages/ProgressPage.tsx`

**New sections below the existing weight chart and data table**:
1. Training Load bar chart (Recharts `BarChart` showing `weeklyLoadTrend` from `useTrainingLoad`) + ACWR value with status badge
2. Sleep Trend dual-axis chart (`SleepTrendChart`)
3. Correlation Insights grid (2-col `grid-equal` layout of `CorrelationCard` components)
4. Trend Insights list (cards from `useTrendDetection` -- simple list of insight cards with severity icon and description)

**Acceptance criteria**:
- All analytics sections render with real data
- Sections handle insufficient data gracefully (show "Not enough data yet. Keep logging daily!" messages)
- Layout responsive: stacks to single column on mobile
- Loading states for each section

**Dependencies**: P4-T01, P4-T02, P4-T03, P4-T04, P4-T07, P4-T08

---

### Reporting

#### [ ] P4-T10: Build Weekly Report Generator

**Description**: Create a report generation system that auto-populates a structured weekly summary from DASHBOARD_SPEC.md Section 10.1. This is a component that generates the report on demand (not scheduled).

**Files to create**:
- `src/components/dashboard-panel/components/WeeklyReport.tsx`
- `src/components/dashboard-panel/hooks/useWeeklyReport.ts`

**`useWeeklyReport(athleteId: string, weekStartDate: string)` returns**:
```typescript
interface WeeklyReportData {
  athleteName: string;
  weekLabel: string;      // e.g., "Week of March 10, 2026"
  weight: {
    currentAvg: number | null;
    weeklyChange: number | null;
    weeklyChangePct: number | null;
    rate: number | null;           // from useWeightAnalytics
    phase: string | null;
  };
  training: {
    sessions: number;
    expectedSessions: number;      // default 5
    totalMinutes: number;
    weeklyLoad: number | null;
    acwr: number | null;
    acwrStatus: string | null;
    avgSteps: number | null;
    stepsPct: number | null;
    daysAtGoal: number;
  };
  nutrition: {
    adherencePct: number | null;
    perfectDays: number;
    deviations: number;
    cheatMeals: number;
    weakestDay: string | null;     // day of week with lowest adherence
  };
  recovery: {
    score: number | null;
    avgSleep: number | null;
    sleepQuality: number | null;
    avgHrv: number | null;
    avgStress: number | null;
    avgEnergy: number | null;
  };
  isLoading: boolean;
}
```

**`WeeklyReport` component**:
- Renders the report in a clean, printable format matching the template from DASHBOARD_SPEC.md Section 10.1
- 5 sections: Weight Progress, Training Summary, Nutrition Compliance, Recovery & Biofeedback, Coach Notes
- "Coach Notes" textarea (`src/components/ui/textarea.tsx`) for free text
- "Action Items" list with add/remove functionality
- "Copy to Clipboard" button copies as formatted plain text (for pasting into WhatsApp/chat)
- "Generate for Week" date picker to select any past week
- Also generates the communication template from Section 10.2 (WINS / AREAS TO WATCH / ACTION ITEMS)

**Acceptance criteria**:
- Report auto-populates all numeric fields from data
- Missing data shows "N/A" instead of 0 or undefined
- Copy to clipboard works in a chat-friendly format
- Coach notes editable and included in copy
- Date picker allows generating for any past week
- Accessible from athlete detail page and as standalone page

**Dependencies**: P4-T01, P4-T02, P1-T07, P1-T08

---

### Phase Wrap-Up

#### [ ] P4-T11: Phase 4 verification and changelog

**Description**: Run full build and lint. Test all analytics computations against known data. Test alert triggers with edge cases. Test weekly report generation. Update `CHANGELOG.md`.

**Acceptance criteria**:
- `npm run build` passes with zero errors
- `npm run lint` passes
- Weight analytics: moving averages, deltas, phase detection verified against manual calculation
- Training load and ACWR verified
- At least 3 of 5 correlation insights compute correctly when data available
- Alert system: each of the 14 alert types tested with threshold data
- Weekly report populates all fields correctly
- Copy-to-clipboard produces clean text
- `CHANGELOG.md` updated with Phase 4 entry
- All P4 tasks marked `[x]`

**Dependencies**: All P4 tasks

---

## Phase 5: Polish and Optimization

This phase covers the audit log, responsive polish, performance optimization, error handling, and end-to-end testing.

### Database

#### [ ] P5-T01: Create `audit_log` table and triggers

**Description**: Create the audit log table and trigger functions that automatically log coach actions on athlete data, per DASHBOARD_SPEC.md Section 7.2.

**Files to create**:
- `supabase/migrations/009_create_audit_log.sql`

**SQL**:
```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,          -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches see own audit entries"
  ON audit_log FOR SELECT USING (actor_id = auth.uid());
```

**Trigger function**: Create a generic `audit_coach_action()` trigger that fires on INSERT/UPDATE/DELETE on `meal_plans`, `athlete_goals`, and `foods` when the actor has role = 'coach'. The trigger logs old/new row data as JSONB.

**Acceptance criteria**:
- Audit log captures coach mutations with old/new data
- RLS: coaches can only see their own audit entries
- Trigger fires automatically on meal_plans, athlete_goals, and foods
- No performance impact on athlete-side operations (trigger skips non-coach actors)

**Dependencies**: P3-T01

---

### Performance

#### [ ] P5-T02: Add loading skeletons to all dashboard pages

**Description**: Audit every page and widget in the dashboard and ensure each has a proper loading skeleton that matches the final rendered dimensions. Replace any raw "Loading..." text.

**Files to create**:
- `src/components/dashboard-panel/components/Skeletons.tsx` (collection of skeleton variants)

**Skeleton variants needed**:
- `StatCardSkeleton`: matches StatCard dimensions (card with pulsing value and label areas)
- `ChartSkeleton`: rectangular placeholder for any Recharts chart
- `TableSkeleton`: rows of pulsing bars matching table column widths
- `RadarSkeleton`: circular placeholder matching BiofeedbackRadar dimensions
- `GaugeSkeleton`: circular placeholder matching RecoveryGauge dimensions
- `RingsSkeleton`: concentric circles placeholder matching ComplianceRings

All use Tailwind `animate-pulse` on `bg-muted` elements.

**Files to modify**: Every page and widget component that has an `isLoading` prop.

**Acceptance criteria**:
- Every component has a skeleton that matches its final dimensions
- No layout shift when data loads (skeletons same size as real content)
- Skeletons use consistent Tailwind `animate-pulse` styling

**Dependencies**: All Phase 1-4 tasks

---

#### [ ] P5-T03: Add error boundaries to dashboard pages

**Description**: Wrap each dashboard page in a React error boundary that catches render errors and shows a friendly error UI.

**Files to create**:
- `src/components/dashboard-panel/components/DashboardErrorBoundary.tsx`

**Implementation**:
- Class component extending `React.Component` with `getDerivedStateFromError` and `componentDidCatch`
- Error UI: AlertTriangle icon from Lucide, "Something went wrong" title, error message (in dev mode only), "Try Again" button that resets state
- Logs error to `console.error`

**Files to modify**:
- `src/components/dashboard-panel/routes.tsx` -- wrap each lazy page in `<DashboardErrorBoundary>`

**Acceptance criteria**:
- Rendering errors caught and displayed gracefully
- "Try Again" button resets the error boundary state and re-renders
- Error details visible in development mode only (check `import.meta.env.DEV`)
- No white screen of death on any page

**Dependencies**: None

---

#### [ ] P5-T04: Optimize heavy analytics with `useMemo` and web workers

**Description**: Profile the analytics hooks and ensure expensive computations are properly memoized. Consider web workers for correlation calculations if they exceed 50ms.

**Files to audit**:
- All hooks in `src/components/dashboard-panel/hooks/` -- verify `useMemo` usage with correct dependency arrays

**Optimizations**:
1. Ensure all derived computations wrapped in `useMemo` with correct deps
2. TanStack Query `staleTime` audit: 5 min for dashboard data, 10 min for analytics/profiles
3. If Pearson correlation computation > 50ms (test with 90+ days of data): extract to web worker (`src/components/dashboard-panel/lib/analyticsWorker.ts`)
4. Verify no unnecessary re-renders with React DevTools Profiler

**Acceptance criteria**:
- No unnecessary re-renders (verified with React DevTools profiler)
- Analytics hooks do not block main thread for > 16ms per frame
- Stale times set appropriately per data type
- Dashboard overview page loads in < 2 seconds on a fast connection (3G+ or localhost)

**Dependencies**: All Phase 4 tasks

---

### Responsive Polish

#### [ ] P5-T05: Responsive audit and fixes for all dashboard pages

**Description**: Systematically test every dashboard page at all four breakpoints (1280px, 1024px, 768px, 375px) and fix any layout issues.

**Breakpoint behaviors to verify** (per DASHBOARD_SPEC.md Section 5.2):
- >= 1280px (xl): full sidebar (256px), all table columns visible, grid-stats 4-col
- >= 1024px (lg): narrower sidebar (224px), tables may hide 1-2 low-priority columns
- >= 768px (md): icon rail sidebar (64px), tables responsive
- < 768px (mobile): drawer sidebar, tables switch to card/list view, charts fill width

**Specific checks**:
- DataTables: at mobile, switch from table to card layout (stack columns vertically per row)
- Charts: all Recharts components use `ResponsiveContainer` and scale to parent width
- MealPlanEditor: day tabs scrollable horizontally on mobile
- ComplianceHeatmap: horizontally scrollable with clear scroll affordance
- All touch targets >= 44px on mobile

**Files to modify**: Various page and component files as needed.

**Acceptance criteria**:
- No horizontal overflow/scrolling on any viewport (except intentional scrollable areas)
- All text readable (no truncation without tooltip)
- Touch targets >= 44px on mobile
- Tables switch to card layout below md breakpoint
- Charts scale to container width at all breakpoints
- Navigation fully usable at all breakpoints

**Dependencies**: All Phase 1-4 tasks

---

#### [ ] P5-T06: Build empty states for all tables and lists

**Description**: Audit every DataTable, list, and feed in the dashboard and ensure each has a contextual empty state using the `EmptyState` component (P2-T12).

**Empty states needed**:
- Athletes table: "No athletes assigned yet" with description "Share your coach link to get started."
- Food database (no results): "No foods match your filters." with "Clear Filters" action
- Food database (empty): "No foods in the database yet." with "Add First Food" action (coach only)
- Diet templates: "No diet templates yet." with "Create Template" action
- Logs table: "No logs recorded for this period."
- Alert feed: "No active alerts" with CheckCircle icon and "Everything looks good!" description
- Correlation insights: "Not enough data for insights" with "Keep logging daily for meaningful correlations."
- Goal history: "No goals set yet." with "Set First Goal" action

**Files to modify**: Relevant page components to pass correct empty state props.

**Acceptance criteria**:
- Every list/table has a contextual empty state
- Action buttons navigate to correct destination or trigger correct action
- Empty states visually centered and clear

**Dependencies**: P2-T12

---

### Settings

#### [ ] P5-T07: Build `SettingsPage`

**Description**: Create the Settings page at `/dashboard/settings` with account settings relevant to the dashboard.

**Files to modify**:
- `src/components/dashboard-panel/pages/SettingsPage.tsx` (replace placeholder from P0-T05)

**Sections**:
1. **Profile**: Display name (`username` from profile), email (read-only), role badge
2. **Goals**: Link to `/dashboard/goals`
3. **Preferences**: Default date range for charts (saved to localStorage), unit system from profile (`unit_system: 'metric' | 'imperial'`)
4. **Account**: Sign out button (calls `signOut` from `useAuth`), "Back to Mobile App" link (`/`)
5. **Coach-only: Athlete Management**: List of `coach_athletes` relationships with status toggle (active/paused/terminated) via direct Supabase mutation

**Acceptance criteria**:
- All sections render correctly for both roles
- Preferences saved (localStorage for chart range, profile for unit system)
- Coach can toggle athlete relationship statuses
- Sign out works and redirects to `/`
- "Back to Mobile App" navigates to `/`

**Dependencies**: P0-T12

---

### Testing

#### [ ] P5-T08: End-to-end testing of coach workflows

**Description**: Write a comprehensive manual test script covering all major coach workflows. Execute the tests and fix any issues found.

**Test scenarios**:
1. Coach logs in at `/dashboard`, sees coach overview with stat cards and athlete table
2. Coach searches for an athlete by name in the roster table
3. Coach clicks into athlete detail, verifies all 5 tabs load with correct data
4. Coach adds a new food to the database via Food Database page
5. Coach creates a diet template with 3 days, 2 meals each, multiple foods per meal
6. Coach assigns the template to an athlete, verifies meal_plans created in Supabase
7. Coach sets new macro goals for an athlete via Goals tab
8. Coach generates a weekly report and copies to clipboard
9. Coach views and acknowledges an alert in the alert feed
10. Athlete logs in at `/dashboard` and sees their own dashboard with coach-assigned diet

**Files to create**:
- `tests/dashboard-e2e-checklist.md` (manual test script with numbered steps and expected results)

**Acceptance criteria**:
- All 10 scenarios pass without errors
- Any bugs found during testing are fixed inline
- Test checklist documented for future regression testing

**Dependencies**: All Phase 1-4 tasks

---

### Phase Wrap-Up

#### [ ] P5-T09: Final build verification and changelog

**Description**: Run full build and lint. Final review of all dashboard features. Update `CHANGELOG.md` with Phase 5 and overall dashboard feature summary.

**Acceptance criteria**:
- `npm run build` passes with zero errors and zero warnings
- `npm run lint` passes
- All dashboard features functional across both roles
- All empty states, loading states, and error states work correctly
- Responsive at all 4 breakpoints (1280, 1024, 768, 375)
- Performance acceptable (< 2s page load on localhost, no visible jank during interaction)
- `CHANGELOG.md` updated with Phase 5 entry and overall "Dashboard & Coach Panel" feature summary
- All P5 tasks marked `[x]`
- Every task in this ROADMAP.md marked `[x]`

**Dependencies**: All P5 tasks

---

## Appendix A: File Index

Complete list of new files to be created by this roadmap, organized by directory:

```
supabase/migrations/
  001_add_role_and_helpers.sql                    (P0-T01)
  002_create_coach_athletes.sql                   (P0-T02)
  003_create_diet_templates.sql                   (P2-T01)
  004_alter_meal_plans.sql                        (P2-T02)
  005_alter_foods.sql                             (P2-T03)
  006_coach_rls_policies.sql                      (P3-T01)
  007_create_athlete_goals.sql                    (P3-T02)
  008_get_latest_logs_function.sql                (P3-T03)
  009_create_audit_log.sql                        (P5-T01)

src/components/dashboard-panel/
  DashboardApp.tsx                                (P0-T06)
  routes.tsx                                      (P0-T05)

  contexts/
    AthleteContext.tsx                             (P0-T12, upgraded in P3-T08)

  layout/
    DashboardShell.tsx                            (P0-T07)
    Sidebar.tsx                                   (P0-T08)
    SidebarNav.tsx                                (P0-T08)
    MobileDrawer.tsx                              (P0-T10)
    TopHeader.tsx                                 (P0-T09)
    Breadcrumbs.tsx                               (P0-T11)

  pages/
    OverviewPage.tsx                              (P1-T17, extended in P3-T15)
    ProgressPage.tsx                              (P1-T18, extended in P4-T09)
    GoalsPage.tsx                                 (P1-T19)
    AthletesPage.tsx                              (P3-T10)
    AthleteDetailPage.tsx                         (P3-T11)
    DietEditorPage.tsx                            (P2-T20)
    FoodDatabasePage.tsx                          (P2-T13)
    SettingsPage.tsx                              (P5-T07)

  components/
    StatCard.tsx                                  (P1-T10)
    RecoveryGauge.tsx                             (P1-T11)
    ComplianceRings.tsx                           (P1-T12)
    BiofeedbackRadar.tsx                          (P1-T13)
    WeightTrendChart.tsx                          (P1-T14)
    StepsBarChart.tsx                             (P1-T15)
    TrainingCalendarStrip.tsx                     (P1-T16)
    GoalProgressCard.tsx                          (P1-T19)
    MacroSummaryBar.tsx                           (P2-T15)
    FoodRowEditable.tsx                           (P2-T16)
    MealRow.tsx                                   (P2-T17)
    CopyDayDialog.tsx                             (P2-T18)
    MealPlanEditor.tsx                            (P2-T19)
    FoodFormDialog.tsx                            (P2-T10)
    ConfirmDialog.tsx                             (P2-T11)
    EmptyState.tsx                                (P2-T12)
    AthleteSelector.tsx                           (P3-T08)
    ComplianceHeatmap.tsx                         (P3-T13)
    AlertFeed.tsx                                 (P3-T14)
    CorrelationCard.tsx                           (P4-T07)
    SleepTrendChart.tsx                           (P4-T08)
    WeeklyReport.tsx                              (P4-T10)
    Skeletons.tsx                                 (P5-T02)
    DashboardErrorBoundary.tsx                    (P5-T03)

  tables/
    DataTable.tsx                                 (P2-T05)
    DataTableToolbar.tsx                          (P2-T06)
    DataTablePagination.tsx                       (P2-T07)
    foods-columns.tsx                             (P2-T09)
    athletes-columns.tsx                          (P3-T09)
    logs-columns.tsx                              (P3-T12)

  hooks/
    useDashboardStats.ts                          (P1-T06)
    useRecoveryScore.ts                           (P1-T07)
    useComplianceRings.ts                         (P1-T08)
    useBiofeedbackRadar.ts                        (P1-T09)
    useFoodsQuery.ts                              (P2-T08)
    useDietTemplates.ts                           (P2-T14)
    useAthletes.ts                                (P3-T05)
    useCoachStats.ts                              (P3-T06)
    useAthleteGoals.ts                            (P3-T07)
    useWeightAnalytics.ts                         (P4-T01)
    useTrainingLoad.ts                            (P4-T02)
    useCorrelationInsights.ts                     (P4-T03)
    useTrendDetection.ts                          (P4-T04)
    useAlerts.ts                                  (P4-T05)
    useWeeklyReport.ts                            (P4-T10)

  lib/
    alertEngine.ts                                (P4-T05)
    alertTypes.ts                                 (P4-T05)
    analyticsWorker.ts                            (P5-T04, optional)

tests/
  dashboard-e2e-checklist.md                      (P5-T08)
```

**Modified existing files**:
```
src/main.tsx                                      (P0-T04)
src/index.css                                     (P0-T13)
src/types/database.ts                             (P0-T03, P2-T04, P3-T04)
src/hooks/useProfile.ts                           (P0-T03, P1-T02)
src/hooks/useDashboardData.ts                     (P1-T01)
src/hooks/useHistoryLogs.ts                       (P1-T03)
src/hooks/useStreak.ts                            (P1-T04)
src/hooks/useDietData.ts                          (P1-T05)
CHANGELOG.md                                      (P0-T14, P1-T20, P2-T21, P3-T16, P4-T11, P5-T09)
```

---

## Appendix B: Migration Execution Order

Migrations must be executed in strict order due to dependencies between functions, tables, and policies:

| Order | File | Description | Dependencies |
|---|---|---|---|
| 1 | `001_add_role_and_helpers.sql` | Role column + helper functions | None |
| 2 | `002_create_coach_athletes.sql` | Coach-athlete relationship table | #1 (`is_coach_of` references this table) |
| 3 | `003_create_diet_templates.sql` | Diet template tables | #1 (`get_my_role` used in RLS) |
| 4 | `004_alter_meal_plans.sql` | Add created_by, template_id to meal_plans | #3 (FK to diet_templates) |
| 5 | `005_alter_foods.sql` | Add created_by, updated_at to foods | #1 (`get_my_role` used in RLS) |
| 6 | `006_coach_rls_policies.sql` | Coach access policies on existing tables | #1, #2 (`is_coach_of` used in policies) |
| 7 | `007_create_athlete_goals.sql` | Versioned goals table + backfill | #1, #2 |
| 8 | `008_get_latest_logs_function.sql` | Batch log fetch for roster | #2 (`is_coach_of` used in function) |
| 9 | `009_create_audit_log.sql` | Audit log table + triggers | #6 (triggers on tables with coach policies) |

All migrations are additive -- no existing columns, tables, or policies are dropped or replaced.
