# Changelog

All notable changes to the BW Tracker project will be documented in this file.

## [Unreleased] - Current State

## [0.7.0] - Dashboard Phase 2: Food Database & Diet Templates

### ✨ Features
- **Food Database Page:** Full CRUD table at `/dashboard/diet/foods` with search (debounced 300ms), unit/state filter dropdowns, sortable columns, pagination, and role-gated add/edit/delete buttons (coach-only). Built on new generic `DataTable`, `DataTableToolbar`, and `DataTablePagination` components powered by `@tanstack/react-table`.
- **Food Form Dialog:** Add/edit dialog with all food fields (name, portion size, unit, calories, protein, carbs, fats, state), auto-slug ID generation, and macro consistency warning when P*4 + C*4 + F*9 deviates > 20% from entered kcal.
- **Confirm Dialog:** Reusable confirmation dialog for destructive actions with destructive/default variants, loading state, and backdrop/Escape close.
- **Empty State Component:** Reusable centered empty state with icon, title, description, and optional action button.
- **Diet Template System (Coach):** Template list view with create/delete, card grid layout showing name, description, and last updated date. Click-through to full meal plan editor per template.
- **Meal Plan Editor:** Compound editor component with 7-day tabs (LUN-DOM), collapsible meal sections, inline food quantity editing, drag-and-drop reorder within meals (`@dnd-kit/core` + `@dnd-kit/sortable`), real-time macro recalculation, daily macro summary bar, "Copy Day" dialog for cloning meals across days, unsaved changes warning via `beforeunload`, and save-all persistence.
- **Macro Summary Bar:** Horizontal stacked bar showing protein (blue), carbs (amber), fats (red) proportional to calorie contribution, with text summary and optional target calorie comparison (green/amber/red color coding).
- **Food Row Editable:** Inline-editable food row with drag handle, food name, quantity input, unit label, live macro display, and delete button.
- **Meal Row:** Collapsible meal section with editable meal name, food list with drag-and-drop sorting, subtotal macros, add food button (opens existing `FoodSearchModal`), and delete meal confirmation.
- **Copy Day Dialog:** Multi-select dialog for copying all meals from one day to others, with Select All/Deselect All toggle and Italian day labels.
- **Diet Editor Page (Athlete View):** Read-only view of assigned meal plan using `MealPlanEditor` with `readOnly` mode, data from `useDietData`.
- **Diet Templates Hook:** `useDietTemplatesList`, `useDietTemplate`, `useCreateDietTemplate`, `useUpdateDietTemplate`, `useDeleteDietTemplate`, and `useAssignTemplate` (copy-on-assign from template to athlete's meal_plans).
- **Foods Query Hook:** `useFoodsQuery` with server-side search, unit/state filtering, pagination via Supabase `.range()`, sorting, and exact count.

### 💅 Schema / Architecture
- **DB Migration 003 — Diet Templates:** Created `diet_templates` and `diet_template_items` tables with RLS policies (coaches CRUD own templates, athletes have no access). Foreign key from `diet_template_items.food_id` to `foods.id`. Day-of-week CHECK constraint (`LUN`-`DOM`).
- **DB Migration 004 — Meal Plans Alter:** Added `created_by` (UUID, references auth.users) and `template_id` (UUID, references diet_templates, ON DELETE SET NULL) columns to `meal_plans`. Backfilled `created_by = user_id` for existing rows.
- **DB Migration 005 — Foods Alter:** Added `created_by` (UUID) and `updated_at` (TIMESTAMPTZ) columns to `foods`. Added coach-specific RLS policy allowing coaches full CRUD on foods.
- **TypeScript Types Updated:** Added `DietTemplate` and `DietTemplateItem` interfaces. Extended `Food` with `created_by` and `updated_at`. Extended `MealPlan` with `created_by` and `template_id`.
- **New Dependencies:** `@tanstack/react-table`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

## [0.6.0] - Dashboard Phase 1: Athlete Dashboard

### ✨ Features
- **Parameterized Hooks:** All core data hooks (`useDashboardData`, `useProfile`, `useHistoryLogs`, `useStreak`, `useDietData`) now accept an optional `userId` parameter, enabling coach-views-athlete data flow through `AthleteContext.effectiveUserId`.
- **Dashboard Stats Hook:** `useDashboardStats` derives current weight, 7-day average weight, weight delta, average steps (7d), and logging streak from `useDashboardData('3m')` + `useStreak`.
- **Recovery Score Hook:** `useRecoveryScore` computes a weighted recovery score (sleep 30%, HRV 25%, soreness 20%, stress 15%, energy 10%) with trend detection vs 7 days ago.
- **Compliance Rings Hook:** `useComplianceRings` calculates 7-day compliance percentages for diet adherence, training frequency (target 5/7), and steps-at-goal days.
- **Biofeedback Radar Hook:** `useBiofeedbackRadar` normalizes 6 biofeedback axes (Digestion, Energy, Mood, Hunger, Libido, Stress) to 0-100 for current vs previous week comparison.
- **Stat Cards:** `StatCard` component with icon, label, value, optional trend indicator (up/down/stable with color coding), and loading skeleton.
- **Recovery Gauge:** SVG 270-degree arc gauge with color zones (red/amber/green), animated fill, and trend indicator.
- **Compliance Rings:** Three concentric SVG progress rings (diet/training/steps) with percentage legend.
- **Biofeedback Radar:** Recharts `RadarChart` comparing current vs previous week across 6 axes with filled polygons.
- **Weight Trend Chart:** Recharts `ComposedChart` with raw weight dots (Scatter), 7-day and 14-day moving averages (Line), target weight reference line, and time range selector (7d/14d/1m/3m/all).
- **Steps Bar Chart:** Recharts `BarChart` with color-coded bars (green/amber/red) based on goal threshold compliance.
- **Training Calendar Strip:** 7-day horizontal strip showing workout type icons, RPE color dots, and duration badges.
- **Goal Progress Cards:** Progress bar cards for goals (target weight, daily steps, daily water) with inverted mode for weight-loss targets.
- **Overview Page:** Full athlete dashboard assembling stat cards, weight trend chart, recovery gauge, compliance rings, training calendar strip, biofeedback radar, and steps bar chart.
- **Progress Page:** Weight trend chart with raw data table (date, weight, steps, sleep, diet adherence) filtered by selected time range.
- **Goals Page:** View/edit goals (target weight, daily steps, daily water) with `react-hook-form`, inline edit form, and progress card display.

## [0.5.0] - Dashboard & Coach Panel — Phase 0: Foundation

### ✨ Features
- **Dashboard Shell & Routing:** Added `react-router-dom` with `BrowserRouter`. The existing mobile app remains at `/`, while a new desktop dashboard lives at `/dashboard/*` with 13 lazy-loaded routes (Overview, Progress, Athletes, Athlete Detail, Diet Editor, Food Database, Templates, Goals, Settings) plus a 404 fallback.
- **DashboardApp Entry Point:** Auth-guarded shell at `/dashboard` that redirects unauthenticated users to `/`, wraps content in `AthleteProvider` context and `DashboardShell` layout.
- **Responsive Sidebar Layout:** `DashboardShell` renders a sidebar (256px at xl, 224px at lg, 64px icon rail at md) alongside a scrollable content area. Below md, the sidebar is replaced by a slide-over `MobileDrawer` with backdrop, Escape-to-close, and nav-click-to-close.
- **Role-Aware Navigation:** `SidebarNav` filters nav items by user role — athletes see 5 items (Overview, Progress, My Diet, Goals, Settings), coaches see 8 items (adds Athletes, Food Database, Templates). Uses `NavLink` for active-route highlighting and tooltips in icon-rail mode.
- **Top Header Bar:** Breadcrumbs (route-aware, clickable segments), user avatar (first letter of email), and a "Coach" badge for coach users. Hamburger button visible only on mobile to trigger the drawer.
- **AthleteProvider Context (Stub):** Provides `effectiveUserId`, `activeAthleteId`, `setActiveAthleteId`, and `isCoach` — enabling the coach-views-athlete pattern for all downstream hooks. Currently defaults to the logged-in user.

### 💅 Schema / Architecture
- **DB Migration 001 — Role System:** Added `role` column (`TEXT NOT NULL DEFAULT 'athlete'`) to `profiles` with CHECK constraint. Created `get_my_role()` and `is_coach_of()` SQL helper functions (STABLE SECURITY DEFINER). Added RLS policy preventing role self-escalation via client.
- **DB Migration 002 — Coach-Athlete Relationships:** Created `coach_athletes` table with `coach_id`, `athlete_id`, `status` (active/paused/terminated), unique constraint, self-reference check, and RLS policies (coaches manage their own rows, athletes can see their own).
- **TypeScript Types Updated:** Added `CoachAthlete` interface to `database.ts`. Added `role: 'athlete' | 'coach'` to `UserProfile` in `useProfile.ts`.
- **Dashboard CSS Tokens:** Added semantic color tokens for metrics (weight, sleep, training, diet, steps, recovery), status levels (excellent, good, warning, danger, neutral), and extended chart palette (chart-6 through chart-8). Added `.grid-stats`, `.grid-panels`, `.grid-equal`, `.dashboard-content` utility classes.

## [0.4.2] - Data Integrity & Schema Alignment Pass

### 🐛 Bug Fixes
- **Digestion Rating Type Mismatch:** `digestion_rating` was stored as `TEXT` in the schema but the form saved numeric values (1–4 from `DIGESTION_OPTIONS`). `DailySummaryCard` was comparing it against hardcoded strings (`=== 'Excellent'`) which always evaluated to false, rendering digestion as `-` for every log. Fixed by changing the column to `INTEGER CHECK (1–4)`, updating the TypeScript type to `number | null`, importing `DIGESTION_OPTIONS` in `DailySummaryCard`, and replacing the broken string comparison with `getLabelByValue(DIGESTION_OPTIONS, ...)`.
- **Wrong `getScoreColor` Max Values:** `DailySummaryCard` was calling `getScoreColor(log.daily_energy, 5)`, `getScoreColor(log.stress_level, 5)`, and `getScoreColor(log.sleep_quality, 10)` — but all three fields use 1–3 discrete scales in the UI. Badge colors were always amber/red because the ratio was always < 0.5. Corrected max to `3` for all three and `4` for digestion.
- **Mock Data Out of Range:** `generate_mock_csv.py` generated values well outside what the app's selectors produce — `sleep_quality` 5–10 (form: 1–3), `stress_level` 1–4 (form: 1–3), `soreness_level` 1–8 (form: 1–3), `gym_energy`/`daily_energy` 3–5 (form: 1–3), `hunger_level` 4–10 (form: 1–5), `libido` 3–9 (form: 1–5), and `digestion_rating` as text strings instead of integers. All corrected to match UI selector ranges.
- **Wrong Workout Sessions in Mock:** Mock used `"Upper"` and `"Lower"` (not present in `WORKOUT_TYPES`) and an empty string `""` as a rest sentinel. Updated to use the canonical values `["Push", "Pull", "Legs", "Cardio", "Rest"]` with rest detection via `workout == "Rest"`.

### ✨ Features
- **Hunger Level & Libido Fields:** Added `hunger_level` (1–5) and `libido` (1–5) input fields to `EndOfDayFlowView` and `EditLogModal`. Added `HUNGER_OPTIONS` and `LIBIDO_OPTIONS` constants to `src/lib/constants.ts`.

### 💅 Schema / Architecture
- **Schema CHECK Constraint Alignment:** Tightened six `daily_logs` CHECK constraints to match the actual discrete ranges used in the UI: `sleep_quality` (0–10 → 1–3), `stress_level` (1–5 → 1–3), `soreness_level` (1–10 → 1–3), `daily_energy` (1–5 → 1–3), `gym_energy` (1–5 → 1–3), `hunger_level` (1–10 → 1–5), `libido` (1–10 → 1–5).

## [0.4.1] - Bug Fix Pass

### 🐛 Bug Fixes
- **Calendar Cell Overlays Sticky Header:** The selected day cell in `HeatmapCalendar` used `z-10 scale-110`, matching the `z-10` on `SyncHeader`. Same z-index with the calendar cell later in DOM order caused it to paint on top of the sticky header when scrolling. Fixed by bumping `SyncHeader` to `z-20`.
- **Today Dashboard Shows 0% After Sync:** `DailyLogHub` only read today's log from `localDB.syncQueue`. Once entries were synced and removed from the queue, `todayLog` was always `null` — leaving the Today dashboard at 0% with no summary card despite Supabase having full data. Fixed by adding a Supabase query for today's date as a fallback when no pending queue entry exists.
- **Editing Pending Log Shows Wrong/Incomplete Data:** Each section save (Morning, Workout, EOD) creates a separate `syncQueue` entry. Editing from `PendingLogs` opened one specific entry, which was often missing data from later saves. Fixed by merging all pending entries for the same date (oldest → newest) before populating the `EditLogModal`, so the form always shows the complete accumulated state.

## [0.4.0] - Dashboard UX Overhaul

### ✨ Features & UX Improvements
- **Unified Today View:** `TodayDashboardView` now renders a full `DailySummaryCard` (reusing the History tab component) in place of the three checkpoint menu buttons once the user has logged any data for today — providing a single, consistent read view across the app.
- **Inline Section Editing:** `DailySummaryCard` gains two new optional edit props: `onEdit` (full-log edit, used by History) and `onEditSection` (section-level navigation, used by Today). Pencil icon buttons appear in the Biofeedback, Workout, and Notes section headers, routing the user directly to the relevant flow form.
- **Edit Past Entries from History:** Tapping "Edit" on any `DailySummaryCard` in the History tab now wraps the selected log into a `SyncAction`, switches to the Tracker tab, and opens `DailyTrackerWizard` pre-filled with that day's data — completing the full round-trip edit flow.
- **Goal Progress Icons:** The Goals Progress collapsible widget now shows matching Lucide icons on each tile (`Droplets` for Water, `Moon` for Sleep, `Activity` for Steps, `Timer` for Cardio), consistent with the icons used in the History summary card.
- **Robust Recovery Score:** Replaced the 2-signal recovery score (sleep quality + stress) with a weighted 5-signal formula covering `sleep_quality` (30%), `sleep_hours` (20%), `stress_level` (25%), `mood` (15%), and `soreness_level` (10%). Available signals are re-weighted proportionally when fields are missing. Score now displays whenever at least one sleep signal is present.
- **Field-Based Completion Tracking:** Section completion in `TodayDashboardView` is now calculated from the actual percentage of fields filled (Morning: 7 fields, Training: 8 fields, End of Day: 6 fields) rather than a binary check on two key fields. A section is marked done at ≥60% filled. Each checkpoint button shows an `"X / Y fields"` subtitle. The top progress bar reflects the average of the three section percentages.

### 💅 Polish / Architecture
- **`onEditSection` / `onEdit` Props on `DailySummaryCard`:** Clean dual-prop design — `onEdit(log)` for history-level editing, `onEditSection(section)` for today's section-level navigation. Section pencil buttons prefer `onEditSection` when available, falling back to `onEdit`.
- **`buildSyncAction` Helper in `App.tsx`:** Extracted a `buildSyncAction(log: DailyLog): SyncAction` helper to consistently wrap synced logs into the local queue format when opening the edit wizard from History.
- **`HistoryView` accepts `onEditLog` prop:** `HistoryView` now forwards an optional `onEditLog` callback from `App.tsx` to `DailySummaryCard`, keeping history-level edit wiring in the top-level `App` component.

## [0.3.0] - Bug Fix & Quality Pass

### 🐛 Bug Fixes
- **Data Loss — Journal Field Mismatch:** Fixed `EndOfDayFlowView` registering the journal textarea as `"notes"` instead of `"general_notes"`, causing every journal entry to be silently dropped on save.
- **Edit Flow State Leak:** Fixed `DailyTrackerWizard` not calling `onClearEdit` after completing an edit, causing `editingLog` in `App.tsx` to never reset and the wizard to re-open in edit mode.
- **Broken Retry Guard:** Fixed `retryCount` not persisting in IndexedDB — the field was in the TypeScript interface but missing from the Dexie store column definition, so every sync retry read it as `undefined` and the 3-attempt cap was never enforced. Users' failed log entries were silently deleted without notification.
- **Zero-Value Completion Detection:** Fixed section completion checks using `!!value` which treated `0` (valid for steps on a rest day, water, etc.) as incomplete. Replaced with explicit `!== null && !== undefined` guards.
- **Hardcoded Steps Goal in Stats:** Fixed `StepsChart` receiving a hardcoded `targetSteps={10000}` instead of the user's profile `steps_goal`.
- **`window.alert` in Auth:** Replaced the only `window.alert()` call (registration success) with a Sonner `toast.success()` for visual consistency.
- **Pre-existing TypeScript Errors:** Fixed three pre-existing TS errors — partial `DailyLog` object cast, `toFixed()` returning `string` instead of `number` for 7-day averages, and `aria-valuemax` accepting `string | number` on the Slider component.

### ✨ Features & UX Improvements
- **Sync Success/Failure Feedback:** `useSync` now fires a `toast.success('All logs synced')` on successful sync and a `toast.error(...)` when a log entry exhausts all retries and is removed from the queue, instead of silently failing.
- **Auto-Sync on Reconnect:** `SyncHeader` now listens for the browser `online` event and automatically triggers sync when the device regains connectivity — no manual button press required.
- **Cache Invalidation After Sync:** `useSync` now invalidates `historyLogs` and `dashboardData` TanStack Query caches after a successful sync so the History and Stats tabs reflect freshly synced data immediately.
- **Live Streak Counter:** `useStreak` replaced its one-shot `useEffect` with Dexie's `useLiveQuery`, so the streak count updates reactively when new logs are added within the same session.
- **Dynamic Recovery Score Message:** The recovery score widget now shows contextual copy based on the actual score (low / medium / high) instead of a hardcoded "strong recovery" message.
- **Session-Only Swap Warning:** Confirming a food swap in the Diet tab now shows a toast informing the user that the swap is session-only and will not persist after navigation.
- **Removed Placeholder Tiles:** Removed the non-functional "Body / Fuel / Drive" dashboard tiles that appeared interactive but had no behaviour, eliminating false affordance.

### ♿ Accessibility
- **Emoji Button Labels:** Added `ariaLabel` field to `MOOD_OPTIONS` and `ENERGY_OPTIONS` constants and wired it through `ButtonGroup` to `aria-label` on each button, replacing emoji-only labels ("😫") with meaningful descriptions ("Very low") for screen readers.
- **Label/Select Association:** Added `htmlFor` / `id` pairs to all `<label>` + `<select>` combinations in `Onboarding` and `ProfileView` so form controls are programmatically associated for assistive technology.
- **Heatmap Touch Targets:** Increased calendar day cells from `w-7 h-7` (28px) to `w-9 h-9` (36px) and month navigation arrows from `p-1.5` to `p-2` to bring tap targets closer to the 44px minimum.
- **Settings Dropdown Keyboard Handling:** Settings dropdown now closes on outside click and on `Escape` key press, with `role="menu"` applied to the container.

### 💅 Polish / Architecture
- **Removed Dead Dependency:** Removed `zustand` from `package.json` — it was listed as a dependency but had zero stores in the codebase.
- **Fixed Invisible Pending Text:** `SyncHeader` pending status text now uses `text-muted-foreground` instead of `text-secondary`, which resolved near-zero contrast (invisible text) in light mode.
- **`retryCount` in Dexie Schema:** Added `retryCount` to both the `SyncAction` TypeScript interface and the Dexie store column list so retry state is correctly persisted across sync attempts.

## [0.2.0] - The Daily Flow Update

### ✨ Features
- **The "Daily Flow" UX Pivot:** Overhauled the monolithic `DailyLogForm` into a progressive "Daily Checkpoints" wizard (`DailyTrackerWizard`).
  - Implemented `TodayDashboardView` for home navigation.
  - Split data entry into focused micro-interactions: `MorningFlowView`, `TrainingFlowView`, and `EndOfDayFlowView`.
  - Saved form states incrementally using `localDB.syncQueue` after each micro-interaction finishes.
- **Data Integrity Constraints:** Hardened the `daily_logs` Supabase table schema with robust `CHECK` constraints mapping to UI boundaries (e.g. `workout_duration <= 600`, `sleep_hours <= 24`).
- **Shared UI Constants:** Decoupled UI option lists (Mood, Stress, Energy emojis) into a centralized `src/lib/constants.ts` file. Automatically parses numerical database values into localized emojis within the `DailySummaryCard`.
- **History & Logs View:** Added a dedicated robust tab for visualizing and analyzing past daily logs:
  - Created a dual-mode `HeatmapCalendar`:
    - **Month View:** A traditional, horizontally ordered calendar layout with month-to-month pagination arrows.
    - **90 Days View:** A continuous, github-style horizontal scrolling heatmap evaluating consistency over the last 3 months.
  - Implemented a `DailySummaryCard` to showcase detailed logging information dynamically upon selecting a day on the calendar.
  - Integrated `useHistoryLogs` hook leveraging `@tanstack/react-query` to pull user's historical `daily_logs` from Supabase.
- **Onboarding Profile Flow:** Created a new `Onboarding` screen forced for new users after registration.
  - Collects core demographic information required for fitness tracking: Gender, Age, Height, Current/Target Weight, Unit System preference, Activity Level, and Primary Goal.
  - Added new backend Supabase `profiles` table to securely store this data using Row Level Security (RLS).
  - Automatically intercepts users without a complete profile layout in the main `App` view.
- **Shadcn UI Integration:** Replaced the legacy custom `src/components/ui/` with official `shadcn/ui` components for better consistency, accessibility, and theming:
  - `Button`, `Input`, `Select`, `Slider`, `Card`, `Table`, `Tabs`, `Dialog`, `ScrollArea`, `Badge`, `Collapsible`, and `Chart`.
- **Shadcn Charts Architecture:** Refactored `WeightChart.tsx` and `StepsChart.tsx` to utilize the modern Shadcn Chart wrapper, which provides a cleaner API over Recharts and automatically syncs with the application's CSS variables.
- **Weekly Overview Redesign:** 
  - Created a dual-view system for the Weekly Diet Overview: 
    - **Charts Mode:** Visualizes weekly calorie and macro averages using interactive BarCharts.
    - **Table Mode:** Transposes the 8-column data grid into a vertical list, perfecting the experience for mobile users without horizontal scrolling.
  - Implemented a unified `Tabs` toggle in the header to switch between "Grafici" and "Tabella" views.
- **Diet Tab Enhancements:** 
  - Refactored "Daily Meals" day-of-week selection into a responsive 2-row grid for better mobile ergonomics.
  - Improved meal card aesthetics with cleaner spacing, backgrounds, and integrated Lucide icons.
- **Theme Standardization:** Standardized all UI elements to use the default Shadcn "Zinc" theme variables, ensuring unified dark/light support across charts and components.

### 🐛 Bug Fixes
- **Timezone Offset Bug:** Refactored native JS `toISOString()` date generation across the entire app with a custom `getLocalDateStr()` utility. This permanently fixed the UTC timezone-shift bug where user-logged data (like `Mar 10`) was accidentally fetching data for the previous day (`Mar 9`) inside `HistoryView` and `HeatmapCalendar`.
- **Chart Color Visibility:** Resolved an issue where chart lines and columns were rendering black by stripping redundant `hsl()` wrappers around CSS variables that already contained their own color space declarations.
- **Theme Inconsistency:** Removed hardcoded light-mode background classes (`bg-white`, `bg-gray-50`) from core layout files (`App.tsx`, `Auth.tsx`, `DailyLogForm.tsx`, etc.) to fix dark mode visual bugs.
- **Mobile Overflow:** Fixed a visual overlap bug where the daily tabs were clipping into the meal cards by introducing a padded grid container with optimized row spacing.

### 💅 Polish / Architecture
- **Component Cleanup:** Deleted obsolete prototype components (`WeeklyOverviewCharts`, `WeeklyOverviewCards`, etc.) and the old `ui-old` folder.
- **Improved Performance:** Optimized `Recharts` rendering by moving domains and averages into `useMemo` hooks.

## [0.1.0] - Initial MVP

### ✨ Features
- **Application Setup:** Initialized an offline-first responsive React app using Vite, TypeScript, and Tailwind CSS.
- **Offline Storage (`Dexie.js`):** Implemented an IndexedDB local queue (`syncQueue`) to save logs even without an internet connection.
- **Daily Log Form:** Created a comprehensive form with three distinct sections:
  - **Morning Metrics:** Fasting weight, sleep hours, sleep quality.
  - **Activity & Gym:** Daily steps, workout type, cardio tracking, RPE, gym energy, and gym mood.
  - **End of Day:** Water tracked, salt intake, digestion rating, bathroom visits, daily energy, and stress tracking.
- **Form Enhancements:** Implemented intelligent default values and live-updating `Slider` components for granular metrics (energy, mood, stress, RPE).
- **Supabase Integration:** Configured the `lib/supabase.ts` client for backend connectivity.
- **Supabase Authentication:** 
  - Created a robust `AuthContext` to manage global session and user state.
  - Built an `Auth.tsx` component handling both User Sign In and Registration.
  - App explicitly redirects unauthenticated users to the login screen.
- **Cloud Synchronization (`useSync`):** Developed a sync engine to push queued local logs to the Supabase `daily_logs` database. It explicitly requires an active user session and leverages Row Level Security (RLS) policies.
- **Pending Logs Manager:** Developed `PendingLogs.tsx`, allowing users to directly view, logically edit, or permanently delete items sitting in the local offline queue before they hit the cloud server.
- **UI Component Library:** Extracted a standardized design system into `src/components/ui/` containing:
  - `Button` (with variants, sizes, and `isLoading` spinner support)
  - `Input` (with icon and error handling support)
  - `Select` (styled wrapper over native select)
  - `Slider` (styled `range` input with custom accent tracking)
- **App Navigation:** Added a responsive bottom navigation bar to switch between the 'Tracker', 'Diet', and 'Stats' views.
- **Diet View (MVP Part 1):** Built the "Today's Diet" read-only view featuring:
  - **Weekly Overview:** A summary table displaying daily total KCAL, P, C, G, and C:G ratio alongside weekly averages.
  - **Daily Meals:** A detailed daily breakdown showing grouped meals, ingredients, quantities, and per-meal macro totals.
  - **Data Fetching:** Implemented `useDietData` using TanStack Query to fetch and aggregate `meal_plans` joined with `foods` from Supabase.
  - **Type Safety:** Added normalized Supabase database types (`Food`, `MealPlan`, `MealAdherence`).
- **Smart Swaps (MVP Part 2):** Developed an intelligent food replacement engine:
  - **Food Database Search:** Added a `FoodSearchModal` backed by a cached TanStack Query hook (`useFoods`) to browse the Supabase food catalog.
  - **Swap Algorithm:** Built a utility that calculates primary macronutrient equivalency (e.g., matching the protein content of 100g Chicken with Salmon) to generate an exact new required quantity.
  - **Interactive Verification:** Added a `SwapPreviewModal` that visualizes the old vs. new food, highlights secondary macro differences, and warns users if a swap drastically alters Fats or Carbs.
  - **UI Integration:** Integrated the engine seamlessly into the Daily Meals table allowing real-time local updates.
- **Dashboard & Analytics (Phase 3):** Developed the "Stats" tab featuring interactive charts using `recharts`:
  - **Time Range Filtering:** Users can dynamically view data for the last 7 days, 14 days, 1 month, 3 months, or all time.
  - **Body Weight Trend:** A responsive `LineChart` visualizing `weight_fasting` with auto-calculating tight domains to highlight micro-fluctuations. Automatically calculates and displays the net weight change across the selected period.
  - **Daily Steps Goal:** A responsive `BarChart` displaying daily `steps` against a 10,000 step reference line, dynamically coloring bars that successfully hit the target.

### 🐛 Bug Fixes
- **TypeScript Import Error:** Fixed `import type` errors in `db.ts` stemming from `verbatimModuleSyntax` rules.
- **401 Unauthorized Fix:** Successfully replaced the dummy UUID used for data saving with the actual authenticated `user.id`. Wait-gated syncing to an authenticated `getSession()` call to bypass unauthorized errors.
- **Data Insertion:** Sanitized form data to cast empty strings from HTML number inputs into SQL-ready `null` values to fix integer type `22P02` syntax errors upon synchronization.
- **Redundant Styles:** Cleared out unused `App.css` and noisy boilerplate CSS from `index.css`.

### 💅 Polish / Architecture
- **React Hook Form:** Setup form submission utilizing refs internally to avoid bloated state re-renders.
- **Responsive Layouts:** Built simple card layouts utilizing tailwind's fluid `grid` and `flex` helpers. 
- **Lucide Icons:** Sprinkled semantic vector icons throughout the interface (Headers, Inputs, Buttons) to dramatically improve UX.
