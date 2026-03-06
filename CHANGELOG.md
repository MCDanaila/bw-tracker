# Changelog

All notable changes to the BW Tracker project will be documented in this file.

## [Unreleased] - Current State

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

### 🐛 Bug Fixes
- **TypeScript Import Error:** Fixed `import type` errors in `db.ts` stemming from `verbatimModuleSyntax` rules.
- **401 Unauthorized Fix:** Successfully replaced the dummy UUID used for data saving with the actual authenticated `user.id`. Wait-gated syncing to an authenticated `getSession()` call to bypass unauthorized errors.
- **Data Insertion:** Sanitized form data to cast empty strings from HTML number inputs into SQL-ready `null` values to fix integer type `22P02` syntax errors upon synchronization.
- **Redundant Styles:** Cleared out unused `App.css` and noisy boilerplate CSS from `index.css`.

### 💅 Polish / Architecture
- **React Hook Form:** Setup form submission utilizing refs internally to avoid bloated state re-renders.
- **Responsive Layouts:** Built simple card layouts utilizing tailwind's fluid `grid` and `flex` helpers. 
- **Lucide Icons:** Sprinkled semantic vector icons throughout the interface (Headers, Inputs, Buttons) to dramatically improve UX.
