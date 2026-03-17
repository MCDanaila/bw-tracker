# BW Tracker — Dashboard & Coach Panel Specification

> **Status**: Proposal / Brainstorm
> **Date**: 2026-03-17
> **Stack**: React + Vite + Tailwind v4 + Supabase + shadcn/ui (same as existing app)
> **Target**: Desktop-first, mobile-friendly responsive design

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [User Personas](#2-user-personas)
3. [Feature Set](#3-feature-set)
4. [Information Architecture & Routing](#4-information-architecture--routing)
5. [UX Architecture & Layout](#5-ux-architecture--layout)
6. [UI Design System](#6-ui-design-system)
7. [Backend Architecture](#7-backend-architecture)
8. [Analytics & Data Insights](#8-analytics--data-insights)
9. [Alert System](#9-alert-system)
10. [Reporting](#10-reporting)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Product Vision

### The Problem

The current bw-tracker app is a mobile-first PWA designed for a single athlete logging daily data. It excels at data entry but lacks:

- **Progress visualization**: No comprehensive trend analysis or derived insights
- **Coach workflow**: No way for a coach/nutritionist to manage athletes, assign diets, or monitor compliance
- **Diet management**: Meal plans are static — no editor for creating/modifying diets, no food database CRUD
- **Goal management**: Goals are basic profile fields with no versioning or coach-driven updates

### The Solution

A **Dashboard Panel** — a desktop-first companion interface that serves two user types within the same app:

1. **Athletes** get a rich progress dashboard with trend charts, biofeedback analysis, and self-service goal editing
2. **Coaches** get a multi-athlete management panel to create diets, manage foods, set goals, and monitor athlete progress

### Core Principles

- **Same stack, same repo**: React/Vite/Tailwind/Supabase/shadcn — no new frameworks
- **Additive, not destructive**: The existing mobile app remains untouched; the dashboard is a parallel shell
- **Desktop-first, mobile-friendly**: Designed for laptop/desktop but usable on tablets and phones
- **Offline for athletes, online for coaches**: The coach panel requires connectivity; athlete mobile flows keep offline support

---

## 2. User Personas

### Persona 1: The Athlete (Self-Service)

| Attribute | Detail |
|---|---|
| **Who** | Fitness-focused individual following a structured program |
| **Primary device** | Phone for daily logging, laptop/tablet for reviewing progress |
| **Goals** | Understand trends in their data, see if they're on track, adjust personal goals |
| **Pain points** | Can't see the big picture from daily entries alone; no trend analysis; no way to compare weeks |
| **Key actions** | View weight trajectory, check biofeedback trends, review training load, edit steps/water goals |

### Persona 2: The Coach / Nutritionist

| Attribute | Detail |
|---|---|
| **Who** | Fitness coach or nutritionist managing 5-50 athletes |
| **Primary device** | Laptop/desktop (power-user workflow) |
| **Goals** | Efficiently manage multiple athletes' diets and goals; spot problems early; communicate data-driven feedback |
| **Pain points** | Currently manages via spreadsheets/WhatsApp; no centralized view; manual diet creation is tedious |
| **Key actions** | Create/assign meal plans, manage food database, set macro targets, monitor compliance, receive alerts |

---

## 3. Feature Set

### 3.1 Athlete Dashboard Features

| Feature | Priority | Description |
|---|---|---|
| Weight Trend Chart | P1 | 7-day and 14-day moving averages with raw data scatter, goal line, projected trajectory |
| Recovery Score Gauge | P1 | Composite score (0-100) from sleep, HRV, stress, soreness, energy |
| Weekly Compliance Rings | P1 | Three concentric rings: diet adherence, training, steps |
| Training Calendar Strip | P2 | Week view with workout types, RPE colors, duration |
| Biofeedback Radar Chart | P2 | Spider chart comparing this week vs last week across 6 biofeedback axes |
| Steps Bar Chart | P2 | Daily steps vs goal with color-coded compliance |
| Sleep Trend Chart | P3 | Dual-axis: sleep hours (bars) + sleep quality (line) |
| Hydration Tracker | P3 | Progress bars + sparkline trends |
| Goals Editor | P2 | Edit personal goals (steps, water, target weight) with history |
| Correlation Insights | P3 | Sleep vs gym performance, diet adherence vs weight trend |

### 3.2 Coach Panel Features

| Feature | Priority | Description |
|---|---|---|
| Athlete Roster Table | P1 | Sortable table with sparklines: name, last log, weight trend, adherence, alerts |
| Compliance Heatmap | P1 | Matrix: athletes (rows) x dates (columns), color = compliance score |
| Alert Feed | P1 | Chronological list of critical/warning/info alerts across all athletes |
| Athlete Detail View | P1 | Tabbed view: Overview, Progress, Diet, Goals, Logs |
| Diet Template Editor | P1 | Create reusable meal plan templates with weekly structure |
| Diet Assignment | P1 | Assign templates to athletes (copy-on-assign pattern) |
| Food Database CRUD | P1 | Search, add, edit, delete foods with full macro data |
| Goals Management | P2 | Set versioned goals per athlete (macros, weight target, phase) |
| Athlete Comparison Charts | P2 | Multi-athlete overlay charts for weight, load, compliance |
| Weekly Snapshot Grid | P2 | Card grid with at-a-glance stats per athlete |
| Weekly Report Generator | P3 | Structured report with auto-populated metrics + coach notes |
| Audit Log | P3 | Track all coach actions on athlete data |

---

## 4. Information Architecture & Routing

### 4.1 Two-Shell Strategy

The existing app is a mobile-first SPA with tab-based navigation in `App.tsx`. The dashboard is a separate layout shell sharing the same React app, Supabase client, and component library.

```
src/
  App.tsx                  # Existing mobile shell (unchanged)
  DashboardApp.tsx         # New desktop shell (sidebar + content)
  main.tsx                 # Entry point — routes between shells
```

**Routing** (requires adding `react-router-dom` or TanStack Router):

| URL Pattern | Shell | Purpose |
|---|---|---|
| `/` | Mobile App (`App.tsx`) | Existing athlete PWA, unchanged |
| `/dashboard/*` | `DashboardApp.tsx` | Coach panel + athlete analytics |

### 4.2 Dashboard Route Tree

```
/dashboard
  /                              → Overview (role-adaptive)
  /progress                      → Weight/metrics trends (athlete)
  /athletes                      → Coach only: athlete roster
  /athletes/:id                  → Coach only: single athlete detail
  /athletes/:id/progress         → Coach: athlete's trends
  /athletes/:id/diet             → Coach: athlete's diet editor
  /athletes/:id/goals            → Coach: athlete's goals
  /diet                          → Diet editor
  /diet/foods                    → Food database manager
  /diet/templates                → Meal plan templates (coach)
  /goals                         → Goals editor
  /settings                      → Account settings
```

### 4.3 Sidebar Navigation

**Athlete sees:**

| Icon | Label | Route |
|---|---|---|
| LayoutDashboard | Overview | `/dashboard` |
| TrendingUp | Progress | `/dashboard/progress` |
| Apple | My Diet | `/dashboard/diet` |
| Target | Goals | `/dashboard/goals` |
| Settings | Settings | `/dashboard/settings` |

**Coach sees:**

| Icon | Label | Route |
|---|---|---|
| LayoutDashboard | Overview | `/dashboard` |
| Users | Athletes | `/dashboard/athletes` |
| Apple | Diet Editor | `/dashboard/diet` |
| Database | Food Database | `/dashboard/diet/foods` |
| FileStack | Templates | `/dashboard/diet/templates` |
| Target | Goals | `/dashboard/goals` |
| Settings | Settings | `/dashboard/settings` |

---

## 5. UX Architecture & Layout

### 5.1 Desktop Layout

```
+------------------+----------------------------------------+
|                  |                                        |
|    Sidebar       |          Content Area                  |
|    (256px)       |          (flex-1)                      |
|                  |                                        |
|  - Logo          |    +------------------------------+    |
|  - Nav items     |    |  Page Header / Breadcrumbs   |    |
|  - Athlete       |    +------------------------------+    |
|    selector      |    |                              |    |
|    (coach only)  |    |  Page Content                |    |
|  - User menu     |    |  (scrollable)                |    |
|                  |    |                              |    |
+------------------+----------------------------------------+
```

### 5.2 Responsive Breakpoint Strategy

| Breakpoint | Behavior |
|---|---|
| `>= 1280px` (xl) | Full sidebar (256px) + content. Data tables show all columns. |
| `>= 1024px` (lg) | Sidebar visible (224px). Tables may hide 1-2 columns. |
| `>= 768px` (md) | Sidebar collapses to icon rail (64px) or overlay. |
| `< 768px` (mobile) | Sidebar becomes slide-over drawer. Tables switch to card/list view. |

### 5.3 Key Page Wireframes

#### Dashboard Overview — Athlete View

```
+---------------------------------------------------+
|  Welcome back, [Name]               [date range]  |
+---------------------------------------------------+
|  [Stat Card]  [Stat Card]  [Stat Card] [Stat Card]|
|  Current Wt   7d Avg Wt    Streak      Steps Avg  |
|                                                    |
|  +---------------------------------------------+  |
|  |  Weight Trend Chart (30d default)            |  |
|  +---------------------------------------------+  |
|                                                    |
|  +---------------------+  +---------------------+ |
|  |  Recovery Score      |  |  Weekly Compliance  | |
|  |  Radial Gauge        |  |  Three Rings        | |
|  +---------------------+  +---------------------+ |
|                                                    |
|  +---------------------+  +---------------------+ |
|  |  Training Calendar   |  |  Biofeedback Radar  | |
|  |  (weekly strip)      |  |  (this vs last wk)  | |
|  +---------------------+  +---------------------+ |
+---------------------------------------------------+
```

#### Dashboard Overview — Coach View

```
+---------------------------------------------------+
|  Coach Dashboard                     [date range]  |
+---------------------------------------------------+
|  [Stat Card]      [Stat Card]      [Stat Card]    |
|  Total Athletes   Logs Today       Active Alerts   |
|                                                    |
|  +---------------------------------------------+  |
|  |  Athletes Table                              |  |
|  |  Name | Last Log | Weight | Adherence | Alert|  |
|  |  (click row → athlete detail)                |  |
|  +---------------------------------------------+  |
|                                                    |
|  +---------------------+  +---------------------+ |
|  |  Compliance Heatmap  |  |  Alert Feed         | |
|  |  (athletes x dates)  |  |  (chronological)    | |
|  +---------------------+  +---------------------+ |
+---------------------------------------------------+
```

#### Diet Editor (Coach)

```
+---------------------------------------------------+
|  Diet Plan for [Athlete Name]                      |
|  [Day tabs: LUN MAR MER GIO VEN SAB DOM]          |
+---------------------------------------------------+
|  Meal 1 (PRE)                          [+ Food]   |
|  +---------------------------------------------+  |
|  | Food Name    | Qty | Unit | Kcal | P | C | F | |
|  | Riso Basmati | 80  | g    | 280  |6  |62 |1  | |
|  | Petto Pollo  | 150 | g    | 165  |31 |0  |4  | |
|  +---------------------------------------------+  |
|  Subtotal:                    445   37  62  5      |
|                                                    |
|  Meal 2                                [+ Food]   |
|  +---------------------------------------------+  |
|  | ...                                          |  |
|  +---------------------------------------------+  |
|                                                    |
|  [+ Add Meal]                                      |
|                                                    |
|  Daily Totals: Kcal: 2,450 | P: 185g | C: 280g   |
|                                                    |
|  [Copy Day To...]  [Save Changes]                  |
+---------------------------------------------------+
```

#### Food Database Manager

```
+---------------------------------------------------+
|  Food Database                       [+ Add Food]  |
+---------------------------------------------------+
|  [Search: ___________]  [Filter: unit] [state]     |
|                                                    |
|  +---------------------------------------------+  |
|  | Name           | Portion | Unit | Kcal | P  |  |
|  | Riso Basmati   | 100     | g    | 350  | 8  |  |
|  | Petto di Pollo | 100     | g    | 110  | 23 |  |
|  | Uova intere    | 1       | piece| 78   | 6  |  |
|  +---------------------------------------------+  |
|  [Pagination: < 1 2 3 ... >]                      |
+---------------------------------------------------+
```

### 5.4 Component Strategy

#### Existing shadcn Components to Reuse

`button`, `card`, `input`, `label`, `select`, `table`, `tabs`, `dialog`, `badge`, `tooltip`, `chart` (recharts), `scroll-area`, `separator`, `slider`, `progress`, `collapsible`, `textarea`, `stepper`, `button-group`

#### Existing App Components to Reuse (with parameterization)

| Component | Change Needed |
|---|---|
| `WeightChart` | Already accepts data as props — no change |
| `StepsChart` | Already accepts data as props — no change |
| `DailySummaryCard` | Already accepts log as props — no change |
| `WeeklyOverview` | Already accepts data as props — no change |
| `FoodSearchModal` | Already standalone — reuse directly |

#### Hooks to Parameterize

All data hooks need an optional `userId` parameter (default: current user). This is a non-breaking change.

```typescript
// Before
const { user } = useAuth();
return useQuery({ queryKey: ['profile', user?.id], ... });

// After
export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId ?? user?.id;
  return useQuery({ queryKey: ['profile', targetId], ... });
};
```

Hooks to update: `useDashboardData`, `useDietData`, `useHistoryLogs`, `useProfile`, `useStreak`

#### New Compound Components Needed

| Component | Purpose |
|---|---|
| `DashboardShell` | Sidebar + content wrapper layout |
| `Sidebar` / `SidebarNav` | Collapsible, role-aware navigation |
| `MobileDrawer` | Slide-over sidebar for mobile |
| `Breadcrumbs` | Route-aware breadcrumb trail |
| `DataTable` | Generic table with sorting, filtering, pagination (TanStack Table) |
| `DataTableToolbar` | Search input + filter dropdowns |
| `DataTablePagination` | Page controls |
| `StatCard` | Metric card with label, value, trend indicator |
| `AthleteSelector` | Combobox for coach to pick active athlete |
| `MealPlanEditor` | Full meal plan builder with day tabs |
| `MealRow` | Meal group within editor (food rows + subtotals) |
| `FoodRowEditable` | Inline-editable food row with quantity, delete, drag handle |
| `BiofeedbackRadar` | Radar/spider chart (Recharts RadarChart) |
| `MacroSummaryBar` | Horizontal bar showing kcal/P/C/F breakdown |
| `GoalProgressCard` | Current vs target with progress bar |
| `RecoveryGauge` | Radial gauge (0-100) with color zones |
| `ComplianceRings` | Three concentric progress rings |
| `CopyDayDialog` | Multi-select day picker for "Copy Day To" |
| `FoodFormDialog` | Add/edit food form in a dialog |
| `ConfirmDialog` | Reusable confirmation dialog |
| `EmptyState` | Illustrated empty state for tables/lists |

### 5.5 File Structure

```
src/
  components/
    dashboard-panel/
      DashboardApp.tsx
      layout/
        DashboardShell.tsx
        Sidebar.tsx
        SidebarNav.tsx
        MobileDrawer.tsx
        Breadcrumbs.tsx
        TopHeader.tsx
      pages/
        OverviewPage.tsx
        AthletesPage.tsx
        AthleteDetailPage.tsx
        DietEditorPage.tsx
        FoodDatabasePage.tsx
        GoalsPage.tsx
        ProgressPage.tsx
        SettingsPage.tsx
      components/
        StatCard.tsx
        AthleteSelector.tsx
        BiofeedbackRadar.tsx
        MacroSummaryBar.tsx
        GoalProgressCard.tsx
        RecoveryGauge.tsx
        ComplianceRings.tsx
        MealPlanEditor.tsx
        MealRow.tsx
        FoodRowEditable.tsx
        CopyDayDialog.tsx
        FoodFormDialog.tsx
        ConfirmDialog.tsx
        EmptyState.tsx
      tables/
        DataTable.tsx
        DataTableToolbar.tsx
        DataTablePagination.tsx
        athletes-columns.tsx
        logs-columns.tsx
        foods-columns.tsx
      hooks/
        useAthletes.ts
        useAthleteContext.ts
        useCoachStats.ts
        useDietTemplates.ts
```

### 5.6 State Management: The "Active Athlete" Context

The central state challenge: when a coach views the dashboard, every data-fetching hook needs to know *which athlete's data to fetch*.

```typescript
interface AthleteContextValue {
  activeAthleteId: string | null;     // null = viewing own data
  setActiveAthleteId: (id: string) => void;
  isCoach: boolean;
  effectiveUserId: string;            // The ID to use for all queries
}
```

- `DashboardApp` wraps content in `<AthleteProvider>`
- For athletes: `effectiveUserId` is always the current user
- For coaches: `effectiveUserId` switches when they select an athlete
- All parameterized hooks use `effectiveUserId` as query parameter
- TanStack Query cache keys include the athlete ID to avoid cross-athlete pollution

---

## 6. UI Design System

### 6.1 Design Tokens Extension

The existing Tailwind v4 theme (`index.css`) already defines core tokens. The dashboard adds semantic colors:

```css
@theme inline {
  /* Dashboard-specific semantic colors */
  --color-metric-weight: var(--color-blue-500);
  --color-metric-sleep: var(--color-indigo-500);
  --color-metric-training: var(--color-orange-500);
  --color-metric-diet: var(--color-amber-500);
  --color-metric-steps: var(--color-emerald-500);
  --color-metric-recovery: var(--color-green-500);

  /* Status colors for compliance */
  --color-status-excellent: var(--color-green-500);   /* 80-100% */
  --color-status-good: var(--color-emerald-500);      /* 60-80% */
  --color-status-warning: var(--color-amber-500);     /* 40-60% */
  --color-status-danger: var(--color-red-500);        /* 0-40% */
  --color-status-neutral: var(--color-slate-400);     /* no data */

  /* Chart palette (8 colors for multi-line) */
  --color-chart-1: #3b82f6;
  --color-chart-2: #10b981;
  --color-chart-3: #f59e0b;
  --color-chart-4: #ef4444;
  --color-chart-5: #8b5cf6;
  --color-chart-6: #ec4899;
  --color-chart-7: #06b6d4;
  --color-chart-8: #84cc16;
}
```

### 6.2 Typography Scale (Desktop Additions)

| Token | Size | Usage |
|---|---|---|
| `text-page-title` | 24px / 1.3 | Page headings (Overview, Athletes) |
| `text-section-title` | 18px / 1.4 | Card/section titles |
| `text-stat-value` | 32px / 1.1 | Large metric numbers in StatCard |
| `text-stat-label` | 12px / 1.5 | Metric labels, uppercase, tracking-wide |
| `text-table-header` | 13px / 1.4 | Data table column headers |
| `text-table-cell` | 14px / 1.5 | Data table cell content |

### 6.3 Dashboard Grid System

```css
/* Stat cards: responsive grid */
.grid-stats { @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4; }

/* Two-panel layout */
.grid-panels { @apply grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6; }

/* Equal two-panel */
.grid-equal { @apply grid grid-cols-1 lg:grid-cols-2 gap-6; }

/* Use container queries for widget-level responsiveness */
.dashboard-content { container-type: inline-size; }
```

### 6.4 Key Chart Specifications

| Chart | Type | Library | Key Config |
|---|---|---|---|
| Weight Trend | Scatter + Line combo | Recharts | Raw dots (opacity 0.3) + 7d MA solid line + 14d MA dashed |
| Recovery Gauge | Radial donut (270°) | Custom SVG or Recharts | Zones: 0-40 red, 41-60 amber, 61-80 green, 81-100 bright green |
| Compliance Rings | Concentric progress | Custom SVG | 3 rings: diet (amber), training (blue), steps (emerald) |
| Biofeedback Radar | Radar/spider | Recharts RadarChart | 6 axes, filled current (blue 30%) + outline previous (grey dashed) |
| Training Calendar | Custom component | Custom | 7-cell strip with workout icons, RPE color dots |
| Steps Bar | Bar chart | Recharts | Color by compliance: green (>=goal), amber (>=80%), red (<80%) |
| Heatmap (Coach) | Matrix grid | Custom | Athletes x Dates, continuous color scale |

---

## 7. Backend Architecture

### 7.1 Role System

**Approach**: `role` column on `profiles` table + JWT custom claim for client-side gating.

```sql
-- Add role to profiles
ALTER TABLE profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'athlete'
  CHECK (role IN ('athlete', 'coach'));
```

**Helper functions:**

```sql
-- Fast role lookup (JWT first, DB fallback)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
$$;

-- Check if caller is an active coach of the target athlete
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

### 7.2 New Tables

#### `coach_athletes` — Relationship Table

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
```

#### `diet_templates` — Reusable Diet Templates

```sql
CREATE TABLE public.diet_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.diet_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES diet_templates(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('LUN','MAR','MER','GIO','VEN','SAB','DOM')),
  meal_name TEXT NOT NULL,
  food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
  target_quantity NUMERIC NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
```

#### `athlete_goals` — Versioned Goals

```sql
CREATE TABLE public.athlete_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_by UUID NOT NULL REFERENCES auth.users(id),
  target_weight NUMERIC,
  steps_goal INTEGER,
  water_goal NUMERIC,
  target_calories INTEGER,
  target_protein NUMERIC,
  target_carbs NUMERIC,
  target_fats NUMERIC,
  phase TEXT CHECK (phase IN ('bulk', 'cut', 'maintenance', 'reverse_diet')),
  notes TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,  -- NULL = current
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one "current" goal set per athlete
CREATE UNIQUE INDEX idx_athlete_goals_current
  ON athlete_goals(athlete_id) WHERE effective_until IS NULL;
```

#### `audit_log` — Coach Action Trail

```sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 Modifications to Existing Tables

```sql
-- meal_plans: track who created it and from which template
ALTER TABLE meal_plans
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN template_id UUID REFERENCES diet_templates(id) ON DELETE SET NULL;

-- Backfill existing meal plans
UPDATE meal_plans SET created_by = user_id WHERE created_by IS NULL;

-- foods: track creator and modification time
ALTER TABLE foods
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
```

### 7.4 RLS Policy Updates

**Principle**: Existing "user accesses own data" policies stay. New additive policies grant coach access via `is_coach_of()`. Postgres RLS is OR-based — if any policy grants access, the row is visible.

```sql
-- Coaches can view their athletes' profiles
CREATE POLICY "Coaches can view athlete profiles"
  ON profiles FOR SELECT USING (public.is_coach_of(id));

-- Coaches can view (not write) their athletes' daily logs
CREATE POLICY "Coaches can view athlete daily logs"
  ON daily_logs FOR SELECT USING (public.is_coach_of(user_id));

-- Coaches can view athlete meal adherence
CREATE POLICY "Coaches can view athlete meal adherence"
  ON meal_adherence FOR SELECT USING (public.is_coach_of(user_id));

-- Coaches can full CRUD meal plans for their athletes
CREATE POLICY "Coaches view athlete meal plans"
  ON meal_plans FOR SELECT USING (public.is_coach_of(user_id));
CREATE POLICY "Coaches create athlete meal plans"
  ON meal_plans FOR INSERT WITH CHECK (public.is_coach_of(user_id));
CREATE POLICY "Coaches update athlete meal plans"
  ON meal_plans FOR UPDATE USING (public.is_coach_of(user_id) AND created_by = auth.uid());
CREATE POLICY "Coaches delete athlete meal plans"
  ON meal_plans FOR DELETE USING (public.is_coach_of(user_id) AND created_by = auth.uid());

-- Coaches can manage the food database
CREATE POLICY "Coaches can manage foods"
  ON foods FOR ALL
  USING (public.get_my_role() = 'coach')
  WITH CHECK (public.get_my_role() = 'coach');

-- Prevent role self-escalation
CREATE POLICY "Users can update own profile (restricted)"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );
```

### 7.5 Key API Patterns

#### Coach: Fetch Athletes with Latest Stats

```sql
-- Postgres function to avoid N+1 queries
CREATE OR REPLACE FUNCTION public.get_latest_logs_for_athletes(athlete_ids UUID[])
RETURNS TABLE (
  user_id UUID, date DATE, weight_fasting NUMERIC, steps INTEGER,
  water_liters NUMERIC, diet_adherence TEXT, sleep_quality NUMERIC, daily_energy NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT ON (dl.user_id)
    dl.user_id, dl.date, dl.weight_fasting, dl.steps,
    dl.water_liters, dl.diet_adherence, dl.sleep_quality, dl.daily_energy
  FROM daily_logs dl
  WHERE dl.user_id = ANY(athlete_ids) AND public.is_coach_of(dl.user_id)
  ORDER BY dl.user_id, dl.date DESC;
$$;
```

#### Coach: Assign Diet Template to Athlete

```typescript
const assignTemplate = async (templateId: string, athleteId: string) => {
  // 1. Fetch template items
  const { data: items } = await supabase
    .from('diet_template_items')
    .select('*')
    .eq('template_id', templateId);

  // 2. Delete existing coach-created meal plans for this athlete
  await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', athleteId)
    .eq('created_by', coachId);

  // 3. Insert new meal plans from template
  const newPlans = items.map(item => ({
    id: crypto.randomUUID(),
    user_id: athleteId,
    day_of_week: item.day_of_week,
    meal_name: item.meal_name,
    food_id: item.food_id,
    target_quantity: item.target_quantity,
    created_by: coachId,
    template_id: templateId,
  }));

  await supabase.from('meal_plans').insert(newPlans);
};
```

### 7.6 Diet Management Workflow

```
Coach creates diet_template
        ↓
Coach assigns template to athlete
        ↓
System copies template items → meal_plans (user_id=athlete, created_by=coach)
        ↓
Athlete sees meal_plans as usual (no change to mobile UI)
        ↓
Athlete logs meal_adherence as usual
        ↓
Coach views adherence data in coach panel
```

This "copy on assign" pattern keeps the athlete's offline flow working unchanged. Editing a template does NOT retroactively change assigned plans — you re-assign to push updates.

### 7.7 Migration Strategy

All migrations are **additive only** — no columns dropped, no existing data deleted.

| Order | Migration | Impact |
|---|---|---|
| 1 | Add `role` column to profiles + helper functions | Zero impact on existing queries |
| 2 | Create `coach_athletes` table | New table, no existing data affected |
| 3 | Create `diet_templates` + `diet_template_items` | New tables |
| 4 | Add `created_by`, `template_id` to `meal_plans` + backfill | Nullable columns added |
| 5 | Create `athlete_goals` + backfill from profiles | New table, profiles unchanged |
| 6 | Add `created_by`, `updated_at` to `foods` | Nullable columns added |
| 7 | Create `audit_log` + triggers | New table |
| 8 | Add coach RLS policies to existing tables | Additive OR-based policies |

### 7.8 Security Summary

| Layer | Mechanism |
|---|---|
| Row Level | `is_coach_of()` checks `coach_athletes` on every query |
| JWT | `app_metadata.role` prevents client-side UI spoofing |
| Function Level | `SECURITY DEFINER` functions validate caller role |
| Audit | Every coach mutation logged to `audit_log` |
| Relationship | Coach access instantly revocable by setting `status = 'terminated'` |
| Role Escalation | Profile update policy prevents self-promotion to coach |

---

## 8. Analytics & Data Insights

### 8.1 Derived Metrics

#### Weight & Body Composition

| Metric | Calculation |
|---|---|
| 7-day Moving Average | `AVG(weight_fasting) OVER (ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` |
| 14-day Moving Average | Same, 13 preceding rows |
| Weekly Delta (kg) | `current_7d_avg - previous_7d_avg` |
| Weekly Delta (%) | `(weekly_delta / previous_7d_avg) * 100` |
| Rate of Change | Linear regression slope over 14 days, scaled to 7 |

#### Training Load

| Metric | Calculation |
|---|---|
| Session RPE Load | `gym_rpe * workout_duration` (sRPE method) |
| Weekly Training Load | `SUM(session_rpe_load)` per week |
| Acute:Chronic Workload Ratio (ACWR) | `AVG(weekly_load, 1 week) / AVG(weekly_load, 4 weeks)` |
| Steps Compliance (%) | `(steps / steps_goal) * 100` |

#### Recovery & Biofeedback

| Metric | Calculation |
|---|---|
| Sleep Quality Index | `(sleep_hours/8 * 0.4) + (sleep_quality/5 * 0.3) + (sleep_score/100 * 0.3)` → 0-100 |
| Recovery Score | Weighted composite: sleep (30%), HRV (25%), soreness (20%), stress (15%), energy (10%) |
| Biofeedback Composite | `AVG(normalize(digestion, energy, mood, hunger, libido))` → 0-100 |
| HRV Coefficient of Variation | `STDDEV(hrv, 7d) / AVG(hrv, 7d) * 100` |

#### Nutrition Compliance

| Metric | Calculation |
|---|---|
| Daily Adherence Score | perfect=100, minor_deviation=70, cheat_meal=30 |
| Weekly Adherence Rate | `AVG(daily_adherence_score)` per week |
| Meal Completion Rate | `COUNT(is_completed=true) / COUNT(total_planned_meals) * 100` |
| Swap Frequency | `COUNT(swapped_food_id IS NOT NULL) / COUNT(meal_adherence) * 100` |

### 8.2 Correlation Insights

| Correlation | Method | Minimum Sample |
|---|---|---|
| Sleep Quality → Gym Performance | Pearson: previous night sleep index vs next day gym_energy | 20 data points |
| Diet Adherence → Weight Trend | Weekly adherence vs weight delta (2-week lag) | 8 weeks |
| Stress → Mood & Recovery | Rolling 7-day correlation between stress, mood, energy | 14 data points |
| Training Load → Weight & Biofeedback | Lag-correlation at 0-7 day offsets | 4 weeks |
| Hydration & Salt → Weight Fluctuation | Daily water/salt vs next-morning weight delta | 14 data points |

**Visualization**: Scatter plots with regression lines, confidence bands, and displayed r-values. Correlation matrix heatmap for all biofeedback variables.

### 8.3 Trend Detection

- **Weight phase detection**: Auto-label periods as "Cutting" (slope < -0.15 kg/wk), "Maintaining" (±0.15), or "Gaining" (> +0.15)
- **Training overreach**: When training load increases AND recovery decreases for 2+ weeks → flag "Overreaching risk"
- **Diet patterns**: Compare weekday vs weekend adherence; if weekend is 20+ points lower → generate insight
- **Biofeedback deterioration**: If 7-day composite drops 15+ points from 30-day average → flag

---

## 9. Alert System

### 9.1 Alert Definitions

| Alert | Severity | Trigger | Cooldown |
|---|---|---|---|
| Rapid Weight Loss | Critical | 7d avg drops > 1.5% of bodyweight in one week | 7 days |
| Rapid Weight Gain | Critical | 7d avg increases > 2% of bodyweight in one week | 7 days |
| Logging Gap | Critical | No daily_log for 2+ consecutive days | Resets on entry |
| High ACWR | Critical | ACWR exceeds 1.5 | 7 days |
| Low ACWR | Warning | ACWR below 0.8 for 2+ weeks | 14 days |
| Diet Adherence Streak | Warning | 3+ consecutive days below "perfect" | 3 days |
| Low Recovery Trend | Warning | Recovery score below 40 for 3+ days | 5 days |
| HRV Drop | Warning | 7d avg drops > 15% below 30d avg | 7 days |
| Sleep Deficit | Warning | Avg sleep below 6 hours for 5 of last 7 days | 7 days |
| Elevated Stress | Warning | Avg stress above 4 for 5 of last 7 days | 5 days |
| Hydration Low | Info | Water below 50% of goal for 3+ days | 3 days |
| Steps Under | Info | Steps below 70% of goal for 5 of last 7 days | 7 days |
| Personal Best | Info | Highest weekly training load or longest streak | Once per event |
| Adherence Milestone | Info | 7, 14, 30 days of perfect adherence | Once per milestone |

### 9.2 Alert Lifecycle

1. **Triggered** → condition met, alert created
2. **Active** → displayed to coach and/or athlete
3. **Acknowledged** → coach taps "Seen", logs acknowledgment
4. **Resolved** → trigger condition no longer met (automatic)
5. **Cooldown** → same alert suppressed for cooldown period

---

## 10. Reporting

### 10.1 Weekly Summary Report (Auto-Generated Every Monday)

```
WEEKLY REPORT — [Athlete Name] — Week of [Date]

1. WEIGHT PROGRESS
   Current 7d avg: XX.X kg | Weekly change: ±X.X kg (X.X%)
   Rate: X.X kg/week | Trend: Cutting / Maintaining / Gaining
   [Mini weight chart, 4-week view]

2. TRAINING SUMMARY
   Sessions: X/X | Total minutes: XXX | Weekly load (sRPE): XXXX
   ACWR: X.XX (Sweet Spot / Caution / Risk)
   Avg steps: XX,XXX (XX% of goal) | Days at goal: X/7

3. NUTRITION COMPLIANCE
   Adherence: XX% | Perfect days: X/7 | Deviations: X | Cheat: X
   Meal completion: XX% | Swaps: X | Weakest day: [Day]

4. RECOVERY & BIOFEEDBACK
   Recovery score: XX/100 | Avg sleep: X.X hrs (quality: X.X/5)
   Avg HRV: XX (vs 30d baseline) | Stress: X.X/5 | Energy: X.X/5
   [Biofeedback radar: this week vs last week]

5. COACH NOTES
   [Free text field]
   [Action items for next week]
```

### 10.2 Coach Communication Template

```
Hey [Name],

WINS THIS WEEK:
- [Auto-generated from positive metrics]

AREAS TO WATCH:
- [Auto-generated from concerning trends]

ACTION ITEMS:
1. [Coach-written actions]
2. [Coach-written actions]
```

---

## 11. Implementation Roadmap

### Phase 0: Foundation (1 sprint)

- Install `react-router-dom` (or TanStack Router)
- Wire `main.tsx` to route between `App.tsx` (mobile) and `DashboardApp.tsx` (dashboard)
- DB migration: add `role` to profiles, create `coach_athletes` table
- Create `DashboardShell`, `Sidebar`, `TopHeader`, `MobileDrawer` — static layout with placeholder pages

### Phase 1: Athlete Dashboard (1-2 sprints)

- `StatCard` component + overview page for athletes
- Weight trend chart (reuse `WeightChart` with enhanced data)
- Recovery gauge, compliance rings, biofeedback radar
- Parameterize existing hooks (`useDashboardData`, `useProfile`, etc.)
- Goals editor page

### Phase 2: Food & Diet Management (2 sprints)

- `DataTable` component (TanStack Table + shadcn `table`)
- Food Database Manager: search, filter, CRUD with `FoodFormDialog`
- DB migration: create `diet_templates`, `diet_template_items`
- Diet Template Editor: weekly structure with meals and foods
- Diet assignment flow (template → meal_plans copy)

### Phase 3: Coach Multi-Athlete (1-2 sprints)

- DB migration: coach RLS policies on all existing tables
- `AthleteSelector` combobox + `AthleteContext` provider
- Athletes roster page with `DataTable`
- Athlete detail page (tabbed: Overview, Progress, Diet, Goals, Logs)
- Coach overview page with compliance heatmap and alert feed

### Phase 4: Analytics & Alerts (1-2 sprints)

- Derived metrics computation (moving averages, ACWR, recovery score)
- Trend detection and phase labeling
- Correlation insights (with minimum data thresholds)
- Alert system with triggers, lifecycle, and coach notification feed
- Weekly report generator

### Phase 5: Polish & Optimization (1 sprint)

- Audit log with triggers
- Responsive polish across all breakpoints
- Performance optimization (web workers for heavy calculations, query caching)
- Empty states, loading skeletons, error boundaries
- End-to-end testing of coach workflows

---

## Summary of New/Modified Database Objects

| Object | Type | Status |
|---|---|---|
| `profiles.role` | Column | ADD |
| `coach_athletes` | Table | NEW |
| `diet_templates` | Table | NEW |
| `diet_template_items` | Table | NEW |
| `athlete_goals` | Table | NEW |
| `audit_log` | Table | NEW |
| `meal_plans.created_by` | Column | ADD |
| `meal_plans.template_id` | Column | ADD |
| `foods.created_by` | Column | ADD |
| `foods.updated_at` | Column | ADD |
| `get_my_role()` | Function | NEW |
| `is_coach_of()` | Function | NEW |
| `set_user_role()` | Function | NEW |
| `get_latest_logs_for_athletes()` | Function | NEW |
| `audit_coach_action()` | Trigger Function | NEW |
| 8+ new RLS policies | Policies | NEW |
| 2 replaced RLS policies | Policies | MODIFIED |

---

## New Dependencies

| Package | Purpose |
|---|---|
| `react-router-dom` (or `@tanstack/react-router`) | URL routing for dashboard shell |
| `@tanstack/react-table` | Headless data table (sorting, filtering, pagination) |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop for meal plan editor |

All other dependencies (Recharts, react-hook-form, TanStack Query, Tailwind, shadcn, Supabase) are already in the project.
