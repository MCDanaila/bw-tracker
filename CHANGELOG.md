# Changelog

All notable changes to the BW Tracker project will be documented in this file.

## [Unreleased] - Current State

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
