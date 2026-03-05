# Development Roadmap

## Phase 1: The Foundation & Offline Queue (MVP Part 1)
- [ ] Initialize React/Vite project with Tailwind CSS.
- [ ] Set up Supabase project and apply the idempotent SQL schema.
- [ ] Write Python script to parse Excel/CSV files (`Lista Alimenti`, `Piano Alimentare`) and seed Supabase.
- [ ] **State & Cache Setup:** Configure TanStack Query for server state and Dexie for the IndexedDB local queue.
- [ ] **UI:** Build the "Daily Log" mobile form.
- [ ] **Logic:** Implement the local mutation queue and the "Manual Sync" button UI.
- [ ] **UI:** Build the "Today's Diet" read-only view.

## Phase 2: The "Smart Swap" Engine (MVP Part 2)
- [ ] **UI:** Build the searchable Food Database screen.
- [ ] **Logic:** Implement the Swap Algorithm (e.g., `(Target Protein / New Food Protein per 1g) = New Weight`).
- [ ] **UI:** Integrate the swap feature into the "Today's Diet" view.
- [ ] **Logic:** Add macro warning UI for swaps that heavily alter fats or carbs.
- [ ] **Database:** Save the `swapped_food_id` and `swapped_quantity` to the `meal_adherence` table.

## Phase 3: Dashboard & Full Tracking
- [ ] Expand the Daily Log to include remaining Excel columns (Biofeedback, HRV, Blood Glucose).
- [ ] Implement charting (Recharts) for 7-day weight trends and daily steps.
- [ ] Add weekly diet adherence percentage calculation.

## Phase 4: App Polish
- [ ] Add `manifest.json` and app icons for "Add to Home Screen" functionality.
- [ ] Add browser push notifications for daily reminders.